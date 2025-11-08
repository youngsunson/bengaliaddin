// types.ts
export interface SpellError {
  id: string;
  incorrectWord: string;
  context: string;
  suggestions: string[];
  position: { start: number; end: number }; // Precise location
  errorType: 'spelling' | 'grammar' | 'formatting';
  confidence: number; // 0-1 confidence score
  reason?: string; // Optional reason for the error
}

export interface SuggestionPopupState {
  error: SpellError;
  position: {
    top: number;
    left: number;
  };
  contextText?: string; // Full document text for context snippet
}

export interface AISuggestion {
  word: string;
  suggestion: string;
  confidence?: number;
  reason?: string;
}

export interface AIResponse {
  spelling_corrections: AISuggestion[];
  missing_elements: string[];
  formatting_suggestions: string[];
  general_feedback: string;
}

// Add Bengali-specific types
export interface BengaliGrammarRule {
  pattern: RegExp;
  message: string;
  suggestion: string;
}

export interface SpellCheckOptions {
  enablePhonetic: boolean;
  enableGrammar: boolean;
  strictness: 'loose' | 'moderate' | 'strict';
}
