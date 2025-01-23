import { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({
  model: "gemini-1.5-pro",
});

const prompt = `Attached is an image of a legal document. 
Go over the document and identify key legal points, important clauses, and any notable provisions or conditions. Then summarize in 100 words. You may increase the word limit if the document has multiple pages. Do not output any personally identifiable information or confidential details. Make sure to include specific clauses, referenced laws/statutes, and key details from the document, including document title.
## Summary: `;

export async function POST(req: Request) {
  const { base64 } = await req.json();
  const filePart = fileToGenerativePart(base64);
  const generatedContent = await model.generateContent([prompt, filePart]);
  const textResponse = generatedContent.response.candidates![0].content.parts[0].text;
  return new Response(textResponse, { status: 200 });
}

function fileToGenerativePart(imageData: string) {
  return {
    inlineData: {
      data: imageData.split(",")[1],
      mimeType: imageData.substring(
        imageData.indexOf(":") + 1,
        imageData.lastIndexOf(";")
      ),
    },
  };
}
