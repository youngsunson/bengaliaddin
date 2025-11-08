// WordIntegration.ts
declare global {
  interface Window {
    Word?: any;
  }
}

export const getWordDocumentText = async (): Promise<string> => {
  try {
    if (typeof window !== 'undefined' && window.Word) {
      // In a real Word add-in, this would be:
      return await Word.run(async (context) => {
        const doc = context.document;
        const body = doc.body;
        body.load('text');
        await context.sync();
        return body.text;
      });
    } else {
      // For development/testing purposes, return empty string
      return "";
    }
  } catch (error) {
    console.error("Error getting Word document text:", error);
    return "";
  }
};

export const highlightSpellingErrorsInWord = async (errors: any[]): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.Word) {
      // In a real Word add-in, this would be:
      await Word.run(async (context) => {
        const doc = context.document;
        
        // For each error, highlight it in the document
        for (const error of errors) {
          // Find all occurrences of the incorrect word
          const searchResults = doc.content.search(error.incorrectWord, {
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
      // For development, just log the errors
      console.log("Highlighting errors in Word:", errors);
    }
  } catch (error) {
    console.error("Error highlighting spelling errors in Word:", error);
  }
};

export const replaceWordInWord = async (oldWord: string, newWord: string): Promise<void> => {
  try {
    if (typeof window !== 'undefined' && window.Word) {
      // In a real Word add-in, this would be:
      await Word.run(async (context) => {
        const doc = context.document;
        
        // Replace all occurrences of oldWord with newWord
        doc.content.replace(oldWord, newWord, {
          matchCase: false,
          matchWholeWord: true
        });
        
        await context.sync();
      });
    } else {
      // For development, just log the replacement
      console.log(`Replacing "${oldWord}" with "${newWord}" in Word document`);
    }
  } catch (error) {
    console.error("Error replacing word in Word:", error);
  }
};
