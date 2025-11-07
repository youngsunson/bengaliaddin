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
Your job is to analyze the full text of a Bengali document and provide both:
1. **Spelling and grammar corrections**, and
2. **Content and formatting improvement suggestions**.

Return results in this JSON format:
{
  "spelling_corrections": [
    {"word": "ভুলশব্দ", "suggestion": "সঠিকশব্দ", "confidence": 0.95, "reason": "Common misspelling"}
  ],
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

// Get text context around error
const getContext = (text: string, position: number, length: number): string => {
  const start = Math.max(0, position - 20);
  const end = Math.min(text.length, position + length + 20);
  return text.substring(start, end);
};

// Generate errors from AI response
const generateErrorsFromAI = (text: string, corrections: AIResponse['spelling_corrections']): SpellError[] => {
  const foundErrors: SpellError[] = [];
  if (!corrections || corrections.length === 0) return [];

  corrections.forEach(({ word, suggestion, confidence = 0.8, reason = "" }) => {
    learningSystem.storeAICorrection(word, suggestion, confidence);
  });

  const sortedCorrections = [...corrections].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

  sortedCorrections.forEach(({ word, suggestion, confidence = 0.8 }) => {
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // ✅ FIX: Proper Bengali boundary regex
    const regex = new RegExp(`(?<![\\u0980-\\u09FF])${escapedWord}(?![\\u0980-\\u09FF])`, 'g');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const id = `err-${word}-${match.index}`;
      if (!foundErrors.some(e => e.id === id)) {
        const error: SpellError = {
          id,
          incorrectWord: word,
          suggestions: [suggestion],
          context: getContext(text, match.index, word.length),
          position: { start: match.index, end: match.index + word.length },
          errorType: 'spelling',
          confidence
        };
        const enhancedSuggestions = learningSystem.getEnhancedSuggestions(word, [suggestion]);
        error.suggestions = enhancedSuggestions;
        foundErrors.push(error);
        console.log("Matched error:", error); // ✅ Debugging log
      }
    }
  });

  console.log("AI corrections received:", corrections);
  console.log("Generated errors after regex:", foundErrors);
  return foundErrors;
};

// Bengali phonetic fallback
const getPhoneticSuggestions = (word: string): string[] => {
  const phoneticMap: Record<string, string[]> = {
    'সম্বব': ['সম্ভব'],
    'ছারপত্র': ['ছাড়পত্র'],
    'চাকুরিজিবি': ['চাকরিজীবী'],
    'চট্রগ্রামে': ['চট্টগ্রামে']
  };

  const suggestions = phoneticMap[word] || [];
  if (word.includes('জিবি')) suggestions.push(word.replace(/জিবি/g, 'জীবী'));
  if (word.includes('রপত্র')) suggestions.push(word.replace(/রপত্র/g, 'রপত্র'));
  return [...new Set(suggestions)];
};

// Fallback spell check
const performSpellCheck = (text: string, options: SpellCheckOptions): SpellError[] => {
  const errors: SpellError[] = [];
  const words = text.match(/[\u0980-\u09FF]+/g) || [];
  const processedWords = new Set<string>();

  words.forEach((word) => {
    if (processedWords.has(word)) return;

    const storedCorrection = learningSystem.getStoredCorrection(word);
    if (storedCorrection) {
      const context = getContext(text, text.indexOf(word), word.length);
      const confidence = learningSystem.userPreferences.storedCorrections.find(c => c.incorrect === word)?.confidence || 0.6;
      errors.push({
        id: `stored-${word}-${Date.now()}-${Math.random()}`,
        incorrectWord: word,
        suggestions: [storedCorrection],
        context,
        position: { start: text.indexOf(word), end: text.indexOf(word) + word.length },
        errorType: 'spelling',
        confidence
      });
    } else {
      const phoneticSuggestions = getPhoneticSuggestions(word);
      if (phoneticSuggestions.length > 0) {
        const context = getContext(text, text.indexOf(word), word.length);
        errors.push({
          id: `phonetic-${word}-${Date.now()}-${Math.random()}`,
          incorrectWord: word,
          suggestions: phoneticSuggestions,
          context,
          position: { start: text.indexOf(word), end: text.indexOf(word) + word.length },
          errorType: 'spelling',
          confidence: 0.7
        });
      }
    }
    processedWords.add(word);
  });

  return errors;
};

interface HistoryState {
  documentText: string;
  ignoredWords: string[];
}

type Theme = 'light' | 'dark';

