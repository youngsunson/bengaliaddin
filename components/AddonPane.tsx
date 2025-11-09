// components/AddonPane.tsx
import React, { useState } from 'react';
import type { SpellError, AIResponse } from '../types';
import { ErrorCard } from './ErrorCard';
import { learningSystem } from '../learning'; // Add this import

// Import SettingsIcon directly (we’ll use it instead of Ribbon)
const SettingsIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 0 2l-.15.08a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.38a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1 0-2l.15-.08a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
);

interface AddonPaneProps {
  errors: SpellError[];
  onAcceptSuggestion: (errorId: string, suggestion: string) => void;
  onDismissError: (errorId: string) => void;
  onCardHover: (id: string | null) => void;
  isChecking: boolean;
  analysisResult: AIResponse | null;
  onRunAnalysis: () => void;
  ignoredWords: string[];
  onIgnoredWordsChange: (updater: (prev: string[]) => string[]) => void;
  // ADD THIS NEW PROP
  onSettingsClick: () => void;
}

const InfoIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
);
const LightbulbIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="12" x2="12" y1="2" y2="6"/><line x1="12" x2="12" y1="18" y2="22"/><path d="M12 2a7 7 0 0 0-7 7c0 3 2 5 2 7h10c0-2 2-4 2-7a7 7 0 0 0-7-7Z"/><path d="M10 16h4"/></svg>
);
const SparklesIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M12 3L9.5 8.5 4 11l5.5 2.5L12 19l2.5-5.5L20 11l-5.5-2.5L12 3z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
);
const EyeOffIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
);
const SpellCheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m6 16 6-12 6 12"/><path d="M8 12h8"/><path d="m16 20 2 2 4-4"/></svg>
);

const CollapsibleSection: React.FC<{title: string; count: number; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean}> = ({ title, count, icon, children, defaultOpen = false }) => (
    <details className="bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700" open={defaultOpen}>
        <summary className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
            <div className="flex items-center space-x-3">
                <span className="text-gray-500 dark:text-gray-400">{icon}</span>
                <h3 className="font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
            </div>
            <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 text-xs font-medium text-white bg-blue-500 rounded-full">{count}</span>
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400 transition-transform duration-200 transform details-arrow" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
            </div>
        </summary>
        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            {children}
        </div>
        <style>{`
            details[open] .details-arrow { transform: rotate(180deg); }
        `}</style>
    </details>
);

