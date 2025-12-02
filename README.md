<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# TRD Live Learning - Roof-ER Training Generator

Interactive AI-powered training content generator for roofing sales teams.

**Live App:** https://trdlearn.up.railway.app/

## Quick Start

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set your Gemini API key in `.env.local`:
   ```env
   VITE_GEMINI_API_KEY=your_api_key_here
   ```

3. Run locally:
   ```bash
   npm run dev
   ```

## Railway Deployment

**IMPORTANT:** See [CRITICAL_RAILWAY_SETUP.md](CRITICAL_RAILWAY_SETUP.md) for deployment instructions.

The environment variable must be named `VITE_GEMINI_API_KEY` (not `GEMINI_API_KEY`).

For complete deployment documentation, see [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md).

## Documentation

- [CRITICAL_RAILWAY_SETUP.md](CRITICAL_RAILWAY_SETUP.md) - Immediate action required for Railway
- [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) - Complete deployment guide
- [CHANGES_SUMMARY.md](CHANGES_SUMMARY.md) - Recent fixes and changes

## Features

- Upload various file types (PDF, Excel, CSV, images, video)
- AI-powered training content generation using Google Gemini
- 9 different training output types (simulators, quizzes, flashcards, etc.)
- Interactive previews with download capability
