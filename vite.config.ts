import { GoogleGenerativeAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

const ai = new GoogleGenerativeAI(apiKey);

// choose fast + low-cost model that works
const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });

// your text input (document contents)
const prompt = `${documentText}`;

const result = await model.generateContent(prompt);

// standardized safe text extraction
const rawText = await result.response.text();

// parse because your system expects JSON output
const resultJson = JSON.parse(rawText);
