// WordIntegration.ts
import { Word } from '@microsoft/office-js';

export const getWordDocumentText = async (): Promise<string> => {
  try {
    await Word.run(async (context) => {
      // Get the current document
      const doc = context.document;
      
      // Get all text from the document
      const body = doc.body;
      body.load('text');
      
      // Execute the request
      await context.sync();
      
      return body.text;
    });
  } catch (error) {
    console.error("Error getting Word document text:", error);
    return "";
  }
};

export const highlightSpellingErrorsInWord = async (errors: any[]): Promise<void> => {
  try {
    await Word.run(async (context) => {
      // Get the current document
      const doc = context.document;
      
      // For each error, highlight it in the document
      for (const error of errors) {
        // This is simplified - you'll need to implement actual highlighting
        // The Word API doesn't have direct support for underlining specific words
        // You may need to use ranges or other methods
        
        // Example: Find and highlight the incorrect word
        const range = doc.content;
        range.load('text');
        
        // This is a placeholder - you'll need to implement the actual logic
        // to find and highlight the specific words that are misspelled
      }
      
      // Execute the request
      await context.sync();
    });
  } catch (error) {
    console.error("Error highlighting spelling errors in Word:", error);
  }
};

export const replaceWordInWord = async (oldWord: string, newWord: string): Promise<void> => {
  try {
    await Word.run(async (context) => {
      // Get the current document
      const doc = context.document;
      
      // Replace all occurrences of oldWord with newWord
      const range = doc.content;
      range.load('text');
      
      // This is a simplified example - you'll need to implement proper replacement
      // The Word API has search and replace functionality
      
      await context.sync();
    });
  } catch (error) {
    console.error("Error replacing word in Word:", error);
  }
};
