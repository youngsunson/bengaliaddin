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

---

### Step 1: Bengali Spell Checking
- Identify incorrect or misspelled Bengali words.
- Suggest correct alternatives using standard Bangla vocabulary and grammar rules.
- Focus on natural and modern spelling used in Bangladesh.
- Provide results in a structured JSON format.

---

### Step 2: Document Analysis & Format Checking
Analyze the *type of document* and check if it is properly structured.
Examples:
- If it looks like an application letter → check for **Date**, **Subject**, **Recipient**, **Body**, and **Signature**.
- If it looks like a report or essay → check for **Title**, **Introduction**, **Main Body**, **Conclusion**, and **References**.
- If it looks like an official notice → check for **Heading**, **Date**, **Authority**, and **Signature**.

Identify any **missing or incomplete elements** and suggest improvements, such as:
- "The document is missing a Subject line."
- "The Date is not mentioned."
- "Add a formal greeting such as 'বরাবর,' before the recipient name."
- "Include a closing line such as 'ইতি, বিনীত' before the signature."

---

### Step 3: Formatting Suggestions
Detect any inconsistent spacing, font issues, or paragraph alignment problems.
- Recommend proper indentation or heading style.
- Suggest if the writer should use bold for titles or underline for important parts.

---

### Step 4: Output Format
Return your response in this structured JSON:
{
  "spelling_corrections": [
    {"word": "ভুলশব্দ", "suggestion": "সঠিকশব্দ", "confidence": 0.95, "reason": "Common misspelling"}
  ],
  "missing_elements": [
    "Subject not mentioned",
    "Date missing"
  ],
  "formatting_suggestions": [
    "Add proper paragraph spacing",
    "Align text to left for formal letters"
  ],
  "general_feedback": "Your letter is well written but missing Subject and Signature sections."
}

---

### Additional Notes
- Never change the meaning of the user's writing.
- Keep suggestions polite and educational.
- Reply in **Bengali** unless explicitly asked to use English.
- Do not output code; only return the structured JSON as described above.`;

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
        missing_elements: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        formatting_suggestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        },
        general_feedback: {
            type: Type.STRING
        }
    },
    required: ['spelling_corrections', 'missing_elements', 'formatting_suggestions', 'general_feedback']
};

// Enhanced error generation with precise positions
const generateErrorsFromAI = (text: string, corrections: AIResponse['spelling_corrections']): SpellError[] => {
  const foundErrors: SpellError[] = [];
  if (!corrections) return [];
  
  // Store AI corrections in learning system
  corrections.forEach(({ word, suggestion, confidence = 0.8 }) => {
    learningSystem.storeAICorrection(word, suggestion, confidence);
  });
  
  // Sort by confidence to prioritize better suggestions
  const sortedCorrections = [...corrections].sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
  
  let processedText = text;
  
  sortedCorrections.forEach(({ word, suggestion, confidence = 0.8, reason = "" }) => {
    // Use word boundaries to avoid partial matches
    const escapedWord = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedWord}\\b`, 'g');
    let match;
    
    while ((match = regex.exec(processedText)) !== null) {
      const id = `err-${word}-${match.index}`;
      
      // Check if this error already exists (avoid duplicates)
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
        
        // Enhance with learning system
        const enhancedSuggestions = learningSystem.getEnhancedSuggestions(word, [suggestion]);
        error.suggestions = enhancedSuggestions;
        
        foundErrors.push(error);
        
        // Replace in processed text to avoid re-matching same position
        processedText = processedText.substring(0, match.index) + 
                       ' '.repeat(word.length) + 
                       processedText.substring(match.index + word.length);
      }
    }
  });
  
  return foundErrors;
};

// Get context around the error word
const getContext = (text: string, position: number, length: number): string => {
  const start = Math.max(0, position - 20);
  const end = Math.min(text.length, position + length + 20);
  return text.substring(start, end);
};

// Bengali-specific phonetic matching
const getPhoneticSuggestions = (word: string): string[] => {
  const phoneticMap: Record<string, string[]> = {
    // Common Bengali phonetic variations
    'া': ['া', 'আ'],
    'ে': ['ে', 'এ'],
    'ি': ['ি', 'ই'],
    'ু': ['ু', 'উ'],
    'ো': ['ো', 'ও'],
    // Common misspellings
    'সম্বব': ['সম্ভব'],
    'ছারপত্র': ['ছাড়পত্র'],
    'চাকুরিজিবি': ['চাকরিজীবী'],
    'চট্রগ্রামে': ['চট্টগ্রামে']
  };
  
  const suggestions = phoneticMap[word] || [];
  
  // Also try simple phonetic transformations
  if (word.includes('জিবি')) {
    suggestions.push(word.replace(/জিবি/g, 'জীবী'));
  }
  if (word.includes('রপত্র')) {
    suggestions.push(word.replace(/রপত্র/g, 'রপত্র'));
  }
  
  return [...new Set(suggestions)]; // Remove duplicates
};

