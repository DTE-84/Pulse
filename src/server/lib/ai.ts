import Anthropic from "@anthropic-ai/sdk";

const MAX_RETRIES = 2;
const INITIAL_DELAY_MS = 1000;
const FALLBACK_MODEL = "claude-3-haiku-20240307";

/**
 * Wraps Anthropic client calls with exponential backoff and a model fallback.
 * Automatically catches rate limits (429), overloads (529), and 5xx errors.
 */
export async function createClaudeMessageWithRetry(
  client: Anthropic,
  params: Anthropic.Messages.MessageCreateParamsNonStreaming,
  maxRetries: number = MAX_RETRIES
): Promise<Anthropic.Messages.Message> {
  let attempt = 0;
  let delay = INITIAL_DELAY_MS;
  let currentParams = { ...params };
  let isFallback = false;

  while (true) {
    attempt++;
    try {
      const response = await client.messages.create(currentParams);
      return response;
    } catch (err: any) {
      const status = err?.status;
      // Retry on Rate Limits, Overloads, and internal server errors
      const isRetryable = status === 429 || status === 529 || (status >= 500 && status < 600);

      if (!isRetryable) {
        // Non-retryable error (e.g., 400 Bad Request, 401 Unauthorized, 404 Not Found)
        throw err;
      }

      console.warn(`[Nova AI] API Error (${status}) on attempt ${attempt}: ${err.message || String(err)}`);

      if (attempt > maxRetries) {
        // Exhausted retries for the current model.
        if (!isFallback && currentParams.model !== FALLBACK_MODEL) {
          console.warn(`[Nova AI] Retries exhausted for ${currentParams.model}. Activating fallback to ${FALLBACK_MODEL}...`);
          isFallback = true;
          currentParams = { ...currentParams, model: FALLBACK_MODEL };
          attempt = 0; // Reset attempts for the fallback model
          maxRetries = 1; // Give the fallback model 1 retry (2 attempts total)
          delay = INITIAL_DELAY_MS;
          continue;
        }
        
        // Exhausted all retries including fallback
        throw err;
      }

      console.warn(`[Nova AI] Retrying in ${delay}ms...`);
      await new Promise((res) => setTimeout(res, delay));
      delay *= 2; // Exponential backoff
    }
  }
}
