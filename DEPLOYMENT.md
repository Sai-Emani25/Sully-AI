# Deployment Instructions for GitHub Pages

## Prerequisites
1. **Set up your Gemini API Key:**
   - Get your API key from: https://aistudio.google.com/app/apikey
   - Create a `.env` file in the project root
   - Add: `VITE_GEMINI_API_KEY=your_actual_api_key`

2. **Install dependencies:**
   ```bash
   npm install
   ```

## GitHub Pages Deployment

### Option 1: Using GitHub Secrets (Recommended)

1. **Add API Key to GitHub Secrets:**
   - Go to your repository on GitHub
   - Navigate to Settings > Secrets and variables > Actions
   - Click "New repository secret"
   - Name: `VITE_GEMINI_API_KEY`
   - Value: Your actual Gemini API key
   - Click "Add secret"

2. **Create GitHub Actions Workflow:**
   Create `.github/workflows/deploy.yml`:
   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [ main ]
     workflow_dispatch:

   permissions:
     contents: read
     pages: write
     id-token: write

   jobs:
     build-and-deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         
         - name: Setup Node.js
           uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         
         - name: Install dependencies
           run: npm ci
         
         - name: Build
           env:
             VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}
           run: npm run build
         
         - name: Setup Pages
           uses: actions/configure-pages@v4
         
         - name: Upload artifact
           uses: actions/upload-pages-artifact@v3
           with:
             path: './dist'
         
         - name: Deploy to GitHub Pages
           id: deployment
           uses: actions/deploy-pages@v4
   ```

3. **Enable GitHub Pages:**
   - Go to Settings > Pages
   - Source: GitHub Actions
   - Save

4. **Deploy:**
   ```bash
   git add .
   git commit -m "Add deployment workflow"
   git push origin main
   ```

### Option 2: Manual gh-pages Deployment

1. **Build with your API key:**
   ```bash
   # Make sure .env file exists with VITE_GEMINI_API_KEY
   npm run build
   ```

2. **Deploy:**
   ```bash
   npm run deploy
   ```

3. **Enable GitHub Pages:**
   - Go to Settings > Pages
   - Source: Deploy from a branch
   - Branch: gh-pages / (root)
   - Save

## Important Notes

⚠️ **Security Warning:** 
- The API key will be embedded in the built JavaScript files
- Anyone can extract it from your deployed site
- For production, set up a backend proxy server to keep the API key secure
- Consider using Google Cloud's API key restrictions (HTTP referrers)

🔧 **API Key Restrictions (Recommended):**
1. Go to https://console.cloud.google.com/apis/credentials
2. Find your API key
3. Add Application restrictions > HTTP referrers
4. Add your GitHub Pages URL: `https://yourusername.github.io/Sully-AI/*`

## Troubleshooting

### "An API Key must be set when running in a browser" Error
- Verify `.env` file exists with `VITE_GEMINI_API_KEY=your_key`
- Rebuild: `npm run build`
- For GitHub Actions: Check that the secret is properly set

### 404 Errors on Deployment
- Ensure `base: '/Sully-AI/'` matches your repository name in `vite.config.ts`
- Clear browser cache
- Wait a few minutes for GitHub Pages to update

### Tailwind CDN Warning
- This is expected in development
- For production, consider installing Tailwind as a PostCSS plugin
- Current setup works but is not optimal for performance

## After Deployment

Your site will be available at:
`https://yourusername.github.io/Sully-AI/`

Replace `yourusername` with your GitHub username.
