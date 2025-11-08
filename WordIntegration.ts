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

/**
 * Highlights spelling or grammar errors in red underline or background.
 */
export const highlightSpellingErrorsInWord = async (
  errors: { incorrectWord: string }[]
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
        const searchResults = doc.body.search(error.incorrectWord, {
          matchCase: false,
          matchWholeWord: true,
        });
        searchResults.load("items");
        await context.sync();

        for (const item of searchResults.items) {
          // Apply visual highlight
          item.font.color = "red";
          item.font.highlightColor = "yellow";
          item.font.underline = "Single"; // safest underline type
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
