import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { Pinecone } from "@pinecone-database/pinecone";
import { NextRequest, NextResponse } from "next/server";
import { updateVectorDB } from "@/utils";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { indexname, namespace } = body;
    console.log("Processing request for:", indexname, namespace);

    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Create the response with the stream
    const response = new Response(stream.readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });

    handleUpload(indexname, namespace, writer).catch(async (error) => {
      console.error("Upload error:", error);
      await writer.write(
        new TextEncoder().encode(
          `data: ${JSON.stringify({ error: error.message })}\n\n`
        )
      );
      await writer.close();
    });

    return response;
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

async function handleUpload(
  indexname: string,
  namespace: string,
  writer: WritableStreamDefaultWriter
) {
  try {
    const loader = new DirectoryLoader("./documents", {
      ".pdf": (path: string) => new PDFLoader(path, { splitPages: false }),
      ".txt": (path: string) => new TextLoader(path),
    });

    const docs = await loader.load();
    console.log(`Loaded ${docs.length} documents`);

    const client = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });

    const sendProgress = async (
      filename: string,
      totalChunks: number,
      chunksUpserted: number,
      isComplete: boolean
    ) => {
      const data = `${JSON.stringify({
        filename,
        totalChunks,
        chunksUpserted,
        isComplete,
      })}\n\n`;

      console.log(`${filename}-${totalChunks}-${chunksUpserted}-${isComplete}`);
      await writer.write(new TextEncoder().encode(data));

      if (isComplete) {
        await writer.close();
      }
    };

    await updateVectorDB(client, indexname, namespace, docs, sendProgress);
    console.log();
  } catch (error) {
    console.error("Upload error:", error);
    throw error;
  }
}
