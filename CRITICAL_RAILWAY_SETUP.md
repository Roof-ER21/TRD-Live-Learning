# CRITICAL: Railway Environment Variable Setup Required

## Immediate Action Required

You MUST update the environment variable in Railway dashboard for the deployment to work.

## Step-by-Step Instructions

1. **Go to Railway Dashboard**
   - Visit: https://railway.app
   - Navigate to your TRD-Live-Learning project

2. **Delete Old Variable**
   - Go to Variables tab
   - Find `GEMINI_API_KEY`
   - Delete it (click the trash icon)

3. **Add New Variable**
   - Click "New Variable"
   - Name: `VITE_GEMINI_API_KEY`
   - Value: `AIzaSyCskqXO1hD3v-R0BZIXrIR9G79swD1hsIc`
   - Click "Add"

4. **Wait for Auto-Deploy**
   - Railway will automatically detect the git push
   - A new build will start (check Deployments tab)
   - Wait 2-3 minutes for build to complete

5. **Verify It Works**
   - Visit: https://trdlearn.up.railway.app/
   - Upload a test file
   - Generate training content
   - Check browser console (F12) - no errors should appear

## Why This Is Critical

The old variable name (`GEMINI_API_KEY`) doesn't work because:
- Vite requires the `VITE_` prefix to expose env vars to the app
- Without `VITE_` prefix, the variable is NOT accessible in the code
- The app will show "API key not valid" errors

The new variable name (`VITE_GEMINI_API_KEY`) works because:
- Vite automatically reads `VITE_*` prefixed variables
- During build, Vite embeds the value directly in the JavaScript bundle
- The browser receives the API key embedded in the code (no runtime env var needed)

## Expected Build Log Output

You should see something like this in the Railway build logs:

```
Building...
> npm run build
vite v6.4.1 building for production...
transforming...
✓ 692 modules transformed.
rendering chunks...
dist/assets/index-[HASH].js  513.28 kB
✓ built in 934ms
```

The `[HASH]` part will be different each time - this confirms a new build happened.

## Troubleshooting

**If deployment still fails:**

1. Check the Railway build logs for errors
2. Verify the variable is named EXACTLY `VITE_GEMINI_API_KEY`
3. Ensure the variable is set at the SERVICE level (not project level)
4. Try manually triggering a redeploy in Railway dashboard

**If you see "API key not valid":**

1. Clear browser cache and hard reload (Ctrl+Shift+R or Cmd+Shift+R)
2. Check the Network tab in DevTools - look for the API request
3. Check the Console tab for any error messages
4. Verify the environment variable value in Railway dashboard

## Current Status

- ✅ Code updated to use `VITE_GEMINI_API_KEY`
- ✅ Local build tested and working
- ✅ Changes pushed to GitHub main branch
- ⏳ Railway build triggered (in progress)
- ❌ Railway environment variable NOT YET UPDATED (ACTION REQUIRED)

## Next Steps

1. Update Railway environment variable (see instructions above)
2. Wait for build to complete
3. Test the deployed app
4. Confirm no errors in browser console

## Full Documentation

See `/Users/a21/TRD-Live-Learning/RAILWAY_DEPLOYMENT.md` for complete details.
