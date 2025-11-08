// App.tsx
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { AddonPane } from './components/AddonPane';
import { Ribbon } from './components/Ribbon';
import { SettingsPanel } from './components/SettingsPanel';
import type { SpellError, SuggestionPopupState, AIResponse, SpellCheckOptions } from './types';
import { GoogleGenAI, Type } from "@google/genai";
import { learningSystem } from './learning';
import { getWordDocumentText, highlightSpellingErrorsInWord, replaceWordInWord } from './WordIntegration';
import { WordDocument } from './components/WordDocument'; // Import WordDocument

const SYSTEM_INSTRUCTION = `আপনি একজন বাংলা লেখার সহকারী। একটি বাংলা নথির সম্পূর্ণ বিশ্লেষণ করুন এবং নিম্নলিখিত বিষয়গুলি প্রদান করুন:
1. **বানান এবং ব্যাকরণ সংশোধন**, এবং
2. **কাঠামো ও ফরম্যাটিং উন্নতি পরাম্শ**।

নিম্নলিখিত JSON ফরম্যাটে ফলাফল প্রদান করুন:
{
  "spelling_corrections": [
    {"word": "ভুলশব্দ", "suggestion": "সঠিকশব্দ", "confidence": 0.95, "reason": "Common misspelling"}
  ],
  "missing_elements": ["বিষয় উল্লেখ করা হয়নি"],
  "formatting_suggestions": ["উপযুক্ত প্যারাগ্রাফ স্পেসিং যোগ করুন"],
  "general_feedback": "আপনার চিঠি ভালো লেখা হয়েছে কিন্তু বিষয় এবং স্বাক্ষর অনুপস্থিত।"
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
  const [documentText, setDocumentText] = useState<string>("");
  const [errors, setErrors] = useState<SpellError[]>([]);
  const [popup, setPopup] = useState<SuggestionPopupState | null>(null);
  const [ignoredWords, setIgnoredWords] = useState<string[]>([
    ...learningSystem.userPreferences.ignoreWords
  ]);
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
    setActiveErrorId(null); // Clear active error ID

    try {
      // Get the current document text from Word
      const wordText = await getWordDocumentText();
      setDocumentText(wordText); // Update local state with Word's text
      
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      // ✅ UPDATED: Comprehensive prompt in Bengali
      const comprehensivePrompt = `
      অনুগ্রহ করে এই বাংলা নথিটি সম্পূর্ণভাবে বিশ্লেষণ করুন:

      "${wordText}"

      নিম্নলিখিত বিষয়গুলি সরবরাহ করুন:
      1. বানান এবং ব্যাকরণ সংশোধন
      2. অনুপস্থিত নথি উপাদান (যেমন বিষয়, তারিখ, স্বাক্ষর ইত্যাদি)
      3. ফরম্যাটিং পরামর্শ (স্পেসিং, এলাইনমেন্ট ইত্যাদি)
      4. নথি সম্পর্কে সাধারণ প্রতিক্রিয়া

      সিস্টেম নির্দেশিকায় উল্লিখিত সঠিক JSON ফরম্যাটে আপনার প্রতিক্রিয়া প্রদান করুন।
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ text: comprehensivePrompt }],
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

      const generatedErrors = generateErrorsFromAI(wordText, resultJson.spelling_corrections);
      let finalErrors = generatedErrors;

      if (generatedErrors.length === 0) {
        finalErrors = performSpellCheck(wordText, spellCheckOptions);
      }

      setErrors(finalErrors);
      
      // Highlight errors in Word document
      await highlightSpellingErrorsInWord(finalErrors);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      // Fallback: use stored corrections and phonetic matching
      const localErrors = performSpellCheck(documentText, spellCheckOptions);
      setErrors(localErrors);
    } finally {
      setIsChecking(false);
    }
  }, [spellCheckOptions]);

  const handleAcceptSuggestion = useCallback(async (errorId: string, suggestion: string) => {
    const errorToFix = errors.find(e => e.id === errorId);
    if (!errorToFix) return;

    // Learn from this correction
    learningSystem.learnFromCorrection(errorToFix, 'accept');

    // --- NEW: Update the local documentText state ---
    const updatedText = documentText.substring(0, errorToFix.position.start) +
                        suggestion +
                        documentText.substring(errorToFix.position.end);
    setDocumentText(updatedText);

    // Update errors list to reflect the change (optional, for UI consistency)
    // This might involve re-running spell check on the new text or filtering out the fixed error
    // For now, just filter it out if it matches exactly
    const updatedErrors = errors.filter(e => e.id !== errorId);
    setErrors(updatedErrors);

    // Sync the change back to the real Word document
    await replaceWordInWord(errorToFix.incorrectWord, suggestion);

    // Close the popup and clear active ID
    setPopup(null);
    setActiveErrorId(null);
  }, [documentText, errors]);

  const handleDismissError = useCallback((errorId: string) => {
    const errorToDismiss = errors.find(e => e.id === errorId);
    if (!errorToDismiss) return;
    
    // Learn from this dismissal
    learningSystem.learnFromCorrection(errorToDismiss, 'ignore');
    
    // Update our local state
    setPopup(null);
    setActiveErrorId(null);
  }, [errors]);

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

  // --- NEW: Handler for text changes in the custom editor ---
  const handleTextChange = useCallback((newText: string) => {
    // Optionally, you could run spell check again here when the user types
    // For now, just update the state
    setDocumentText(newText);
  }, []);

  // --- NEW: Handler for clicking a word to show popup ---
  const handleWordClick = useCallback((state: SuggestionPopupState) => {
    setPopup(state);
    setActiveErrorId(state.error.id);
  }, []);

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-7xl bg-white dark:bg-gray-900 shadow-2xl rounded-lg flex flex-col h-[calc(100vh-4rem)]">
        <Ribbon onUndo={handleUndo} canUndo={history.length > 0} onSettingsClick={() => setIsSettingsOpen(true)} />
        <div className="flex-grow flex flex-col md:flex-row overflow-hidden">
          {/* Main content area - now uses WordDocument component */}
          <main className="flex-grow p-4 md:p-8 overflow-y-auto bg-gray-50 dark:bg-gray-900/50">
            <WordDocument
              text={documentText}
              onTextChange={handleTextChange}
              errors={activeErrors}
              popup={popup}
              activeErrorId={activeErrorId}
              onWordClick={handleWordClick}
              onAcceptSuggestion={handleAcceptSuggestion}
              onDismissError={handleDismissError}
            />
          </main>
          <aside className="w-full md:w-80 lg:w-96 bg-gray-100 dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="add-in-container">
              <div className="add-in-header">Bengali Writing Assistant</div>
              
              <button 
                className="analyze-button" 
                onClick={handleRunAnalysis}
                disabled={isChecking}
              >
                {isChecking ? 'Analyzing...' : 'Analyze Document'}
              </button>
              
              <div className="section">
                <div className="section-title">General Feedback</div>
                <div className="section-content">
                  {analysisResult ? analysisResult.general_feedback : 'Click the button above to get feedback on your document.'}
                </div>
              </div>
              
              <div className="section">
                <div className="section-title">Spelling Corrections</div>
                <div className="section-content">
                  {analysisResult && analysisResult.spelling_corrections.length > 0 ? (
                    <ul>
                      {analysisResult.spelling_corrections.map((corr, index) => (
                        <li key={index}>{corr.word} → {corr.suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No spelling errors found.</p>
                  )}
                </div>
              </div>
              
              <div className="section">
                <div className="section-title">Structural Suggestions</div>
                <div className="section-content">
                  {analysisResult && analysisResult.missing_elements.length > 0 ? (
                    <ul>
                      {analysisResult.missing_elements.map((element, index) => (
                        <li key={index}>{element}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No structural issues found.</p>
                  )}
                </div>
              </div>
              
              <div className="section">
                <div className="section-title">Formatting Suggestions</div>
                <div className="section-content">
                  {analysisResult && analysisResult.formatting_suggestions.length > 0 ? (
                    <ul>
                      {analysisResult.formatting_suggestions.map((suggestion, index) => (
                        <li key={index}>{suggestion}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>No formatting issues found.</p>
                  )}
                </div>
              </div>
              
              <div className="learning-system">
                <div className="learning-system-label">Learning System</div>
                <div className="learning-system-count">{learningSystem.userPreferences.storedCorrections.length}</div>
              </div>
              
              <div className="ignored-words">
                <div className="ignored-words-label">Ignored Words</div>
                <div className="ignored-words-count">{ignoredWords.length}</div>
              </div>
            </div>
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
