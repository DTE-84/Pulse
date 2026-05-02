export default async function (req: any, res: any) {
  const log: string[] = [];
  const check = async (name: string, path: string) => {
    try {
      log.push(`Checking ${name}...`);
      await import(path);
      log.push(`[OK] ${name}`);
    } catch (e: any) {
      log.push(`[FAIL] ${name}: ${e.message}`);
    }
  };

  await check("express", "express");
  await check("cors", "cors");
  await check("dotenv", "dotenv/config");
  await check("pg", "pg");
  await check("bcryptjs", "bcryptjs");
  await check("jsonwebtoken", "jsonwebtoken");
  await check("gemini", "@google/generative-ai");
  await check("server-root", "../src/server/index");

  res.json({ log });
}
