
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Explicitly check for the API key when the module is loaded (server starts)
// This helps catch configuration errors early, especially in local development.
if (typeof process !== 'undefined' && !(process.env.NODE_ENV === 'test' && process.env.VITEST_WORKER_ID)) { // Avoid check in certain test environments
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error(
      "\n\n\x1b[31m%s\x1b[0m", // ANSI escape code for red text
      "**************************************************************************************\n" +
      "CRITICAL CONFIGURATION ERROR:\n" +
      "GOOGLE_API_KEY or GEMINI_API_KEY is not set in the environment.\n" +
      "The application's AI features (Genkit flows) WILL NOT function correctly.\n\n" +
      "To fix this:\n" +
      "1. For Local Development: Ensure the key is present in your '.env' file at the project root.\n" +
      "   Example .env content: GOOGLE_API_KEY=AIzaSyYOUR_KEY_HERE\n" +
      "2. For Vercel/Production Deployment: Ensure the key is set as an environment variable\n" +
      "   in your Vercel project settings.\n\n" +
      "Refer to Genkit documentation for Google AI plugin for more details:\n" +
      "https://firebase.google.com/docs/genkit/plugins/google-genai\n" +
      "**************************************************************************************\n\n"
    );
    // Depending on the desired behavior, you could throw an error here to halt server startup:
    // throw new Error("Missing Google AI API Key. AI services cannot be initialized.");
  }
}

export const ai = genkit({
  plugins: [googleAI()], // The googleAI plugin will look for GOOGLE_API_KEY or GEMINI_API_KEY in process.env
  model: 'googleai/gemini-2.0-flash',
});
