# Pokemon Deck Scraper Starter

This bundle contains:
- api/deck.mjs      (Vercel Serverless Function with Puppeteer + @sparticuz/chromium)
- package.json
- vercel.json
- index.html        (Front-end A4 3x3 printer)

## Quick Start (GitHub → Vercel)
1) Unzip this folder.
2) Initialize a Git repo and push:
   git init
   git add .
   git commit -m "init"
   # create a new empty repo on GitHub, then:
   git remote add origin https://github.com/<yourname>/pokemon-deck-scraper.git
   git branch -M main
   git push -u origin main

3) On Vercel dashboard: "Add New" → "Project" → Import your GitHub repo → Deploy.
4) After deploy, open:
   https://<your-project>.vercel.app/api/deck?code=ggnNQ9-cFqwyn-NLLn6Q
   If JSON shows images array, it's working.

5) Edit index.html:
   const API_BASE = 'https://<your-project>.vercel.app';
   Then open index.html in the browser, enter your deck code, and print.

## Local test of API with Vercel CLI (optional)
   npm i -g vercel
   npm install
   vercel dev
   # open http://localhost:3000/api/deck?code=...

## Notes
- First cold start can take longer due to headless Chromium boot.
- If pages change structure, adjust selectors in api/deck.mjs.
- For many cards, increase maxDuration or lower maxFollow to keep within limits.
