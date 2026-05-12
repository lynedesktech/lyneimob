import { ImageResponse } from "next/og"

// Apple touch icon — versao maior do icon.tsx
export const size = { width: 180, height: 180 }
export const contentType = "image/png"

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 110,
          background: "#000",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          letterSpacing: -3,
        }}
      >
        D
      </div>
    ),
    { ...size }
  )
}
