/* ------------------------------------------------------------------ */
/*  법제처(law.go.kr) 국내 IP 프록시                                     */
/*                                                                     */
/*  Railway(해외 IP)에서 법제처 API를 직접 호출하면 IP 미등록으로 거부   */
/*  당하므로, 한국 소재 서버(이 프록시)를 하나 두고 그 IP만 법제처에      */
/*  등록한다. RedlineAI 본서버는 이 프록시를 거쳐 법제처를 호출한다.       */
/*                                                                     */
/*  Node 18+ 필요. 의존성: express.                                     */
/*                                                                     */
/*  law.go.kr 호출은 Node의 fetch(undici) 대신 curl 서브프로세스를 쓴다  */
/*  — undici가 이 서버의 TLS 설정과 궁합이 안 맞아 fetch가 실패하는 것을  */
/*  실측으로 확인함(curl은 정상 동작). curl은 시스템에 기본 설치돼 있다.  */
/* ------------------------------------------------------------------ */

const express = require("express");
const { execFile } = require("child_process");
const app = express();

const PORT = process.env.PORT || 8787;
const OC = process.env.LAW_API_OC;                 // open.law.go.kr 승인받은 OC
const PROXY_KEY = process.env.LAW_PROXY_KEY;        // RedlineAI 본서버만 호출하도록 하는 공유 비밀키

function auth(req, res, next) {
  if (!PROXY_KEY) return res.status(500).json({ error: "LAW_PROXY_KEY not configured on proxy" });
  if (req.header("x-proxy-key") !== PROXY_KEY) return res.status(401).json({ error: "unauthorized" });
  next();
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function curlOnce(url) {
  return new Promise((resolve, reject) => {
    // --retry: curl's own retry on transient errors (incl. DNS) within one invocation.
    execFile(
      "curl", ["-s", "--max-time", "12", "--retry", "2", "--retry-delay", "1", "-A", "Mozilla/5.0", url],
      { maxBuffer: 10 * 1024 * 1024 },
      (err, stdout) => { if (err) return reject(err); resolve(stdout); },
    );
  });
}

/**
 * Fetch a URL via curl (fetch/undici has TLS trouble with law.go.kr; curl works).
 * The VPS's DNS resolvers intermittently fail (~1 in 5 requests, near-instant
 * "could not resolve host") — retry the whole curl call a couple more times
 * with a short delay before giving up.
 */
async function curlGet(url, attempts = 3) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await curlOnce(url);
    } catch (e) {
      lastErr = e;
      if (i < attempts - 1) await sleep(400 * (i + 1));
    }
  }
  throw lastErr;
}

app.get("/health", (_req, res) => res.json({ ok: true, ocConfigured: Boolean(OC) }));

app.get("/prec/search", auth, async (req, res) => {
  if (!OC) return res.status(500).json({ error: "LAW_API_OC not configured on proxy" });
  const query = String(req.query.query ?? "");
  const page = String(req.query.page ?? "1");
  const url = `https://www.law.go.kr/DRF/lawSearch.do?OC=${encodeURIComponent(OC)}&target=prec&type=JSON&search=2&display=10&page=${encodeURIComponent(page)}&query=${encodeURIComponent(query)}`;
  try {
    const text = await curlGet(url);
    res.type("application/json").send(text);
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
    const text = await curlGet(url);
    res.type("application/json").send(text);
  } catch (e) {
    res.status(502).json({ error: "upstream_failed", detail: String(e) });
  }
});

// Official HTML view of one precedent (used when a user clicks "공식 출처에서 보기").
// Must go through this proxy too — law.go.kr gates by registered IP even for
// the HTML view, so redirecting the end user's own browser directly fails.
app.get("/prec/view", auth, async (req, res) => {
  if (!OC) return res.status(500).send("LAW_API_OC not configured on proxy");
  const id = String(req.query.id ?? "").replace(/[^0-9]/g, "");
  if (!id) return res.status(400).send("missing id");
  const url = `https://www.law.go.kr/DRF/lawService.do?OC=${encodeURIComponent(OC)}&target=prec&ID=${id}&type=HTML`;
  try {
    const html = await curlGet(url);
    res.type("text/html; charset=utf-8").send(html);
  } catch (e) {
    res.status(502).send(`upstream_failed: ${String(e)}`);
  }
});

app.listen(PORT, () => console.log(`law-proxy listening on port ${PORT}`));
