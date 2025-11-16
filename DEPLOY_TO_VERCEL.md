# 🚀 Deploy to Vercel

## Quick Deploy

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to [Vercel](https://vercel.com)**
2. **Click "Import Project"**
3. **Connect to GitHub** and select `ai-marketing-agent` repository
4. **Configure Project**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` ← **IMPORTANT: Set this!**
   - **Build Command**: `npm run build` (default is fine)
   - **Output Directory**: `.next` (default is fine)
   - **Install Command**: `npm install` (default is fine)

5. **Click "Deploy"**

That's it! Vercel will build and deploy your frontend.

### Option 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from frontend directory
cd frontend
vercel

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: [your account]
# - Link to existing project: N
# - Project name: ai-marketing-agent
# - Directory: ./
# - Override settings: N

# Deploy to production
vercel --prod
```

## Important Notes

### ⚠️ Root Directory Setting

When deploying from the repository root, **you MUST set the Root Directory to `frontend`** in Vercel settings!

**In Vercel Dashboard**:
1. Go to Project Settings
2. General → Root Directory
3. Set to: `frontend`
4. Save

### Environment Variables

The frontend doesn't need environment variables for the UI to work. However, when you connect the backend later, you'll need:

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

Add this in:
Vercel Dashboard → Project → Settings → Environment Variables

## Troubleshooting

### "Build failed" Error

**Cause**: Vercel is trying to build from the root directory instead of `frontend`

**Solution**:
1. Go to Project Settings in Vercel
2. Set Root Directory to `frontend`
3. Redeploy

### "Module not found" Errors

**Cause**: Dependencies not installed properly

**Solution**:
1. Make sure `package.json` and `package-lock.json` are in the `frontend` directory
2. Redeploy (Vercel will reinstall)

### TypeScript Errors

**Cause**: Type errors in the code

**Solution**: The code should compile now after the fixes. If issues persist:
```bash
cd frontend
npm run build  # Test build locally first
```

## After Deployment

Your frontend will be live at:
```
https://your-project-name.vercel.app
```

### To Connect Backend Later

1. Deploy backend to Railway/Render/Heroku
2. Get backend URL (e.g., `https://api.your-backend.com`)
3. Add to Vercel environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://api.your-backend.com
   ```
4. Redeploy frontend

## Vercel Deploy Button (Optional)

You can add this to your GitHub README for one-click deploy:

```markdown
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/RotemShveber/ai-marketing-agent&project-name=ai-marketing-agent&root-directory=frontend)
```

## Custom Domain (Optional)

1. Go to Vercel Dashboard → Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Done!

---

**Need help?** Check the [Vercel Documentation](https://vercel.com/docs)
