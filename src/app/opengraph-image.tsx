// opengraph-image.tsx — Next.js auto-generates /opengraph-image.png (1200x630)
// Used for social media sharing (Facebook, LinkedIn, Twitter, WhatsApp, Telegram)
import { ImageResponse } from "next/og";

export const alt = "TechPath Academy — Lab-Based IT Training";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              fontWeight: 700,
              color: "white",
            }}
          >
            T
          </div>
          <div style={{ fontSize: "28px", fontWeight: 600, color: "#a5b4fc" }}>
            TechPath Academy
          </div>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: "64px",
            fontWeight: 800,
            color: "white",
            lineHeight: 1.1,
            maxWidth: "900px",
          }}
        >
          Master real-world IT skills
        </div>

        {/* Subheadline */}
        <div
          style={{
            fontSize: "28px",
            color: "#c7d2fe",
            marginTop: "20px",
            maxWidth: "800px",
          }}
        >
          Lab-based training in IT Support, Networking, Cyber Security, Database
          Administration & AI
        </div>

        {/* Tags */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "40px",
          }}
        >
          {["Hands-On Labs", "CTF Challenges", "Verifiable Certificates"].map(
            (tag) => (
              <div
                key={tag}
                style={{
                  padding: "8px 20px",
                  borderRadius: "999px",
                  background: "rgba(99, 102, 241, 0.2)",
                  border: "1px solid rgba(99, 102, 241, 0.4)",
                  color: "#a5b4fc",
                  fontSize: "20px",
                  fontWeight: 500,
                }}
              >
                {tag}
              </div>
            )
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
