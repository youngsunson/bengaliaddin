
export interface SpellError {
  id: string;
  incorrectWord: string;
  context: string;
  suggestions: string[];
}

export interface SuggestionPopupState {
  error: SpellError;
  position: {
    top: number;
    left: number;
  };
}

export interface AISuggestion {
  word: string;
  suggestion: string;
}

export interface AIResponse {
  spelling_corrections: AISuggestion[];
  missing_elements: string[];
  formatting_suggestions: string[];
  general_feedback: string;
}