const App: React.FC = () => {
  const [documentText, setDocumentText] = useState<string>(INITIAL_DOCUMENT_TEXT);
  const [errors, setErrors] = useState<SpellError[]>([]);
  const [popup, setPopup] = useState<SuggestionPopupState | null>(null);
  const [ignoredWords, setIgnoredWords] = useState<string[]>([
    ...learningSystem.userPreferences.ignoreWords
  ]); // ✅ FIXED: Removed default ignored test words
  const [activeErrorId, setActiveErrorId] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [isChecking, setIsChecking] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AIResponse | null>(null);
  const [theme, setTheme] = useState<Theme>('light');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [spellCheckOptions, setSpellCheckOptions] = useState<SpellCheckOptions>({
    enablePhonetic: true,
    enableGrammar: true,
    strictness: 'moderate'
  });

  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) setTheme(savedTheme);
    else if (window.matchMedia('(prefers-color-scheme: dark)').matches) setTheme('dark');
  }, []);

  const activeErrors = useMemo(() => {
    return errors.filter(error => !ignoredWords.includes(error.incorrectWord));
  }, [errors, ignoredWords]);

  const handleRunAnalysis = useCallback(async () => {
    setIsChecking(true);
    setErrors([]);
    setAnalysisResult(null);
    setPopup(null);

    try {
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      const spellingPrompt = `
      Please analyze this Bengali document and focus ONLY on spelling errors:

      "${documentText}"

      Identify ALL misspelled Bengali words.
      Return your response in the exact JSON format specified in the system instruction.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: spellingPrompt }],
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      const rawText = typeof response.text === "function"
        ? await (response.text() as Promise<string>)
        : (response.text as unknown as string) ?? JSON.stringify(response);

      const resultJson = JSON.parse(rawText) as AIResponse;
      setAnalysisResult(resultJson);

      const generatedErrors = generateErrorsFromAI(documentText, resultJson.spelling_corrections);
      let finalErrors = generatedErrors;

      if (generatedErrors.length === 0) {
        finalErrors = performSpellCheck(documentText, spellCheckOptions);
      }

      setErrors(finalErrors);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      const localErrors = performSpellCheck(documentText, spellCheckOptions);
      setErrors(localErrors);
    } finally {
      setIsChecking(false);
    }
  }, [documentText, spellCheckOptions]);

  const handleTextChange = useCallback((newText: string) => {
    setHistory(prev => [...prev, { documentText, ignoredWords }]);
    setDocumentText(newText);
    const localErrors = performSpellCheck(newText, spellCheckOptions);
    setErrors(localErrors);
    if (popup) setPopup(null);
  }, [popup, documentText, ignoredWords, spellCheckOptions]);

  const updateIgnoredWords = useCallback((updater: (prev: string[]) => string[]) => {
    setHistory(prev => [...prev, { documentText, ignoredWords }]);
    setIgnoredWords(updater);
  }, [documentText, ignoredWords]);

  const handleAcceptSuggestion = useCallback((errorId: string, suggestion: string) => {
    const errorToFix = errors.find(e => e.id === errorId);
    if (!errorToFix) return;

    learningSystem.learnFromCorrection(errorToFix, 'accept');
    const newText = documentText.replace(
      new RegExp(`(?<![\\u0980-\\u09FF])${errorToFix.incorrectWord}(?![\\u0980-\\u09FF])`, 'g'),
      suggestion
    );
    handleTextChange(newText);
    setPopup(null);
    setActiveErrorId(null);
  }, [documentText, errors, handleTextChange]);

  const handleDismissError = useCallback((errorId: string) => {
    const errorToDismiss = errors.find(e => e.id === errorId);
    if (!errorToDismiss) return;
    learningSystem.learnFromCorrection(errorToDismiss, 'ignore');
    updateIgnoredWords(prev => [...new Set([...prev, errorToDismiss.incorrectWord])]);
    setPopup(null);
    setActiveErrorId(null);
  }, [errors, updateIgnoredWords]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previousState = history[history.length - 1];
    setHistory(history.slice(0, -1));
    setDocumentText(previousState.documentText);
    setIgnoredWords(previousState.ignoredWords);
    const localErrors = performSpellCheck(previousState.documentText, spellCheckOptions);
    setErrors(localErrors);
    setPopup(null);
    setActiveErrorId(null);
  }, [history, spellCheckOptions]);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl bg-white dark:bg-gray-900 shadow-2xl rounded-lg flex flex-col h-[calc(100vh-4rem)]">
        <Ribbon onUndo={handleUndo} canUndo={history.length > 0} onSettingsClick={() => setIsSettingsOpen(true)} />
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
            <WordDocument
              text={documentText}
              onTextChange={handleTextChange}
              errors={activeErrors}
              onWordClick={setPopup}
              popup={popup}
              onAcceptSuggestion={handleAcceptSuggestion}
              onDismissError={handleDismissError}
              activeErrorId={activeErrorId}
            />
          </main>
          <aside className="w-full md:w-80 lg:w-96 bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-shrink-0">
            <AddonPane
              errors={activeErrors}
              onAcceptSuggestion={handleAcceptSuggestion}
              onDismissError={handleDismissError}
              onCardHover={setActiveErrorId}
              isChecking={isChecking}
              analysisResult={analysisResult}
              onRunAnalysis={handleRunAnalysis}
              ignoredWords={ignoredWords}
              onIgnoredWordsChange={updateIgnoredWords}
            />
          </aside>
        </div>
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
