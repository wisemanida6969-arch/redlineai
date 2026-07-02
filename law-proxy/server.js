/* ------------------------------------------------------------------ */
/*  법제처(law.go.kr) 국내 IP 프록시                                     */
/*                                                                     */
/*  Railway(해외 IP)에서 법제처 API를 직접 호출하면 IP 미등록으로 거부   */
/*  당하므로, 한국 소재 서버(이 프록시)를 하나 두고 그 IP만 법제처에      */
/*  등록한다. RedlineAI 본서버는 이 프록시를 거쳐 법제처를 호출한다.       */
/*                                                                     */
/*  Node 18+ 필요 (전역 fetch 사용). 의존성: express 하나뿐.             */
/* ------------------------------------------------------------------ */

const express = require("express");
const app = express();

const PORT = process.env.PORT || 8787;
const OC = process.env.LAW_API_OC;                 // open.law.go.kr 승인받은 OC
const PROXY_KEY = process.env.LAW_PROXY_KEY;        // RedlineAI 본서버만 호출하도록 하는 공유 비밀키

function auth(req, res, next) {
  if (!PROXY_KEY) return res.status(500).json({ error: "LAW_PROXY_KEY not configured on proxy" });
  if (req.header("x-proxy-key") !== PROXY_KEY) return res.status(401).json({ error: "unauthorized" });
  next();
}

app.get("/health", (_req, res) => res.json({ ok: true, ocConfigured: Boolean(OC) }));

app.get("/prec/search", auth, async (req, res) => {
  if (!OC) return res.status(500).json({ error: "LAW_API_OC not configured on proxy" });
  const query = String(req.query.query ?? "");
  const page = String(req.query.page ?? "1");
  const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=${encodeURIComponent(OC)}&target=prec&type=JSON&search=2&display=10&page=${encodeURIComponent(page)}&query=${encodeURIComponent(query)}`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(12000) });
    const text = await r.text();
    res.status(r.status).type("application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "upstream_failed", detail: String(e) });
  }
});

app.get("/prec/detail", auth, async (req, res) => {
  if (!OC) return res.status(500).json({ error: "LAW_API_OC not configured on proxy" });
  const id = String(req.query.id ?? "").replace(/[^0-9]/g, "");
  if (!id) return res.status(400).json({ error: "missing id" });
  const url = `https://www.law.go.kr/DRF/lawService.do?OC=${encodeURIComponent(OC)}&target=prec&ID=${id}&type=JSON`;
  try {
    const r = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, signal: AbortSignal.timeout(12000) });
    const text = await r.text();
    res.status(r.status).type("application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "upstream_failed", detail: String(e) });
  }
});

app.listen(PORT, () => console.log(`law-proxy listening on port ${PORT}`));