// Enhanced spell checking with phonetic and grammar rules
const performSpellCheck = (text: string, options: SpellCheckOptions): SpellError[] => {
  const errors: SpellError[] = [];
  
  // Get stored corrections to use for local checking
  const storedCorrections = learningSystem.userPreferences.storedCorrections;
  
  // Basic word extraction (you can enhance this with proper Bengali tokenization)
  const words = text.match(/\b[\u0980-\u09FF]+\b/g) || [];
  
  words.forEach((word, index) => {
    // Check against stored corrections first
    const storedCorrection = storedCorrections.find(c => c.incorrect === word);
    if (storedCorrection && !storedCorrection.acceptedByUser) {
      const context = getContext(text, text.indexOf(word), word.length);
      errors.push({
        id: `stored-${word}-${index}`,
        incorrectWord: word,
        suggestions: [storedCorrection.correct],
        context,
        position: { start: text.indexOf(word), end: text.indexOf(word) + word.length },
        errorType: 'spelling',
        confidence: storedCorrection.confidence
      });
    }
    
    // Check against known misspellings
    const phoneticSuggestions = getPhoneticSuggestions(word);
    
    if (phoneticSuggestions.length > 0) {
      const context = getContext(text, text.indexOf(word), word.length);
      errors.push({
        id: `phonetic-${word}-${index}`,
        incorrectWord: word,
        suggestions: phoneticSuggestions,
        context,
        position: { start: text.indexOf(word), end: text.indexOf(word) + word.length },
        errorType: 'spelling',
        confidence: 0.7
      });
    }
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
    ...learningSystem.userPreferences.ignoreWords,
    'চাকুরিজিবি', 
    'চট্রগ্রামে', 
    'সম্বব', 
    'ছারপত্র'
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
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
      const savedTheme = localStorage.getItem('theme') as Theme;
      if (savedTheme) {
          setTheme(savedTheme);
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
          setTheme('dark');
      }
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
      // Use the browser-exposed VITE_ env variable
      const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

      // the @google/genai SDK may return a .text or .text() depending on version.
      // handle both safely:
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash", // you selected option A (fast)
        contents: `${documentText}`,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseSchema: RESPONSE_SCHEMA,
        },
      });

      let rawText: string;
      if (typeof response.text === "function") {
        rawText = await (response.text() as Promise<string>);
      } else {
        rawText = (response.text as unknown as string) ?? JSON.stringify(response);
      }

      const resultJson = JSON.parse(rawText) as AIResponse; // FIXED: Correct type reference
      setAnalysisResult(resultJson);

      // Generate errors from AI response
      const generatedErrors = generateErrorsFromAI(documentText, resultJson.spelling_corrections);
      setErrors(generatedErrors);

    } catch (error) {
      console.error("Error calling Gemini API:", error);
      // Fallback: use local spell checking
      const localErrors = performSpellCheck(documentText, spellCheckOptions);
      setErrors(localErrors);
    } finally {
      setIsChecking(false);
    }
  }, [documentText, spellCheckOptions]);

  const handleTextChange = useCallback((newText: string) => {
    setHistory(prev => [...prev, { documentText, ignoredWords }]);
    setDocumentText(newText);
    
    // Re-run spell check on text change (with debounce)
    if (analysisResult) {
      const newErrors = generateErrorsFromAI(newText, analysisResult.spelling_corrections);
      setErrors(newErrors);
    } else {
      // For real-time checking, you could implement local spell check here
      // const localErrors = performSpellCheck(newText, spellCheckOptions);
      // setErrors(localErrors);
      setErrors([]);
    }

    if (popup) {
      setPopup(null);
    }
  }, [popup, documentText, ignoredWords, analysisResult, spellCheckOptions]);

  const updateIgnoredWords = useCallback((updater: (prev: string[]) => string[]) => {
    setHistory(prev => [...prev, { documentText, ignoredWords }]);
    setIgnoredWords(updater);
  }, [documentText, ignoredWords]);
  
  const handleAcceptSuggestion = useCallback((errorId: string, suggestion: string) => {
    const errorToFix = errors.find(e => e.id === errorId);
    if (!errorToFix) return;

    // Learn from this correction
    learningSystem.learnFromCorrection(errorToFix, 'accept');

    // Use regex to replace all occurrences of the word with the suggestion
    const newText = documentText.replace(
      new RegExp(`\\b${errorToFix.incorrectWord}\\b`, 'g'), 
      suggestion
    );
    handleTextChange(newText);
    setPopup(null);
    setActiveErrorId(null);
  }, [documentText, errors, handleTextChange]);

  const handleDismissError = useCallback((errorId: string) => {
    const errorToDismiss = errors.find(e => e.id === errorId);
    if (!errorToDismiss) return;
    
    // Learn from this dismissal
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
    
    if (analysisResult) {
        const newErrors = generateErrorsFromAI(previousState.documentText, analysisResult.spelling_corrections);
        setErrors(newErrors);
    } else {
        setErrors([]);
    }
    
    setPopup(null);
    setActiveErrorId(null);
  }, [history, analysisResult]);

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
