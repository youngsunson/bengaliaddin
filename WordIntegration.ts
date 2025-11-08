// WordIntegration.ts
declare global {
  interface Window {
    Word?: any;
  }
}

/**
 * Ensures Office.js and Word are ready before API calls.
 */
const ensureWordReady = async (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof Office !== "undefined" && Office.context) {
      resolve(true);
    } else {
      Office.onReady(() => resolve(true));
    }
  });
};

/**
 * Reads the full text from the active Word document body.
 */
export const getWordDocumentText = async (): Promise<string> => {
  try {
    await ensureWordReady();
    if (typeof Word === "undefined") {
      console.warn("Word API not available (probably dev mode)");
      return "";
    }

    return await Word.run(async (context) => {
      const body = context.document.body;
      body.load("text");
      await context.sync();
      return body.text;
    });
  } catch (error) {
    console.error("Error getting Word document text:", error);
    return "";
  }
};

// Define a type for the error object that includes position information
type WordErrorWithPosition = {
  incorrectWord: string;
  position: { start: number; end: number };
  // Add other properties if needed, like suggestions
};

/**
 * Highlights spelling or grammar errors in red underline or background using positional information.
 */
export const highlightSpellingErrorsInWord = async (
  errors: WordErrorWithPosition[] // <-- Updated type
): Promise<void> => {
  if (!errors?.length) return;

  try {
    await ensureWordReady();
    if (typeof Word === "undefined") {
      console.log("Highlight (dev mode):", errors);
      return;
    }

    await Word.run(async (context) => {
      const doc = context.document;

      for (const error of errors) {
        // Get the full document text to calculate the range
        doc.body.load("text");
        await context.sync();

        const fullText = doc.body.text;
        // Ensure the position is valid
        if (error.position.start >= 0 && error.position.end <= fullText.length) {
          // Extract the exact text segment based on position
          const targetText = fullText.substring(error.position.start, error.position.end);

          // Search for the exact text segment found via position
          const searchResults = doc.body.search(targetText, {
            matchCase: true, // Match the exact case as found by position
            matchWholeWord: false, // Don't match whole word, match the exact segment
          });
          searchResults.load("items");
          await context.sync();

          // Iterate through search results to find the one at the correct absolute position
          for (const item of searchResults.items) {
            item.load("text, font");
            await context.sync();

            // Calculate the absolute start position of the found item in the document
            const itemText = item.text;
            const itemStartPos = fullText.indexOf(itemText, error.position.start);
            const itemEndPos = itemStartPos + itemText.length;

            // Check if the found item's position matches the error's position
            if (itemStartPos === error.position.start && itemEndPos === error.position.end) {
              // Apply visual highlight
              item.font.color = "red";
              item.font.highlightColor = "yellow";
              item.font.underline = "Single"; // safest underline type
              console.log(`Highlighted word: "${itemText}" at position ${itemStartPos}-${itemEndPos}`);
              break; // Found the correct instance, move to next error
            }
          }
        }
      }

      await context.sync();
    });
  } catch (error) {
    console.error("Error highlighting spelling errors in Word:", error);
  }
};

/**
 * Replaces all occurrences of an incorrect word with a corrected one.
 */
export const replaceWordInWord = async (
  oldWord: string,
  newWord: string
): Promise<void> => {
  try {
    await ensureWordReady();
    if (typeof Word === "undefined") {
      console.log(`Replacing "${oldWord}" → "${newWord}" (dev mode)`);
      return;
    }

    await Word.run(async (context) => {
      const doc = context.document;
      const searchResults = doc.body.search(oldWord, {
        matchCase: false,
        matchWholeWord: true,
      });
      searchResults.load("items");
      await context.sync();

      for (const item of searchResults.items) {
        item.insertText(newWord, Word.InsertLocation.replace);
      }

      await context.sync();
    });
  } catch (error) {
    console.error("Error replacing word in Word:", error);
  }
};
