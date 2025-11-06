// SuggestionPopup.tsx
import React from 'react';
import type { SuggestionPopupState } from '../types';
import { learningSystem } from './learning';

interface SuggestionPopupProps {
  state: SuggestionPopupState;
  onAccept: (errorId: string, suggestion: string) => void;
  onDismiss: (errorId: string) => void;
}

export const SuggestionPopup: React.FC<SuggestionPopupProps> = ({ state, onAccept, onDismiss }) => {
  const { error, position } = state;

  const handleAccept = (suggestion: string) => {
    learningSystem.learnFromCorrection(error, 'accept');
    onAccept(error.id, suggestion);
  };

  const handleDismiss = () => {
    learningSystem.learnFromCorrection(error, 'ignore');
    onDismiss(error.id);
  };

  // Check if this correction was stored from AI
  const isStoredCorrection = learningSystem.userPreferences.storedCorrections.some(
    c => c.incorrect === error.incorrectWord && c.correct === error.suggestions[0]
  );

  return (
    <div
      className="fixed z-10 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 p-3 animate-fade-in-up"
      style={{ top: `${position.top}px`, left: `${position.left}px`, transform: 'translateY(-100%)' }}
    >
      <div className="font-bengali text-red-600 dark:text-red-400 line-through mb-2 text-lg font-semibold">
        {error.incorrectWord}
        {isStoredCorrection && (
          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
            AI থেকে শেখা
          </span>
        )}
      </div>
      
      {error.suggestions.length > 0 && (
        <div className="space-y-1 mb-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">সংশোধন পরামর্শ:</p>
          {error.suggestions.map((suggestion, index) => (
            <div key={index} className="flex items-center justify-between group">
              <span className="font-bengali text-lg text-blue-600 dark:text-blue-400 font-semibold">{suggestion}</span>
              <button
                onClick={() => handleAccept(suggestion)}
                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100"
              >
                গ্রহণ
              </button>
            </div>
          ))}
        </div>
      )}
      
      {error.reason && (
        <div className="text-xs text-gray-600 dark:text-gray-300 mb-2 italic">
          কারণ: {error.reason}
        </div>
      )}
      
      <div className="border-t border-gray-200 dark:border-gray-600 mt-3 pt-2">
        <button
          onClick={handleDismiss}
          className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 w-full text-left"
        >
          উপেক্ষা করুন
        </button>
      </div>
      <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(-90%); }
          to { opacity: 1; transform: translateY(-100%); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
};
