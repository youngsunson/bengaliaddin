// App.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { WordDocument } from './components/WordDocument';
import { AddonPane } from './components/AddonPane';
import { Ribbon } from './components/Ribbon';
import { SettingsPanel } from './components/SettingsPanel';
import type { SpellError, SuggestionPopupState, AIResponse, SpellCheckOptions } from './types';
import { INITIAL_DOCUMENT_TEXT } from './constants';
import { GoogleGenAI, Type } from "@google/genai";
import { learningSystem } from './learning';

const SYSTEM_INSTRUCTION = `You are an intelligent Bengali writing assistant integrated with Microsoft Word.
Your job is to analyze the full text of a Bengali document and provide:
1. Spelling and grammar corrections,
2. Missing or structural elements (e.g., Subject, Date, Signature),
3. Formatting improvement suggestions (spacing, alignment),
4. General feedback on writing quality.

Return results in this JSON format:
{
  "spelling_corrections": [{"word": "ভুলশব্দ", "suggestion": "সঠিকশব্দ", "confidence": 0.95, "reason": "Common misspelling"}],
  "missing_elements": ["Subject not mentioned"],
  "formatting_suggestions": ["Add proper paragraph spacing"],
  "general_feedback": "Your letter is well written but missing Subject and Signature sections."
}`;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    spelling_corrections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          word: { type: Type.STRING },
          suggestion: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
          reason: { type: Type.STRING }
        },
        required: ['word', 'suggestion']
      }
    },
    missing_elements: { type: Type.ARRAY, items: { type: Type.STRING } },
    formatting_suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    general_feedback: { type: Type.STRING }
  },
  required: ['spelling_corrections', 'missing_elements', 'formatting_suggestions', 'general_feedback']
};

// ----------------------
// Helper: Context Extractor
// ----------------------
const getContext = (text: string, position: number, length: number): string => {
  const start = Math.max(0, position - 20);
  const end = Math.min(text.length, position + length + 20);
  return text.substring(start, end);
};

