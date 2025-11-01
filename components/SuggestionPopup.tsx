
import React from 'react';
import type { SuggestionPopupState } from '../types';

interface SuggestionPopupProps {
  state: SuggestionPopupState;
  onAccept: (errorId: string, suggestion: string) => void;
  onDismiss: (errorId: string) => void;
}

export const SuggestionPopup: React.FC<SuggestionPopupProps> = ({ state, onAccept, onDismiss }) => {
  const { error, position } = state;

  return (
    <div
      className="fixed z-10 w-64 bg-white dark:bg-gray-700 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-600 p-3 animate-fade-in-up"
      style={{ top: `${position.top}px`, left: `${position.left}px`, transform: 'translateY(-100%)' }}
    >
      <div className="font-bengali text-red-600 dark:text-red-400 line-through mb-2">{error.incorrectWord}</div>
      <div className="space-y-1">
        {error.suggestions.map((suggestion, index) => (
          <div key={index} className="flex items-center justify-between group">
            <span className="font-bengali text-lg text-blue-600 dark:text-blue-400 font-semibold">{suggestion}</span>
            <button
              onClick={() => onAccept(error.id, suggestion)}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100"
            >
              Accept
            </button>
          </div>
        ))}
      </div>
      <div className="border-t border-gray-200 dark:border-gray-600 mt-3 pt-2">
        <button
          onClick={() => onDismiss(error.id)}
          className="text-sm text-gray-600 dark:text-gray-300 hover:text-red-500 dark:hover:text-red-400 w-full text-left"
        >
          Dismiss
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