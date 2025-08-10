import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export default async function handler(req, res) {
  let browser;
  try {
    browser = await puppeteer.launch({
      args: [...chromium.args, "--disable-dev-shm-usage", "--no-zygote", "--single-process"],
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
      // ★ これが大事：Sparticuzが提供するLD_LIBRARY_PATHなどを渡す
      env: { ...process.env, ...(chromium.env || {}) }
    });
    const page = await browser.newPage();
    await page.goto("about:blank");
    const ua = await page.evaluate(() => navigator.userAgent);
    res.status(200).json({ ok: true, ua });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  } finally {
    if (browser) try { await browser.close(); } catch {}
  }
}
