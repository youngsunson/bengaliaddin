<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1tpHoLgmwBBxJY4bTodLDBKD7SksSrq15

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set `VITE_GEMINI_API_KEY` in `.env.local` to your Gemini API key.
3. Run the app:
   `npm run dev`

## Important: Word Online CSP

- When running inside Word Online, the task pane is subject to strict Content Security Policy (CSP). Direct connections to external AI endpoints (e.g., `generativelanguage.googleapis.com`) are typically blocked.
- Use a backend proxy hosted on the same origin as your add-in’s `SourceLocation` to relay AI requests, then point the frontend to that proxy. Or run the add-in in the desktop Word client (which has different restrictions).
- Ensure you only call Word APIs after `Office.onReady()` and wrap document operations in `Word.run`.
