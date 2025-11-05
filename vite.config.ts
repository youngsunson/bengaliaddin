import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function generateBengaliCorrection(text: string): Promise<string> {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(text);
    return result.response.text();
  } catch (err) {
    console.error("Error calling Gemini API:", err);
    return "Error contacting AI service.";
  }
}
