// scripts/test-anthropic.ts
import Anthropic from "@anthropic-ai/sdk";
import * as fs from "fs";
import * as dotenv from "dotenv";

// Force load from .env file to override parent process env
const envConfig = dotenv.parse(fs.readFileSync(".env"));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const apiKey = process.env.ANTHROPIC_API_KEY;
console.log("Using API Key from .env:", apiKey ? apiKey.slice(0, 20) + "..." : "MISSING");

if (!apiKey) {
  console.error("No Anthropic API Key found.");
  process.exit(1);
}

const client = new Anthropic({ apiKey });

async function tryModel(modelName: string) {
  try {
    console.log(`Trying model: ${modelName}...`);
    const message = await client.messages.create({
      model: modelName,
      max_tokens: 102,
      messages: [{ role: "user", content: "Hello, are you operational?" }],
    });
    console.log(`✅ Success for ${modelName}! Response:`, message.content[0].type === "text" ? message.content[0].text : "non-text");
    return true;
  } catch (err: any) {
    console.error(`❌ Failed for ${modelName}:`, err.message);
    return false;
  }
}

async function run() {
  const models = [
    "claude-3-5-sonnet-latest",
    "claude-3-5-sonnet-20241022",
    "claude-3-5-sonnet-20240620",
    "claude-3-haiku-20240307",
  ];
  for (const model of models) {
    const success = await tryModel(model);
    if (success) {
      console.log(`\nFound working model: ${model}`);
      break;
    }
  }
}

run();
