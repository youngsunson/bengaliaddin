// WordIntegration.ts
declare global {
  interface Window {
    Word?: any;
  }
}

export const getWordDocumentText = async (): Promise<string> => {
  try {
    // Check if we're running in a Word environment
    if (typeof window !== 'undefined' && typeof Word !== 'undefined') {
      // We're in a Word add-in environment
      return await Word.run(async (context) => {
        const doc = context.document;
        const body = doc.body;
        body.load('text'); // Load the text property
        await context.sync(); // Sync the context to get the data
        return body.text;
      });
    } else {
      // We're not in a Word environment (development/testing)
      // Return an empty string since there's no actual Word document
      console.warn("Not running in Word environment - returning empty string");
      return "";
    }
  } catch (error) {
    console.error("Error getting Word document text:", error);
    return "";
  }
};

export const highlightSpellingErrorsInWord = async (errors: any[]): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && typeof Word !== 'undefined') {
      // We're in a Word add-in environment
      await Word.run(async (context) => {
        const doc = context.document;
        
        // For each error, highlight it in the document
        for (const error of errors) {
          // Find all occurrences of the incorrect word
          const searchResults = doc.body.search(error.incorrectWord, {
            matchCase: false,
            matchWholeWord: true
          });
          searchResults.load('items');
          await context.sync();
          
          // Highlight each occurrence
          for (const result of searchResults.items) {
            result.font.color = "red";
            result.font.underline = Word.UnderlineType.wave;
          }
        }
        
        await context.sync();
      });
    } else {
      // Development/testing: just log the errors
      console.log("Highlighting errors in Word (dev mode):", errors);
    }
  } catch (error) {
    console.error("Error highlighting spelling errors in Word:", error);
  }
};

export const replaceWordInWord = async (oldWord: string, newWord: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && typeof Word !== 'undefined') {
      // We're in a Word add-in environment
      await Word.run(async (context) => {
        const doc = context.document;
        
        // Replace all occurrences of oldWord with newWord
        doc.body.replace(oldWord, newWord, {
          matchCase: false,
          matchWholeWord: true
        });
        
        await context.sync();
      });
    } else {
      // Development/testing: just log the replacement
      console.log(`Replacing "${oldWord}" with "${newWord}" in Word document (dev mode)`);
    }
  } catch (error) {
    console.error("Error replacing word in Word:", error);
  }
};
