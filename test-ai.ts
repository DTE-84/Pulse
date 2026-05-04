import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

async function testAI() {
  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    console.error("GOOGLE_GENAI_API_KEY is missing");
    return;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

  try {
    console.log("Testing Gemini 1.5 Pro...");
    const result = await model.generateContent("Say hello in a professional senior analyst tone.");
    console.log("Response:", result.response.text());
  } catch (err: any) {
    console.error("AI Test Failed:", err.message);
  }
}

testAI();
