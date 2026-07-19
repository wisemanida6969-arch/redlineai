import { ImageResponse } from "next/og";

/* Site-wide OG image, generated at build time — no binary asset needed. */

export const runtime = "edge";
export const alt = "레드라인AI — 창작자를 위한 표준계약서 AI";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f1a2e 0%, #162035 100%)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 40 }}>
          <div
            style={{
              background: "#e53e3e",
              color: "#ffffff",
              fontSize: 40,
              fontWeight: 800,
              padding: "10px 26px",
              borderRadius: 14,
              display: "flex",
            }}
          >
            레드라인AI
          </div>
        </div>
        <div style={{ color: "#ffffff", fontSize: 64, fontWeight: 800, lineHeight: 1.25, display: "flex", flexDirection: "column" }}>
          <span>프리랜서를 위한 계약서,</span>
          <span style={{ color: "#ff5a5a" }}>정부 표준과 비교합니다</span>
        </div>
        <div style={{ color: "#94a3b8", fontSize: 30, marginTop: 36, display: "flex" }}>
          문화체육관광부 표준계약서 원문 기반 · 미술 · 웹툰 · 공연 · 영화 · 공예
        </div>
      </div>
    ),
    { ...size }
  );
}
