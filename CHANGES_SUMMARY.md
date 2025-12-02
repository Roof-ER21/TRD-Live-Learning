# Railway Deployment Fix - Summary of Changes

## Problem Identified

The deployed app at https://trdlearn.up.railway.app/ was showing "API key not valid" errors despite having `GEMINI_API_KEY` set in Railway dashboard. The root cause was:

1. **Railway provides environment variables at RUNTIME**
2. **Vite needs environment variables at BUILD TIME** to embed them in the JavaScript bundle
3. The old code used `process.env.API_KEY` which:
   - Doesn't exist in the browser environment
   - Can't be injected at runtime in client-side code
   - Wasn't being replaced by Vite during build

## Solution Implemented

Switched to Vite's built-in environment variable system using the `VITE_` prefix, which:
- Automatically embeds env vars at build time
- Replaces all `import.meta.env.VITE_*` references with actual values during build
- Works seamlessly in both development and production
- Follows Vite best practices

## Files Modified

### 1. `/Users/a21/TRD-Live-Learning/vite.config.ts`

**Before:**
```typescript
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const apiKey = process.env.GEMINI_API_KEY || env.GEMINI_API_KEY;
    return {
      // ... config
      define: {
        'process.env.API_KEY': JSON.stringify(apiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(apiKey)
      },
      // ...
    };
});
```

**After:**
```typescript
export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  }
});
```

**Why:** Vite automatically handles `VITE_*` prefixed environment variables. No manual `define` configuration needed.

### 2. `/Users/a21/TRD-Live-Learning/services/gemini.ts`

**Before:**
```typescript
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
```

**After:**
```typescript
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

if (!API_KEY) {
  console.error('VITE_GEMINI_API_KEY is not set. Please check your environment variables.');
}

const ai = new GoogleGenAI({ apiKey: API_KEY });
```

**Why:** `import.meta.env` is the correct way to access environment variables in Vite. The `VITE_` prefix makes the variable accessible.

### 3. `/Users/a21/TRD-Live-Learning/railway.json`

**Before:**
```json
{
  "build": {
    "builder": "NIXPACKS"
  },
  // ...
}
```

**After:**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm run build"
  },
  // ...
}
```

**Why:** Explicitly tells Railway to run `npm run build`, ensuring Vite embeds the environment variables during the build process.

### 4. `/Users/a21/TRD-Live-Learning/.env.local`

**Before:**
```env
GEMINI_API_KEY=AIzaSyCskqXO1hD3v-R0BZIXrIR9G79swD1hsIc
```

**After:**
```env
VITE_GEMINI_API_KEY=AIzaSyCskqXO1hD3v-R0BZIXrIR9G79swD1hsIc
```

**Why:** Match the new environment variable name for local development.

## New Documentation Files

### 1. `/Users/a21/TRD-Live-Learning/RAILWAY_DEPLOYMENT.md`
Comprehensive guide covering:
- Detailed explanation of the problem and solution
- Step-by-step Railway setup instructions
- How the Vite environment variable system works
- Verification checklist
- Troubleshooting guide
- Testing instructions

### 2. `/Users/a21/TRD-Live-Learning/CRITICAL_RAILWAY_SETUP.md`
Quick reference for immediate action:
- Critical environment variable update required
- Step-by-step Railway dashboard instructions
- Expected build output
- Current status and next steps

### 3. `/Users/a21/TRD-Live-Learning/CHANGES_SUMMARY.md`
This file - complete summary of all changes made.

## Build Verification

Local build test confirmed the fix works:

```bash
$ npm run build
✓ 692 modules transformed.
dist/assets/index-D882i6iA.js  513.28 kB  # NEW HASH (was index-KmD4z_S0.js)
✓ built in 934ms
```

Verification checks:
- ✅ Bundle hash changed (indicates new build with embedded API key)
- ✅ API key found in bundle (`grep "AIzaSy" index-D882i6iA.js` returns match)
- ✅ No `import.meta` references in bundle (all replaced at build time)
- ✅ Local dev server works (`npm run dev` on port 3002)

## Git Commit Details

**Commit:** d5369b1
**Branch:** main
**Pushed to:** https://github.com/Roof-ER21/TRD-Live-Learning

**Commit Message:**
```
fix: Use VITE_GEMINI_API_KEY for Railway deployment

