# Pulse

Pulse is a behavioral finance app that helps users understand **why** they spend, not just **where** the money went.

Instead of acting like a basic budgeting dashboard, Pulse is designed to:

- track spending patterns over time
- surface likely trigger behavior
- connect day-to-day decisions to savings goals
- give users coaching-style feedback through Nova

## What Pulse does

### Behavioral spending insight
Pulse looks for patterns such as recurring overspend categories, timing-based habits, and other signs that a user may be drifting away from their baseline.

### Goal-aware feedback
The product is meant to tie avoided trigger spending back to real outcomes: more savings, better monthly control, and clearer long-term progress.

### Guided AI support
Nova is the conversational layer that turns transaction and stats data into plain-language coaching, observations, and next-step suggestions.

## Repo shape

This repository currently contains a few major pieces:

- `client/` - frontend app for the Pulse experience
- `server/` - backend services and supporting logic
- `sql/` - SQL used for analytics and warehouse-style modeling
- `__tests__/` - test assets and integration checks
- `public/` - static assets

## Behavioral pipeline
Pulse is built around the idea that transaction data becomes more useful when it is paired with behavioral interpretation.

High-level flow:

1. ingest raw financial activity
2. normalize and classify transactions
3. store structured data for analysis
4. calculate spending trends, deltas, and trigger signals
5. present those results in the app and through Nova

## Product direction

Pulse is strongest when it stays grounded in real user outcomes:

- help users notice trigger spending earlier
- make monthly drift obvious before it compounds
- show how behavior changes improve savings capacity
- keep the experience supportive instead of shame-driven

## Notes

This repo is actively evolving. If you are making product or engineering changes, prioritize clarity over branding language and keep the connection between **behavior**, **money**, and **goals** obvious in both code and copy.
