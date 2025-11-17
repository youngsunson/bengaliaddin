import React, { useEffect, useState, useCallback } from "react";
import { createRoot } from "react-dom/client";

// Feature flag: remote AI calls are disabled by default because Word Online CSP
// will usually block external origins. Enable only if you use a same-origin proxy.
const ENABLE_REMOTE_AI = false; // set to true when you have a backend proxy on your SourceLocation origin

type GeminiClient = typeof import("@google/genai");

function App() {
  const [officeReady, setOfficeReady] = useState<boolean>(false);
  const [docReady, setDocReady] = useState<boolean>(false);
  const [currentDocumentText, setCurrentDocumentText] = useState<string>("");
  const [status, setStatus] = useState<string>("Initializing...");
  const [aiStatus, setAiStatus] = useState<string>("Idle");

  // Wait for Office.js lifecycle
  useEffect(() => {
    const OfficeObj = (window as any).Office;
    if (OfficeObj && typeof OfficeObj.onReady === "function") {
      OfficeObj.onReady(() => {
        setOfficeReady(true);
        setStatus("Office ready. Waiting for document...");
        // In the task pane, document is typically ready after Office.onReady
        setDocReady(true);
        setStatus("Document ready.");
      });
    } else {
      setStatus("Office.js not available. Are you running inside Word?");
    }
  }, []);

  const loadTextFromWord = useCallback(async () => {
    if (!officeReady || !docReady) {
      setStatus("Host or document not ready yet.");
      return;
    }
    try {
      setStatus("Reading document...");
      await (window as any).Word.run(async (context: any) => {
        const body = context.document.body;
        body.load("text");
        await context.sync();
        const text: string = body.text ?? "";
        setCurrentDocumentText(text);
        setStatus(`Document loaded (${text.length} chars).`);
      });
    } catch (err: any) {
      console.error("Error getting Word document text:", err);
      setStatus("Failed to read document text. Try again.");
    }
  }, [officeReady, docReady]);

  const callGemini = useCallback(async () => {
    if (!currentDocumentText) {
      setAiStatus("Load text first.");
      return;
    }
    if (!ENABLE_REMOTE_AI) {
      setAiStatus("Remote AI disabled (likely blocked by Word Online CSP).");
      return;
    }
    try {
      setAiStatus("Calling AI...");
      // Dynamically import to avoid bundling issues when disabled
      const genai: GeminiClient = await import("@google/genai");
      const { GoogleGenerativeAI } = genai;

      // Prefer Vite env var
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setAiStatus("No API key configured in VITE_GEMINI_API_KEY.");
        return;
      }

      const client = new GoogleGenerativeAI({ apiKey });
      const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Check Bengali spelling and grammar:\n\n${currentDocumentText}`;
      const result = await model.generateContent(prompt);

      const textOutput = result?.response?.text?.() ?? "";
      setAiStatus(textOutput ? `AI response:\n${textOutput}` : "AI returned no text.");
    } catch (err: any) {
      console.error("Error calling Gemini API:", err);
      setAiStatus("AI call failed or blocked. Try again later or use a same-origin proxy.");
    }
  }, [currentDocumentText]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 md:p-8 max-w-4xl w-full">
        <h1 className="text-xl font-semibold mb-3">Bengali Spell Checker</h1>

        <div className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          <strong>Status:</strong> {status}
        </div>

        <div className="space-x-3 mb-6">
          <button
            className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
            onClick={loadTextFromWord}
            disabled={!officeReady || !docReady}
            title={!officeReady || !docReady ? "Office/document not ready" : "Read document text"}
          >
            Read document text
          </button>
          <button
            className="inline-block px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed"
            onClick={callGemini}
            disabled={!currentDocumentText}
            title={!currentDocumentText ? "Load text first" : "Analyze text with AI"}
          >
            Analyze with AI
          </button>
        </div>

        <div className="mb-6">
          <strong className="block mb-2">Current document text:</strong>
          <div className="rounded-md border border-gray-300 dark:border-gray-700 p-3 min-h-full whitespace-pre-wrap">
            {currentDocumentText || "No text loaded yet."}
          </div>
        </div>

        <div className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
          <strong>AI status:</strong> {aiStatus}
        </div>
      </div>
    </div>
  );
}

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
