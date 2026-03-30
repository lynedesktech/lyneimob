/**
 * Extrai cores dominantes de uma imagem (client-side).
 * Usa a Canvas API para analisar os pixels da imagem.
 */

function rgbParaHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")
}

function escurecerCor(hex: string, fator: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)

  return rgbParaHex(
    Math.round(r * (1 - fator)),
    Math.round(g * (1 - fator)),
    Math.round(b * (1 - fator))
  )
}

function calcularVibrancia(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  return max - min
}

export async function extrairCoresDaImagem(
  imageUrl: string
): Promise<{ primaria: string; destaque: string; heroFundo: string } | null> {
  try {
    const mod = await import("colorthief")
    const ColorThief = "default" in mod ? (mod as Record<string, unknown>).default : mod
    const ct = new (ColorThief as new () => { getColor: (img: HTMLImageElement) => [number, number, number]; getPalette: (img: HTMLImageElement, count: number) => [number, number, number][] })()

    const img = document.createElement("img")
    img.crossOrigin = "anonymous"
    img.src = imageUrl

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve()
      img.onerror = () => reject(new Error("Erro ao carregar imagem"))
      if (img.complete) resolve()
    })

    const corDominante = ct.getColor(img)
    const paleta = ct.getPalette(img, 5)

    if (!corDominante || !paleta) return null

    const primaria = rgbParaHex(corDominante[0], corDominante[1], corDominante[2])

    // Escolher a cor mais vibrante da paleta (diferente da dominante) como destaque
    const coresComVibrancia = paleta
      .map(([r, g, b]: [number, number, number]) => ({
        hex: rgbParaHex(r, g, b),
        vibrancia: calcularVibrancia(r, g, b),
      }))
      .filter((c: { hex: string }) => c.hex !== primaria)
      .sort((a: { vibrancia: number }, b: { vibrancia: number }) => b.vibrancia - a.vibrancia)

    const destaque = coresComVibrancia[0]?.hex ?? primaria
    const heroFundo = escurecerCor(primaria, 0.4)

    return { primaria, destaque, heroFundo }
  } catch {
    return null
  }
}