// ----------------------
// Generate Errors from AI
// ----------------------
const generateErrorsFromAI = (
  text: string,
  aiResponse: AIResponse
): SpellError[] => {
  const foundErrors: SpellError[] = [];

  if (!aiResponse) return [];

  // --- SPELLING ---
  const corrections = aiResponse.spelling_corrections || [];
  corrections.forEach(({ word, suggestion, confidence = 0.8, reason = "" }) => {
    learningSystem.storeAICorrection(word, suggestion, confidence);

    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![\\u0980-\\u09FF])${escapedWord}(?![\\u0980-\\u09FF])`, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const id = `spell-${word}-${match.index}`;
      if (!foundErrors.some(e => e.id === id)) {
        foundErrors.push({
          id,
          incorrectWord: word,
          suggestions: learningSystem.getEnhancedSuggestions(word, [suggestion]),
          context: getContext(text, match.index, word.length),
          position: { start: match.index, end: match.index + word.length },
          errorType: 'spelling',
          confidence
        });
      }
    }
  });

  // ✅ NEW: STRUCTURAL SUGGESTIONS (missing elements)
  (aiResponse.missing_elements || []).forEach((msg, i) => {
    foundErrors.push({
      id: `structure-${i}`,
      incorrectWord: msg,
      suggestions: [],
      context: msg,
      position: { start: 0, end: 0 },
      errorType: 'structure',
      confidence: 0.9
    });
  });

  // ✅ NEW: FORMATTING SUGGESTIONS
  (aiResponse.formatting_suggestions || []).forEach((msg, i) => {
    foundErrors.push({
      id: `format-${i}`,
      incorrectWord: msg,
      suggestions: [],
      context: msg,
      position: { start: 0, end: 0 },
      errorType: 'formatting',
      confidence: 0.8
    });
  });

  console.log("AI → Generated Errors:", foundErrors);
  return foundErrors;
};

// ----------------------
// Fallback Spell Check
// ----------------------
const performSpellCheck = (text: string, options: SpellCheckOptions): SpellError[] => {
  const errors: SpellError[] = [];
  const words = text.match(/[\u0980-\u09FF]+/g) || [];

  words.forEach((word) => {
    const stored = learningSystem.getStoredCorrection(word);
    if (stored) {
      errors.push({
        id: `stored-${word}-${Date.now()}`,
        incorrectWord: word,
        suggestions: [stored],
        context: getContext(text, text.indexOf(word), word.length),
        position: { start: text.indexOf(word), end: text.indexOf(word) + word.length },
        errorType: 'spelling',
        confidence: 0.7
      });
    }
  });
  return errors;
};

// ----------------------
// Component
// ----------------------
const App: React.FC = () => {
  const [documentText, setDocumentText] = useState<string>(INITIAL_DOCUMENT_TEXT);
  const [errors, setErrors] = useState<SpellError[]>([]);
  const [ignoredWords, setIgnoredWords] = useState<string[]>([
    ...learningSystem.userPreferences.ignoreWords
  ]);
  const [isChecking, setIsChecking] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIResponse | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [spellCheckOptions] = useState<SpellCheckOptions>({
    enablePhonetic: true,
    enableGrammar: true,
    strictness: 'moderate'
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const activeErrors = useMemo(
    () => errors.filter(e => !ignoredWords.includes(e.incorrectWord)),
    [errors, ignoredWords]
  );

  const handleRunAnalysis = useCallback(async () => {
    setIsChecking(true);
    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      const prompt = `
      Please analyze this Bengali document:

      "${documentText}"

      Return your analysis in JSON as described in the system instruction.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: prompt }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      const rawText = typeof response.text === "function"
        ? await (response.text() as Promise<string>)
        : (response.text as string);

      const resultJson = JSON.parse(rawText) as AIResponse;
      setAnalysisResult(resultJson);

      const generatedErrors = generateErrorsFromAI(documentText, resultJson);
      setErrors(generatedErrors.length ? generatedErrors : performSpellCheck(documentText, spellCheckOptions));
    } catch (e) {
      console.error("❌ AI Error:", e);
      setErrors(performSpellCheck(documentText, spellCheckOptions));
    } finally {
      setIsChecking(false);
    }
  }, [documentText, spellCheckOptions]);

  const handleAcceptSuggestion = useCallback((errorId: string, suggestion: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;

    const updated = documentText.replace(
      new RegExp(`(?<![\\u0980-\\u09FF])${error.incorrectWord}(?![\\u0980-\\u09FF])`, 'g'),
      suggestion
    );
    setDocumentText(updated);
    setErrors(errors.filter(e => e.id !== errorId));
  }, [documentText, errors]);

  const handleDismissError = useCallback((errorId: string) => {
    const error = errors.find(e => e.id === errorId);
    if (!error) return;
    setIgnoredWords(prev => [...prev, error.incorrectWord]);
    setErrors(errors.filter(e => e.id !== errorId));
  }, [errors]);

  return (
    <div className="min-h-screen flex flex-col">
      <Ribbon onSettingsClick={() => setIsSettingsOpen(true)} />
      <div className="flex flex-1">
        <main className="flex-1 p-6 bg-gray-50 dark:bg-gray-900">
          <WordDocument
            text={documentText}
            onTextChange={setDocumentText}
            errors={activeErrors}
          />
        </main>
        <aside className="w-96 border-l bg-white dark:bg-gray-800">
          <AddonPane
            errors={activeErrors}
            onAcceptSuggestion={handleAcceptSuggestion}
            onDismissError={handleDismissError}
            isChecking={isChecking}
            analysisResult={analysisResult}
            onRunAnalysis={handleRunAnalysis}
            ignoredWords={ignoredWords}
            onIgnoredWordsChange={setIgnoredWords}
          />
        </aside>
      </div>
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
      />
    </div>
  );
};

export default App;