const IgnoredWordsManager: React.FC<{words: string[], onChange: (updater: (prev: string[]) => string[]) => void;}> = ({ words, onChange }) => {
    const [newWord, setNewWord] = useState('');

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = newWord.trim();
        if (trimmed && !words.includes(trimmed)) {
            onChange(prev => [...prev, trimmed]);
            setNewWord('');
        }
    };

    const handleRemove = (word: string) => {
        onChange(prev => prev.filter(w => w !== word));
    };

    return (
        <div>
            <form onSubmit={handleAdd} className="flex space-x-2 mb-3">
                <input
                    type="text"
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    placeholder="Add word to ignore..."
                    className="flex-grow p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bengali bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                />
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Add</button>
            </form>
            <div className="max-h-32 overflow-y-auto space-y-1 pr-2">
                {words.length > 0 ? (
                    words.map(word => (
                        <div key={word} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-600/50 rounded">
                            <span className="font-bengali text-gray-700 dark:text-gray-300">{word}</span>
                            <button onClick={() => handleRemove(word)} className="text-xs text-red-500 hover:underline">Remove</button>
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">No ignored words.</p>
                )}
            </div>
        </div>
    );
};

export const AddonPane: React.FC<AddonPaneProps> = ({ errors, onAcceptSuggestion, onDismissError, onCardHover, isChecking, analysisResult, onRunAnalysis, ignoredWords, onIgnoredWordsChange, onSettingsClick }) => { // <-- Add onSettingsClick to destructuring
    // Get learning statistics
    const storedCorrectionsCount = learningSystem.userPreferences.storedCorrections.length;
    const userAcceptedWordsCount = learningSystem.userPreferences.userAcceptedWords.length;

    // Remove local state and function for settings panel if they existed
    // const [showSettings, setShowSettings] = useState(false); // <-- Remove if present
    // const toggleSettings = () => { setShowSettings(!showSettings); }; // <-- Remove if present

    return (
        <div className="h-full flex flex-col">
            {/* Header with only the gear icon */}
            <header className="p-4 border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Bengali Writing Assistant</h1>
                <button
                    onClick={onSettingsClick} // <-- Call the function passed from App.tsx
                    className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                >
                    <SettingsIcon className="w-5 h-5" />
                </button>
            </header>

            {/* Main Content */}
            <div className="flex-grow overflow-y-auto bg-gray-100 dark:bg-gray-800/50 p-4 space-y-4">
                 <button
                    onClick={onRunAnalysis}
                    disabled={isChecking}
                    className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
                >
                    {isChecking ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Analyzing...
                        </>
                    ) : 'Analyze Document'}
                </button>

                {!isChecking && !analysisResult && errors.length === 0 && (
                     <div className="text-center text-gray-500 dark:text-gray-400 p-8 bg-white dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <InfoIcon className="w-12 h-12 mx-auto text-blue-400 mb-3" />
                        <h3 className="font-semibold text-gray-700 dark:text-gray-200">Ready for analysis</h3>
                        <p className="text-sm">Click the button above to get feedback on your document.</p>
                    </div>
                )}

                {analysisResult && (
                    <div className="bg-blue-50 dark:bg-blue-900/40 border-l-4 border-blue-400 dark:border-blue-500 text-blue-800 dark:text-blue-200 p-4 rounded-r-lg" role="alert">
                        <p className="font-bold">General Feedback</p>
                        <p>{analysisResult.general_feedback}</p>
                    </div>
                )}

                {(analysisResult || errors.length > 0) && (
                    <>
                        <CollapsibleSection title="Spelling Corrections" count={errors.length} icon={<SpellCheckIcon className="w-5 h-5"/>} defaultOpen={errors.length > 0}>
                            {errors.length > 0 ? (
                                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                                    {errors.map(error => (
                                        <ErrorCard
                                            key={error.id}
                                            error={error}
                                            onAcceptSuggestion={onAcceptSuggestion}
                                            onDismissError={onDismissError}
                                            onHover={onCardHover}
                                        />
                                    ))}
                                </div>
                            ) : <p className="text-sm text-gray-500 dark:text-gray-400">No spelling errors found.</p>}
                        </CollapsibleSection>

                        <CollapsibleSection title="Structural Suggestions" count={analysisResult?.missing_elements.length ?? 0} icon={<LightbulbIcon className="w-5 h-5"/>} defaultOpen={(analysisResult?.missing_elements.length ?? 0) > 0}>
                             {analysisResult?.missing_elements && analysisResult.missing_elements.length > 0 ? (
                                <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
                                    {analysisResult.missing_elements.map((item, index) => <li key={index} className="text-sm">{item}</li>)}
                                </ul>
                             ) : <p className="text-sm text-gray-500 dark:text-gray-400">No structural suggestions.</p>}
                        </CollapsibleSection>

                        <CollapsibleSection title="Formatting Suggestions" count={analysisResult?.formatting_suggestions.length ?? 0} icon={<SparklesIcon className="w-5 h-5"/>} defaultOpen={(analysisResult?.formatting_suggestions.length ?? 0) > 0}>
                            {analysisResult?.formatting_suggestions && analysisResult.formatting_suggestions.length > 0 ? (
                                <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
                                    {analysisResult.formatting_suggestions.map((item, index) => <li key={index} className="text-sm">{item}</li>)}
                                </ul>
                            ) : <p className="text-sm text-gray-500 dark:text-gray-400">No formatting suggestions.</p>}
                        </CollapsibleSection>
                    </>
                )}

                {/* NEW: Learning System Section */}
                <CollapsibleSection title="Learning System" count={storedCorrectionsCount + userAcceptedWordsCount} icon={<LightbulbIcon className="w-5 h-5"/>}>
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-2 rounded">
                                <p className="text-blue-800 dark:text-blue-200">Stored Corrections</p>
                                <p className="font-semibold text-blue-900 dark:text-blue-100">{storedCorrectionsCount}</p>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/30 p-2 rounded">
                                <p className="text-green-800 dark:text-green-200">Accepted Words</p>
                                <p className="font-semibold text-green-900 dark:text-green-100">{userAcceptedWordsCount}</p>
                            </div>
                        </div>

                        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => learningSystem.saveToStorage()}
                                className="w-full px-3 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 text-sm"
                            >
                                Save Learning Data
                            </button>
                        </div>
                    </div>
                </CollapsibleSection>

                <CollapsibleSection title="Ignored Words" count={ignoredWords.length} icon={<EyeOffIcon className="w-5 h-5"/>}>
                   <IgnoredWordsManager words={ignoredWords} onChange={onIgnoredWordsChange} />
                </CollapsibleSection>
            </div>
        </div>
    );
};
