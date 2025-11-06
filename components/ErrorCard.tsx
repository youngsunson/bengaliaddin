// ErrorCard.tsx
import React from 'react';
import type { SpellError } from '../types';
import { learningSystem } from '../learning';

interface ErrorCardProps {
  error: SpellError;
  onAcceptSuggestion: (errorId: string, suggestion: string) => void;
  onDismissError: (errorId: string) => void;
  onHover: (id: string | null) => void;
}

const CheckIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polyline points="20 6 9 17 4 12"/></svg>
);

const XIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

export const ErrorCard: React.FC<ErrorCardProps> = ({ error, onAcceptSuggestion, onDismissError, onHover }) => {
  const handleAccept = (suggestion: string) => {
    learningSystem.learnFromCorrection(error, 'accept');
    onAcceptSuggestion(error.id, suggestion);
  };

  const handleDismiss = () => {
    learningSystem.learnFromCorrection(error, 'ignore');
    onDismissError(error.id);
  };

  return (
    <div 
        className="bg-white dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm hover:shadow-md hover:border-blue-300 dark:hover:border-blue-500 transition-shadow duration-200"
        onMouseEnter={() => onHover(error.id)}
        onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="font-bengali text-red-600 dark:text-red-400 line-through text-lg font-semibold">{error.incorrectWord}</p>
          {error.reason && (
            <p className="text-xs text-gray-500 dark:text-gray-400 italic">কারণ: {error.reason}</p>
          )}
        </div>
        <button onClick={handleDismiss} className="text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400">
            <XIcon className="w-5 h-5"/>
        </button>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 italic mb-3">"…{error.context}…"</p>
      
      <div className="space-y-2">
        {error.suggestions.map(suggestion => (
          <button 
            key={suggestion} 
            onClick={() => handleAccept(suggestion)}
            className="w-full text-left px-3 py-2 rounded-md bg-gray-50 dark:bg-gray-600/50 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-700 transition-colors duration-150 flex items-center justify-between group"
          >
            <span className="font-bengali font-semibold text-blue-600 dark:text-blue-300">{suggestion}</span>
            <CheckIcon className="w-5 h-5 text-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        ))}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
        বিশ্বাস: {(error.confidence * 100).toFixed(0)}%
      </div>
    </div>
  );
};
