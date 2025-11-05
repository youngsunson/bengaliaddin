import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-1.5-flash"
});

const result = await model.generateContent(l);
const textResponse = result.response.text();
const Me = JSON.parse(textResponse);

// Run your error extraction function
const tt = Fu(l, Me.spelling_corrections);

s(tt);       // Set errors
z(Me);       // Set analysis result
