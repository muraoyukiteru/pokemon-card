import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

// Serverless-friendly settings
chromium.setHeadlessMode = true;
chromium.setGraphicsMode = false;

/**
 * /api/deck?code=ggnNQ9-cFqwyn-NLLn6Q
 * Returns: { images: [ 'https://www.pokemon-card.com/assets/images/card_images/large/...jpg', ... ] }
 */
export default async function handler(req, res) {
  const { code } = req.query || {};
  if (!code || typeof code !== "string") {
    return sendJson(res, { error: "missing deck code" }, 400);
  }

  const targets = [
    `https://www.pokemon-card.com/deck/${encodeURIComponent(code)}`,
    `https://www.pokemon-card.com/deck/deck.html?deckID=${encodeURIComponent(code)}`,
    `https://www.pokemon-card.com/deck/confirm.html/deckID/${encodeURIComponent(code)}`
  ];

  const UA =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

  let browser;
  const images = [];

  try {
    const executablePath = await chromium.executablePath();
    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        "--disable-dev-shm-usage",
        "--no-zygote",
        "--single-process"
      ],
      defaultViewport: { width: 1280, height: 800, deviceScaleFactor: 1 },
      executablePath,
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      env: { ...process.env, ...(chromium.env || {}) } // ★これでLD_LIBRARY_PATH等が渡る
    });

    const page = await browser.newPage();
    await page.setUserAgent(UA);

    // Try URL variants
    let loaded = false;
    for (const url of targets) {
      try {
        const resp = await page.goto(url, { waitUntil: "networkidle2", timeout: 25000 });
        if (resp && resp.ok()) { loaded = true; break; }
      } catch (_) {}
    }
    if (!loaded) {
      return sendJson(res, { images: [] }, 200);
    }

    // 1) Collect large images already present
    await page.waitForTimeout(1000);
    await collectLargeFromPage(page, images);

    // 2) Click possible "画像表示"
    try {
      await page.evaluate(() => {
        const cand = [...document.querySelectorAll("a,button,input,label")]
          .find(el => /画像表示/.test(el.textContent || el.value || ""));
        if (cand) cand.click();
      });
      await page.waitForNetworkIdle({ idleTime: 1000, timeout: 7000 });
      await collectLargeFromPage(page, images);
    } catch (_) {}

    // 3) Follow card detail links and collect large images
    const detailLinks = await getDetailLinks(page);
    const maxFollow = Math.min(detailLinks.length, 80);
    for (let i = 0; i < maxFollow; i++) {
      const link = detailLinks[i];
      try {
        await page.goto(link, { waitUntil: "domcontentloaded", timeout: 20000 });
        await page.waitForTimeout(350);
        await collectLargeFromPage(page, images);
      } catch (_) {}
    }

    const uniq = Array.from(new Set(images));
    return sendJson(res, { images: uniq.slice(0, 500) }, 200);

  } catch (err) {
    return sendJson(res, { error: String(err) }, 500);
  } finally {
    if (browser) {
      try { await browser.close(); } catch (_) {}
    }
  }
}

async function collectLargeFromPage(page, out) {
  const html = await page.content();
  const re = /https?:\/\/www\.pokemon-card\.com\/assets\/images\/card_images\/large\/[^"'<> \n]+\.jpg/gi;
  const found = html.match(re) || [];
  for (const u of found) {
    if (!out.includes(u)) out.push(u);
  }
}

async function getDetailLinks(page) {
  const links = await page.$$eval('a[href]', as =>
    as.map(a => a.href).filter(h =>
      /https?:\/\/www\.pokemon-card\.com\/card-search\/(detail|details\.php)/.test(h)
    )
  );
  const normed = links.map(h => h.split("#")[0]);
  return Array.from(new Set(normed));
}

function sendJson(res, obj, status = 200) {
  res.status(status);
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("cache-control", "no-store");
  res.send(JSON.stringify(obj));
}
