export default function handler(req, res) {
  console.log("PING", new Date().toISOString());
  res.status(200).json({ ok: true, time: Date.now() });
}
