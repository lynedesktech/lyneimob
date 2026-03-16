import { z } from "zod"

// ============================================================
// Schema e tipos das configurações do site público
// ============================================================

const regexHex = /^#[0-9a-fA-F]{6}$/

export const schemaCoresSite = z.object({
  primaria: z.string().regex(regexHex, "Cor inválida (use formato #RRGGBB)").default("#1e3a5f"),
  destaque: z.string().regex(regexHex, "Cor inválida (use formato #RRGGBB)").default("#3b82f6"),
  hero_fundo: z.string().regex(regexHex, "Cor inválida (use formato #RRGGBB)").default("#1e3a5f"),
})

export const schemaHeroSite = z.object({
  titulo: z.string().default("Encontre o imóvel ideal"),
  subtitulo: z
    .string()
    .default(
      "Explore nossos imóveis disponíveis e encontre a casa, apartamento ou terreno perfeito para você."
    ),
  imagem_fundo_url: z.string().nullable().default(null),
})

export const schemaSobreSite = z.object({
  titulo: z.string().default("Sobre Nós"),
  historia: z.string().default(""),
  missao: z.string().default(""),
  visao: z.string().default(""),
  valores: z.string().default(""),
})

const coresPadrao = {
  primaria: "#1e3a5f",
  destaque: "#3b82f6",
  hero_fundo: "#1e3a5f",
}

const heroPadrao = {
  titulo: "Encontre o imóvel ideal",
  subtitulo:
    "Explore nossos imóveis disponíveis e encontre a casa, apartamento ou terreno perfeito para você.",
  imagem_fundo_url: null,
}

const sobrePadrao = {
  titulo: "Sobre Nós",
  historia: "",
  missao: "",
  visao: "",
  valores: "",
}

export const schemaConfiguracoesSite = z.object({
  cores: schemaCoresSite.default(coresPadrao),
  hero: schemaHeroSite.default(heroPadrao),
  sobre: schemaSobreSite.default(sobrePadrao),
})

export type ConfiguracoesSite = z.infer<typeof schemaConfiguracoesSite>
export type CoresSite = z.infer<typeof schemaCoresSite>
export type HeroSite = z.infer<typeof schemaHeroSite>
export type SobreSite = z.infer<typeof schemaSobreSite>

// ============================================================
// Valores padrão e merge com dados do banco
// ============================================================

export function configPadrao(): ConfiguracoesSite {
  return schemaConfiguracoesSite.parse({})
}

/**
 * Faz merge dos dados salvos no banco (JSONB parcial) com os defaults.
 * Se o banco tem só { cores: { primaria: "#ff0000" } }, o resto vem do default.
 */
export function extrairConfiguracoes(
  jsonb: Record<string, unknown> | null | undefined
): ConfiguracoesSite {
  if (!jsonb || Object.keys(jsonb).length === 0) {
    return configPadrao()
  }
  return schemaConfiguracoesSite.parse(jsonb)
}
