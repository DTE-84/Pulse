# Pulse — Security Documentation

## Status: Hardened (Session 1)

All critical vulnerabilities identified in the initial audit have been resolved.
This document is the living record of what was fixed, what is in place, and what to verify before production.

---

## What Was Fixed

### 1. JWT Secret — No Fallback (Critical)
**Before:** `JWT_SECRET = process.env.JWT_SECRET || "dte-high-fidelity-secret"`  
A hardcoded fallback meant forged tokens were possible if the env var was not set.

**After:** Server calls `process.exit(1)` at startup if `JWT_SECRET` is missing or under 32 characters.  
Source of truth: `server/middleware/security.ts`

### 2. Shell Injection in Ingest Route (Critical)
**Before:** `exec()` with a shell-interpolated path — any shell metacharacter in the path could execute arbitrary commands.

**After:** Replaced with `spawn()` passing arguments as an array. No shell is invoked.

### 3. CSV Injection (High)
**Before:** Raw user-supplied strings written directly to CSV without sanitization.  
A newline in `category` would inject a fake transaction row.

**After:** `sanitizeCsvField()` strips newlines, commas, double-quotes, and backticks from every field before writing.

### 4. No Input Validation on Ingest (High)
**Before:** No shape or type checking on the transactions array.

**After:** `validateTransaction()` checks every item before the CSV is written or the DB is touched.

### 5. CORS Wide Open (High)
**Before:** `app.use(cors())` — accepted requests from any origin.

**After:** Origin whitelist driven by `ALLOWED_ORIGINS` env var. Rejects all unlisted origins in production.

### 6. No Rate Limiting on Auth (High)
**Before:** Login and signup endpoints had no brute-force protection.

**After:** `authLimiter` — 10 attempts per 15 minutes per IP on all auth routes.

### 7. SSL rejectUnauthorized: false in Production (Medium)
**Before:** `rejectUnauthorized: false` accepted invalid TLS certificates, enabling MITM attacks.

**After:** `rejectUnauthorized: true` in production. Development remains unrestricted.

### 8. updateProfile Bug — 404 Never Triggered (Medium)
**Before:** `result.rows.length === -1` — array length is never negative. Missing user returned 200.

**After:** Corrected to `result.rows.length === 0`.

### 9. Duplicated JWT Logic Across Routes (Low-Medium)
**Before:** Each route copy-pasted the same JWT verify block. One change needed updating in 4 places.

**After:** Single `requireAuth` middleware in `server/middleware/security.ts`. Applied at the route registration level in `server/index.ts`.

---

## Supabase RLS — Action Required

The stress test used the **service role key** which bypasses Row Level Security.  
Before real users touch real financial data, run the RLS policies in `sql/rls_policies.sql` in your Supabase SQL Editor.

These policies ensure:
- Users can only SELECT and UPDATE their own `dim_users` row
- Users can only SELECT and INSERT their own `fact_transactions`
- Users can only access their own `threads` and `messages`

**Verify after applying:**


---

## Pre-Production Checklist

- [ ] `JWT_SECRET` set in production env (64+ char random hex)
- [ ] `ALLOWED_ORIGINS` set to production domain only
- [ ] `DATABASE_URL` points to production DB over SSL
- [ ] `NODE_ENV=production` set
- [ ] RLS policies applied in Supabase (`sql/rls_policies.sql`)
- [ ] `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` is the **anon key** (not service role)
- [ ] Service role key is **not** in any client-side code or NEXT_PUBLIC variable
- [ ] `.env` is in `.gitignore`
- [ ] Temp CSV files (`transactions_temp.csv`, `pulse_ingest.csv`) are in `.gitignore`

---

## What Comes Next (Session 2)

- Nova LLM integration (GPT-4o-mini + financial context injection)
- Goals table + impact calculation engine
- Persistent Nova conversation history via threads/messages