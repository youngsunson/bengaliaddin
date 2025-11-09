// learning.ts
import type { SpellError } from './types';

export interface UserPreference {
  personalDictionary: string[];
  frequentlyUsedWords: string[];
  writingStyle: 'formal' | 'informal' | 'academic';
  ignoreWords: string[];
  correctionHistory: {
    word: string;
    suggestion: string;
    accepted: boolean;
    timestamp: Date;
    source: 'ai' | 'user' | 'local';
  }[];
  mistakePatterns: {
    incorrect: string;
    correct: string;
    frequency: number;
  }[];
  // NEW: AI correction storage
  storedCorrections: {
    incorrect: string;
    correct: string;
    confidence: number;
    timestamp: Date;
    acceptedByUser: boolean;
    usageCount: number;
  }[];
  // NEW: User vocabulary
  userAcceptedWords: {
    word: string;
    context: string;
    timestamp: Date;
    acceptedFrom: 'suggestion' | 'manual';
  }[];
}

export interface LearningModel {
  userPreferences: UserPreference;
  updatePreferences: (updates: Partial<UserPreference>) => void;
  getPersonalSuggestions: (word: string) => string[];
  learnFromCorrection: (error: SpellError, action: 'accept' | 'reject' | 'ignore') => void;
  storeAICorrection: (incorrect: string, correct: string, confidence: number) => void;
  getUserAcceptedWords: () => string[];
  getStoredCorrection: (word: string) => string | null;
  saveToStorage: () => void;
  loadFromStorage: () => void;
}

export class BengaliLearningSystem implements LearningModel {
  userPreferences: UserPreference;
  
  constructor() {
    this.userPreferences = this.getDefaultPreferences();
    this.loadFromStorage();
  }
  
  getDefaultPreferences(): UserPreference {
    return {
      personalDictionary: [],
      frequentlyUsedWords: [],
      writingStyle: 'formal',
      ignoreWords: [],
      correctionHistory: [],
      mistakePatterns: [],
      storedCorrections: [],
      userAcceptedWords: []
    };
  }
  
  updatePreferences(updates: Partial<UserPreference>) {
    this.userPreferences = {
      ...this.userPreferences,
      ...updates
    };
    this.saveToStorage();
  }
  
  // Store AI corrections for future use
  storeAICorrection(incorrect: string, correct: string, confidence: number = 0.8) {
    const existingIndex = this.userPreferences.storedCorrections.findIndex(
      c => c.incorrect === incorrect && c.correct === correct
    );
    
    if (existingIndex >= 0) {
      // Update existing correction
      this.userPreferences.storedCorrections[existingIndex].confidence = Math.max(
        this.userPreferences.storedCorrections[existingIndex].confidence,
        confidence
      );
      this.userPreferences.storedCorrections[existingIndex].timestamp = new Date();
    } else {
      // Add new correction
      this.userPreferences.storedCorrections.push({
        incorrect,
        correct,
        confidence,
        timestamp: new Date(),
        acceptedByUser: false, // Will be set to true when user accepts
        usageCount: 0
      });
    }
    
    this.saveToStorage();
  }
  
  // Get stored correction for a word
  getStoredCorrection(word: string): string | null {
    const correction = this.userPreferences.storedCorrections
      .filter(c => c.incorrect === word)
      .sort((a, b) => b.confidence - a.confidence)[0];
    
    return correction ? correction.correct : null;
  }
  
  // Get user-accepted words
  getUserAcceptedWords(): string[] {
    return this.userPreferences.userAcceptedWords.map(item => item.word);
  }
  
  getPersonalSuggestions(word: string): string[] {
    // Check stored corrections
    const storedCorrection = this.getStoredCorrection(word);
    const storedSuggestions = storedCorrection ? [storedCorrection] : [];
    
    // Check user accepted words that are similar
    const userAcceptedMatches = this.userPreferences.userAcceptedWords
      .filter(item => 
        item.word.toLowerCase().includes(word.toLowerCase()) ||
        word.toLowerCase().includes(item.word.toLowerCase())
      )
      .map(item => item.word);
    
    // Check correction history
    const acceptedHistory = this.userPreferences.correctionHistory
      .filter(h => h.accepted && h.word === word)
      .map(h => h.suggestion);
    
    return [...new Set([
      ...storedSuggestions,
      ...userAcceptedMatches,
      ...acceptedHistory
    ])];
  }
  
