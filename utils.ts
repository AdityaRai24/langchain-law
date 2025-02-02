import {
  Pinecone,
  PineconeRecord,
  RecordMetadata,
} from "@pinecone-database/pinecone";
import { FeatureExtractionPipeline } from "@xenova/transformers";
import { Document } from "langchain/document";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { batchsize } from "./config";
import { HfInference } from "@huggingface/inference";

let callback: (
  filename: string,
  totalChunks: number,
  chunksUpserted: number,
  isComplete: boolean
) => Promise<void>;
let totalDocumentChunks: number;
let totalDocumentChunksUpseted: number;

export async function updateVectorDB(
  client: Pinecone,
  indexname: string,
  namespace: string,
  docs: Document[],
  progressCallback: (
    filename: string,
    totalChunks: number,
    chunksUpserted: number,
    isComplete: boolean
  ) => Promise<void>
) {
  if (typeof window !== "undefined") {
    throw new Error("This function must be run on the server side");
  }

  try {
    const { pipeline, env } = await import("@xenova/transformers");
    callback = progressCallback;
    totalDocumentChunks = 0;
    totalDocumentChunksUpseted = 0;
    const modelname = "mixedbread-ai/mxbai-embed-large-v1";
    const extractor = await pipeline("feature-extraction", modelname, {
      quantized: false,
    });
    console.log("Model loaded successfully");
    for (const doc of docs) {
      await processDocument(client, indexname, namespace, doc, extractor);
    }
    if (callback !== undefined) {
      callback(
        "filename",
        totalDocumentChunks,
        totalDocumentChunksUpseted,
        true
      );
    }
    console.log("Vector DB update completed");
  } catch (error) {
    console.error("Error updating vector DB:", error);
    throw error;
  }
}
async function processDocument(
  client: Pinecone,
  indexname: string,
  namespace: string,
  doc: Document<Record<string, any>>,
  extractor: FeatureExtractionPipeline
) {
  const splitter = new RecursiveCharacterTextSplitter();
  const documentChunks = await splitter.splitText(doc.pageContent);
  totalDocumentChunks = documentChunks.length;
  totalDocumentChunksUpseted = 0;
  const filename = getFilename(doc.metadata.source);

  console.log(documentChunks.length);
  let chunkPatchIndex = 0;
  while (documentChunks.length > 0) {
    chunkPatchIndex++;
    const chunkBatch = documentChunks.splice(0, batchsize);
    await processOneBatch(
      client,
      indexname,
      namespace,
      extractor,
      chunkBatch,
      chunkPatchIndex,
      filename
    );
  }
}

function getFilename(filename: string): string {
  const normalizedFilename = filename.replace(/\\/g, "/");

  const lastSlashIndex = normalizedFilename.lastIndexOf("/");
  const lastDotIndex = normalizedFilename.lastIndexOf(".");

  const docname =
    lastSlashIndex !== -1
      ? normalizedFilename.substring(lastSlashIndex + 1)
      : normalizedFilename;

  return lastDotIndex !== -1 ? docname.substring(0, lastDotIndex) : docname;
}

async function processOneBatch(
  client: Pinecone,
  indexname: string,
  namespace: string,
  extractor: FeatureExtractionPipeline,
  chunkBatch: string[],
  chunkPatchIndex: number,
  filename: string
) {
  const output = await extractor(
    chunkBatch.map((str) => str.replace(/\n/g, " ")),
    {
      pooling: "cls",
    }
  );
  const embeddingsBatch = output.tolist();
  let vectorBatch: PineconeRecord<RecordMetadata>[] = [];

  for (let i = 0; i < chunkBatch.length; i++) {
    const chunk = chunkBatch[i];
    const embedding = embeddingsBatch[i];

    const vector: PineconeRecord<RecordMetadata> = {
      id: `${filename}-${chunkPatchIndex}-${i}`,
      values: embedding,
      metadata: {
        chunk,
      },
    };

    vectorBatch.push(vector);
  }

  const index = client.Index(indexname).namespace(namespace);
  await index.upsert(vectorBatch);
  totalDocumentChunksUpseted += vectorBatch.length;
  if (callback !== undefined) {
    callback(filename, totalDocumentChunks, totalDocumentChunksUpseted, false);
  }
  vectorBatch = [];
}

const hf = new HfInference(process.env.HF_TOKEN);
export async function queryPineconeVectorStore(
  client: Pinecone,
  indexName: string,
  namespace: string,
  query: string
): Promise<string> {
  try {
    // Validate inputs
    if (!query || query.trim().length === 0) {
      throw new Error("Query string cannot be empty");
    }

    if (!process.env.HF_TOKEN) {
      throw new Error("HF_TOKEN environment variable is not set");
    }

    // Get embeddings from Hugging Face
    const apiOutput = await hf.featureExtraction({
      model: "mixedbread-ai/mxbai-embed-large-v1",
      inputs: query.trim(),
    }).catch(error => {
      console.error("Error during feature extraction:", error);
      throw new Error("Failed to generate embeddings");
    });

    if (!apiOutput) {
      throw new Error("No embedding output received");
    }

    // Convert embedding to array and validate
    const queryEmbedding = Array.from(apiOutput);
    if (queryEmbedding.length === 0) {
      throw new Error("Empty embedding received");
    }

    // Query Pinecone
    const index = client.Index(indexName);
    const queryResponse = await index.namespace(namespace).query({
      topK: 5,
      vector: queryEmbedding as any,
      includeMetadata: true,
      includeValues: false,
    }).catch(error => {
      console.error("Error querying Pinecone:", error);
      throw new Error("Failed to query vector database");
    });

    // Process results
    if (!queryResponse || !queryResponse.matches) {
      return "<nomatches>";
    }

    const concatenatedRetrievals = queryResponse.matches
      .filter(match => match.metadata?.chunk)
      .map((match, index) => 
        `\nClinical Finding ${index + 1}: \n ${match.metadata?.chunk}`
      )
      .join(". \n\n");

    return concatenatedRetrievals || "<nomatches>";

  } catch (error) {
    console.error("Error in queryPineconeVectorStore:", error);
    throw error; // Re-throw to be handled by the caller
  }
}
