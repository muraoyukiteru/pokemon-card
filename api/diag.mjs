import chromium from "@sparticuz/chromium";
export default async function handler(req, res) {
  try {
    const path = await chromium.executablePath();
    res.status(200).json({
      node: process.versions.node,
      headless: chromium.headless,
      executablePath: path
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}