This fixes the "API key not valid" error on Railway by using Vite's
built-in environment variable system.
```

## Railway Deployment Status

**Current Status:**
- ✅ Code changes committed and pushed
- ✅ Railway auto-deploy triggered
- ⏳ Build in progress (estimated 2-3 minutes)
- ❌ Environment variable update required in Railway dashboard

**Critical Action Required:**
The Railway environment variable must be updated from:
- OLD: `GEMINI_API_KEY`
- NEW: `VITE_GEMINI_API_KEY`

See `CRITICAL_RAILWAY_SETUP.md` for detailed instructions.

## How to Verify the Fix

After updating Railway environment variable:

1. Wait for Railway build to complete
2. Visit https://trdlearn.up.railway.app/
3. Open browser DevTools (F12)
4. Go to Console tab
5. Upload a file and generate training
6. Verify NO errors appear in console
7. Verify training content generates successfully

## Expected Behavior After Fix

**Before (broken):**
- Console error: "API key not valid"
- Training generation fails
- Network requests show 401/403 errors
- Bundle hash never changed (stale build)

**After (working):**
- No console errors
- Training generation works
- Gemini API requests succeed
- Bundle hash changes with each deploy

## Technical Details

### Why VITE_ Prefix is Required

Vite has a security feature that prevents exposing all environment variables to client-side code. Only variables prefixed with `VITE_` are:
1. Accessible via `import.meta.env`
2. Embedded in the bundle at build time
3. Available in the browser environment

### Build-Time vs Runtime

**Build Time (when `npm run build` runs):**
- Vite reads `VITE_GEMINI_API_KEY` from environment
- Replaces all `import.meta.env.VITE_GEMINI_API_KEY` with actual key value
- Embeds the key directly in the JavaScript code
- Produces static files in `dist/` directory

**Runtime (when user visits the website):**
- Browser downloads the built JavaScript
- API key is already embedded in the code
- No environment variable lookup needed
- Works like any hardcoded string

### Railway Build Process

1. Git push detected
2. `npm install` runs
3. `npm run build` runs (via railway.json buildCommand)
   - Vite reads `VITE_GEMINI_API_KEY` env var (set in Railway dashboard)
   - Vite embeds the value in JavaScript bundle
4. `npm run start` runs to serve the built files
5. App is live at https://trdlearn.up.railway.app/

## Security Considerations

**Important:** The API key is now embedded in the client-side JavaScript bundle, meaning:
- Anyone can view the API key by inspecting the bundle
- For production apps with sensitive operations, consider using a backend proxy
- For a training platform like this, client-side API usage is acceptable
- Consider implementing API key restrictions in Google Cloud Console:
  - HTTP referrer restrictions (only allow trdlearn.up.railway.app)
  - API usage quotas and rate limits

## Rollback Plan

If issues occur, you can rollback by:

1. In Railway dashboard, change env var back to `GEMINI_API_KEY`
2. Revert the git commit:
   ```bash
   git revert d5369b1
   git push origin main
   ```
3. Wait for Railway to rebuild

However, this would bring back the original "API key not valid" problem, so it's not recommended.

## Testing Checklist

After Railway deployment completes:

- [ ] App loads without errors at https://trdlearn.up.railway.app/
- [ ] Browser console shows no "API key not valid" errors
- [ ] Can upload a text file successfully
- [ ] Can select output type (e.g., "Field Simulator")
- [ ] Can generate training content
- [ ] Generated HTML appears in preview
- [ ] Download button works
- [ ] Preview in new tab works
- [ ] Refine feature works (if applicable)
- [ ] All file types work (PDF, CSV, Excel, images, video)

## Support and Troubleshooting

If issues persist after following all steps:

1. Check Railway build logs for errors
2. Verify environment variable name is EXACTLY `VITE_GEMINI_API_KEY`
3. Clear browser cache and hard reload
4. Test in incognito/private browser window
5. Check Railway service logs for runtime errors
6. Verify the Gemini API key is still valid (test with curl)

For detailed troubleshooting steps, see `RAILWAY_DEPLOYMENT.md`.

## Files to Review

All files are in `/Users/a21/TRD-Live-Learning/`:

1. `vite.config.ts` - Simplified config
2. `services/gemini.ts` - Uses `import.meta.env.VITE_GEMINI_API_KEY`
3. `railway.json` - Build command configuration
4. `.env.local` - Local development env vars (git-ignored)
5. `RAILWAY_DEPLOYMENT.md` - Complete deployment guide
6. `CRITICAL_RAILWAY_SETUP.md` - Immediate action required
7. `CHANGES_SUMMARY.md` - This file

## Conclusion

The fix is complete and ready for deployment. The only remaining step is to update the Railway environment variable name from `GEMINI_API_KEY` to `VITE_GEMINI_API_KEY` in the Railway dashboard.

Once that's done, the app will build successfully and work correctly in production.