  learnFromCorrection(error: SpellError, action: 'accept' | 'reject' | 'ignore') {
    const timestamp = new Date();
    
    // Update correction history
    this.userPreferences.correctionHistory.push({
      word: error.incorrectWord,
      suggestion: error.suggestions[0] || error.incorrectWord,
      accepted: action === 'accept',
      timestamp,
      source: 'ai' // Could be expanded to include source
    });
    
    // Track mistake patterns
    const patternIndex = this.userPreferences.mistakePatterns.findIndex(
      p => p.incorrect === error.incorrectWord
    );
    
    if (patternIndex >= 0) {
      this.userPreferences.mistakePatterns[patternIndex].frequency += 1;
    } else {
      this.userPreferences.mistakePatterns.push({
        incorrect: error.incorrectWord,
        correct: error.suggestions[0] || error.incorrectWord,
        frequency: 1
      });
    }
    
    // If accepted, add to frequently used words and user accepted words
    if (action === 'accept' && error.suggestions[0]) {
      // Add to user accepted words
      if (!this.userPreferences.userAcceptedWords.some(item => item.word === error.suggestions[0])) {
        this.userPreferences.userAcceptedWords.push({
          word: error.suggestions[0],
          context: error.context,
          timestamp: new Date(),
          acceptedFrom: 'suggestion'
        });
      }
      
      // Update stored correction if exists
      const storedIndex = this.userPreferences.storedCorrections.findIndex(
        c => c.incorrect === error.incorrectWord && c.correct === error.suggestions[0]
      );
      if (storedIndex >= 0) {
        this.userPreferences.storedCorrections[storedIndex].acceptedByUser = true;
        this.userPreferences.storedCorrections[storedIndex].usageCount += 1;
      }
    }
    
    // If ignored, add to ignore list
    if (action === 'ignore') {
      if (!this.userPreferences.ignoreWords.includes(error.incorrectWord)) {
        this.userPreferences.ignoreWords.push(error.incorrectWord);
      }
    }
    
    this.saveToStorage();
  }
  
  // NEW: Add user-accepted word manually
  addUserAcceptedWord(word: string, context: string = '') {
    const existingIndex = this.userPreferences.userAcceptedWords.findIndex(
      item => item.word === word
    );
    
    if (existingIndex >= 0) {
      // Update timestamp
      this.userPreferences.userAcceptedWords[existingIndex].timestamp = new Date();
    } else {
      // Add new word
      this.userPreferences.userAcceptedWords.push({
        word,
        context,
        timestamp: new Date(),
        acceptedFrom: 'manual'
      });
    }
    
    this.saveToStorage();
  }
  
  // NEW: Get enhanced suggestions combining all sources
  getEnhancedSuggestions(word: string, defaultSuggestions: string[]): string[] {
    const storedCorrection = this.getStoredCorrection(word);
    const personalSuggestions = this.getPersonalSuggestions(word);
    
    let enhancedSuggestions = [...defaultSuggestions];
    
    // Add stored correction first if exists
    if (storedCorrection) {
      enhancedSuggestions = [storedCorrection, ...enhancedSuggestions];
    }
    
    // Add personal suggestions
    enhancedSuggestions = [...new Set([
      ...personalSuggestions,
      ...enhancedSuggestions
    ])];
    
    return enhancedSuggestions.slice(0, 10);
  }
  
  saveToStorage() {
    try {
      // Convert dates to strings for storage
      const serializable = {
        ...this.userPreferences,
        correctionHistory: this.userPreferences.correctionHistory.map(h => ({
          ...h,
          timestamp: h.timestamp.toISOString()
        })),
        storedCorrections: this.userPreferences.storedCorrections.map(c => ({
          ...c,
          timestamp: c.timestamp.toISOString()
        })),
        userAcceptedWords: this.userPreferences.userAcceptedWords.map(w => ({
          ...w,
          timestamp: w.timestamp.toISOString()
        }))
      };
      localStorage.setItem('bengaliSpellingLearning', JSON.stringify(serializable));
    } catch (error) {
      console.error('Failed to save learning ', error);
    }
  }
  
  loadFromStorage() {
    try {
      const saved = localStorage.getItem('bengaliSpellingLearning');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.userPreferences = {
          ...this.getDefaultPreferences(),
          ...parsed,
          correctionHistory: parsed.correctionHistory?.map((h: any) => ({
            ...h,
            timestamp: new Date(h.timestamp)
          })) || [],
          storedCorrections: parsed.storedCorrections?.map((c: any) => ({
            ...c,
            timestamp: new Date(c.timestamp)
          })) || [],
          userAcceptedWords: parsed.userAcceptedWords?.map((w: any) => ({
            ...w,
            timestamp: new Date(w.timestamp)
          })) || []
        };
      }
    } catch (error) {
      console.error('Failed to load learning data:', error);
      this.userPreferences = this.getDefaultPreferences();
    }
  }
}

// Global instance
export const learningSystem = new BengaliLearningSystem();
