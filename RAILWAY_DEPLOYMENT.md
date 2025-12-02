# Railway Deployment Guide for TRD Live Learning

## The Problem (SOLVED)

Previously, the app was showing "API key not valid" errors on Railway despite having the `GEMINI_API_KEY` environment variable set in the Railway dashboard. This was because:

1. **Railway provides env vars at RUNTIME, not BUILD TIME**
2. **Vite needs env vars at BUILD TIME** to embed them in the JavaScript bundle
3. The old approach used `process.env` which doesn't work in Vite/browser environments

## The Solution

We now use Vite's built-in environment variable system with the `VITE_` prefix, which:
- Automatically embeds env vars at build time
- Works seamlessly in both development and production
- Follows Vite best practices

## Railway Setup Instructions

### Step 1: Update Environment Variable in Railway Dashboard

1. Go to your Railway project: https://railway.app/project/[your-project-id]
2. Click on your service (TRD-Live-Learning)
3. Go to the "Variables" tab
4. **DELETE** the old `GEMINI_API_KEY` variable
5. **ADD** a new variable:
   - **Name**: `VITE_GEMINI_API_KEY`
   - **Value**: Your Gemini API key (starts with `AIzaSy...`)
6. Click "Add" to save

### Step 2: Verify railway.json Configuration

The `railway.json` file should contain:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  "deploy": {
    "numReplicas": 1,
    "startCommand": "npm run start",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

This ensures Railway runs `npm run build` during deployment, which is when Vite embeds the environment variables.

### Step 3: Deploy

Simply push to the `main` branch:

```bash
git add .
git commit -m "fix: Update to use VITE_GEMINI_API_KEY for Railway deployment"
git push origin main
```

Railway will automatically:
1. Detect the push
2. Run `npm install`
3. Run `npm run build` (embeds `VITE_GEMINI_API_KEY` at this point)
4. Run `npm run start` to serve the built files
5. Deploy to https://trdlearn.up.railway.app/

### Step 4: Verify Deployment

1. Wait 2-3 minutes for Railway to build and deploy
2. Check the build logs in Railway dashboard for any errors
3. Visit https://trdlearn.up.railway.app/
4. Upload a file and test the AI generation
5. Check browser console (F12) - there should be NO "API key not valid" errors

## How It Works

### Local Development (.env.local)

```env
VITE_GEMINI_API_KEY=AIzaSy...your-key-here...
```

- Vite automatically loads `.env.local` files
- Variables prefixed with `VITE_` are exposed to your app
- Access via `import.meta.env.VITE_GEMINI_API_KEY`

### Production (Railway)

1. Railway sets `VITE_GEMINI_API_KEY` as an environment variable
2. During `npm run build`, Vite reads this variable
3. Vite replaces all `import.meta.env.VITE_GEMINI_API_KEY` references with the actual key value
4. The built JavaScript bundle contains the embedded API key
5. No runtime environment variable lookup needed

### Code Changes

**services/gemini.ts** (OLD):
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

**services/gemini.ts** (NEW):
```typescript
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY });
```

**vite.config.ts** (OLD):
```typescript
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    return {
      // ... config
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
      }
    };
});
```

**vite.config.ts** (NEW):
```typescript
export default defineConfig({
  // No need to manually define env vars - Vite handles VITE_* automatically
  server: { port: 3000, host: '0.0.0.0' },
  plugins: [react()],
  // ...
});
```

## Verification Checklist

After deployment, verify these items:

- [ ] Railway environment variable is named `VITE_GEMINI_API_KEY` (not `GEMINI_API_KEY`)
- [ ] Build logs show `npm run build` executing successfully
- [ ] Build logs show Vite transforming modules
- [ ] Deployment succeeds and app is accessible
- [ ] No "API key not valid" errors in browser console
- [ ] File upload and AI generation works
- [ ] Bundle hash changes after each deployment (indicates new build)

## Troubleshooting

### Issue: "API key not valid" still appears

**Solution:**
1. Check Railway dashboard - ensure variable is named `VITE_GEMINI_API_KEY`
2. Trigger a new build: push any change to trigger rebuild
3. Check build logs - ensure `npm run build` runs
4. Clear browser cache and hard reload (Ctrl+Shift+R)

### Issue: Build fails with "VITE_GEMINI_API_KEY is not set"

**Solution:**
1. Verify the environment variable exists in Railway dashboard
2. Check spelling - it must be exactly `VITE_GEMINI_API_KEY`
3. Ensure it's set at the service level (not project level)

### Issue: Bundle hash doesn't change after deploy

**Solution:**
1. Check `railway.json` has `"buildCommand": "npm run build"`
2. Check build logs - if `npm run build` isn't running, Railway is serving stale files
3. Manually trigger a rebuild in Railway dashboard

### Issue: Works locally but not on Railway

**Solution:**
1. Ensure `.env.local` has `VITE_GEMINI_API_KEY` (not `GEMINI_API_KEY`)
2. Test local build: `npm run build && npx serve dist`
3. If local build works, issue is with Railway env var setup

## Important Notes

1. **Security**: The API key is embedded in the client-side JavaScript bundle. For production apps with sensitive operations, consider using a backend proxy server instead.

2. **Environment Variable Naming**: The `VITE_` prefix is REQUIRED for Vite to expose the variable to your app. Without it, the variable won't be accessible.

3. **Build Time vs Runtime**: Vite replaces `import.meta.env.VITE_*` at BUILD TIME, not runtime. This means Railway must set the variable BEFORE building.

4. **No .env files in production**: Railway doesn't use `.env` files. All environment variables must be set in the Railway dashboard.

5. **Rebuilds Required**: If you change the environment variable value in Railway, you MUST trigger a new build for the change to take effect.

## Testing Locally

To test the exact production build locally:

```bash
# Build with production env vars
npm run build

# Serve the built files
npx serve dist -l 3000

# Open http://localhost:3000 and test
```

If this works, Railway deployment will work too (assuming env vars are set correctly).

## Related Files

- `/services/gemini.ts` - Uses `import.meta.env.VITE_GEMINI_API_KEY`
- `/vite.config.ts` - Simplified config (Vite handles VITE_* automatically)
- `/.env.local` - Local development env vars (git-ignored)
- `/railway.json` - Railway deployment configuration
- `/package.json` - Contains `build` and `start` scripts

## Additional Resources

- [Vite Environment Variables Guide](https://vitejs.dev/guide/env-and-mode.html)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Railway Nixpacks Build](https://docs.railway.app/deploy/builds)
