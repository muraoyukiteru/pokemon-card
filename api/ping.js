module.exports = (req, res) => {
  console.log("PING CJS", new Date().toISOString());
  res.status(200).json({ ok: true, time: Date.now() });
};
