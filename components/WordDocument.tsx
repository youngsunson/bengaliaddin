
import React, { useMemo } from 'react';
import type { SpellError, SuggestionPopupState } from '../types';
import { SuggestionPopup } from './SuggestionPopup';

interface WordDocumentProps {
  text: string;
  onTextChange: (newText: string) => void;
  errors: SpellError[];
  popup: SuggestionPopupState | null;
  activeErrorId: string | null;
  onWordClick: (state: SuggestionPopupState) => void;
  onAcceptSuggestion: (errorId: string, suggestion: string) => void;
  onDismissError: (errorId: string) => void;
}

export const WordDocument: React.FC<WordDocumentProps> = ({
  text,
  onTextChange,
  errors,
  popup,
  activeErrorId,
  onWordClick,
  onAcceptSuggestion,
  onDismissError
}) => {
  
  const renderedContent = useMemo(() => {
    if (!errors.length) {
      return [text];
    }
    const errorMap = new Map<string, SpellError[]>();
    errors.forEach(error => {
      if (!errorMap.has(error.incorrectWord)) {
        errorMap.set(error.incorrectWord, []);
      }
      errorMap.get(error.incorrectWord)!.push(error);
    });
    
    const errorWords = errors.map(e => e.incorrectWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const uniqueErrorWords = [...new Set(errorWords)];
    if (uniqueErrorWords.length === 0) return [text];
    
    const errorWordsRegex = new RegExp(`(${uniqueErrorWords.join('|')})`, 'g');
    
    const parts = text.split(errorWordsRegex).filter(Boolean);

    let errorInstanceCounters: {[key: string]: number} = {};

    return parts.map((part, index) => {
      const errorInstances = errorMap.get(part);
      if (errorInstances) {
        const instanceIndex = errorInstanceCounters[part] || 0;
        const error = errorInstances.find(e => e.id.endsWith(`-${(text.indexOf(part, (errorInstanceCounters[part + '_lastIndex'] || -1) + 1))}`));
        errorInstanceCounters[part] = instanceIndex + 1;
        errorInstanceCounters[part + '_lastIndex'] = text.indexOf(part, (errorInstanceCounters[part + '_lastIndex'] || -1) + 1);

        if (error) {
            return (
              <span
                key={`${error.id}-${index}`}
                className={`font-bengali underline decoration-red-500 decoration-wavy decoration-2 underline-offset-2 cursor-pointer transition-colors duration-200 ${activeErrorId === error.id ? 'bg-red-100 dark:bg-red-500/20' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  const rect = e.currentTarget.getBoundingClientRect();
                  onWordClick({
                    error,
                    position: { top: rect.top - 10, left: rect.left },
                  });
                }}
              >
                {part}
              </span>
            );
        }
      }
      return part;
    });
  }, [text, errors, onWordClick, activeErrorId]);

  const commonStyles = "text-lg leading-relaxed font-bengali whitespace-pre-wrap bg-transparent border-none outline-none resize-none overflow-y-auto p-0 m-0";

  return (
    <div className="bg-white dark:bg-gray-800 p-12 shadow-lg max-w-4xl mx-auto min-h-full relative text-black dark:text-gray-200">
       <div 
        aria-hidden="true"
        className={`absolute top-12 left-12 right-12 bottom-12 pointer-events-none ${commonStyles}`}
      >
          {renderedContent.map((part, i) => <React.Fragment key={i}>{part}</React.Fragment>)}
      </div>
      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        className={`absolute top-12 left-12 right-12 bottom-12 w-[calc(100%-6rem)] h-[calc(100%-6rem)] text-transparent caret-black dark:caret-white ${commonStyles}`}
        spellCheck="false"
      />
      {popup && (
        <SuggestionPopup
          state={popup}
          onAccept={onAcceptSuggestion}
          onDismiss={onDismissError}
        />
      )}
    </div>
  );
};