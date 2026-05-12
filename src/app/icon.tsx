import { ImageResponse } from "next/og"

// Favicon programatico — quadrado preto com "D" branco.
// Placeholder ate termos a logo quadrada oficial da Duna Real Estate.
export const size = { width: 32, height: 32 }
export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 22,
          background: "#000",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        D
      </div>
    ),
    { ...size }
  )
}
