"use client"

import { useState, useRef } from "react"
import Image from "next/image"
import { Upload, X, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { removerImagemSite } from "@/actions/configuracoes-site"
import { criarClienteBrowser } from "@/lib/supabase/client"
import { toast } from "sonner"

type Props = {
  tipo: "hero-bg" | "logo"
  urlAtual: string | null
  onUrlChange: (url: string | null) => void
  aspecto?: "video" | "square"
}

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "image/webp"]
const TAMANHO_MAXIMO = 5 * 1024 * 1024 // 5MB

function uploadComProgresso(
  url: string,
  arquivo: File,
  token: string,
  onProgresso: (percentual: number) => void
): Promise<{ ok: boolean; erro?: string }> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest()

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        const percentual = Math.round((e.loaded / e.total) * 100)
        onProgresso(percentual)
      }
    })

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ ok: true })
      } else {
        resolve({ ok: false, erro: "Erro ao fazer upload da imagem." })
      }
    })

    xhr.addEventListener("error", () => {
      resolve({ ok: false, erro: "Erro de conexão ao enviar imagem." })
    })

    xhr.open("POST", url)
    xhr.setRequestHeader("Authorization", `Bearer ${token}`)
    xhr.setRequestHeader("x-upsert", "true")

    const form = new FormData()
    form.append("", arquivo)
    xhr.send(form)
  })
}

export function UploadImagemSite({ tipo, urlAtual, onUrlChange, aspecto = "video" }: Props) {
  const [enviando, setEnviando] = useState(false)
  const [progresso, setProgresso] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const label = tipo === "hero-bg" ? "Imagem de fundo do Hero" : "Logo da imobiliária"

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return

    // Validações client-side
    if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
      toast.error("Formato não suportado. Use JPG, PNG ou WebP.")
      return
    }

    if (arquivo.size > TAMANHO_MAXIMO) {
      toast.error("Imagem muito grande. O limite é 5MB.")
      return
    }

    setEnviando(true)
    setProgresso(0)

    try {
      const supabase = criarClienteBrowser()

      // Obter sessão para pegar o token e o org_id
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        toast.error("Sessão expirada. Faça login novamente.")
        return
      }

      // Buscar org_id do usuário
      const { data: usuario } = await supabase
        .from("usuarios")
        .select("organizacao_id")
        .eq("id", session.user.id)
        .single()

      if (!usuario) {
        toast.error("Usuário não encontrado.")
        return
      }

      const extensao = arquivo.name.split(".").pop() || "jpg"
      const caminho = `${usuario.organizacao_id}/${tipo}.${extensao}`

      // Remover arquivo anterior (se existir)
      const { data: arquivosExistentes } = await supabase.storage
        .from("site-assets")
        .list(usuario.organizacao_id, { search: tipo })

      if (arquivosExistentes && arquivosExistentes.length > 0) {
        const caminhosDeletar = arquivosExistentes
          .filter((a) => a.name.startsWith(tipo))
          .map((a) => `${usuario.organizacao_id}/${a.name}`)

        if (caminhosDeletar.length > 0) {
          await supabase.storage.from("site-assets").remove(caminhosDeletar)
        }
      }

      // Upload com progresso via XHR
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
      const uploadUrl = `${supabaseUrl}/storage/v1/object/site-assets/${caminho}`

      const resultado = await uploadComProgresso(
        uploadUrl,
        arquivo,
        session.access_token,
        setProgresso
      )

      if (!resultado.ok) {
        toast.error(resultado.erro || "Erro ao enviar imagem.")
        return
      }

      // Gerar URL pública
      const { data: urlPublica } = supabase.storage
        .from("site-assets")
        .getPublicUrl(caminho)

      // Adicionar timestamp para evitar cache do browser
      const urlComTimestamp = `${urlPublica.publicUrl}?t=${Date.now()}`
      onUrlChange(urlComTimestamp)
      toast.success("Imagem enviada com sucesso!")
    } catch {
      toast.error("Erro ao enviar imagem.")
    } finally {
      setEnviando(false)
      setProgresso(0)
      if (inputRef.current) inputRef.current.value = ""
    }
  }

  async function handleRemover() {
    setEnviando(true)
    try {
      const formData = new FormData()
      formData.append("tipo", tipo)

      const resultado = await removerImagemSite(formData)

      if (resultado.erro) {
        toast.error(resultado.erro)
      } else {
        onUrlChange(null)
        toast.success("Imagem removida!")
      }
    } catch {
      toast.error("Erro ao remover imagem.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>

      {urlAtual ? (
        <div className="relative">
          <div
            className={`relative overflow-hidden rounded-lg border ${
              aspecto === "video" ? "aspect-video" : "aspect-square w-32"
            }`}
          >
            <Image
              src={urlAtual}
              alt={label}
              fill
              className="object-cover"
              sizes={aspecto === "video" ? "(max-width: 768px) 100vw, 600px" : "128px"}
            />
          </div>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
              disabled={enviando}
            >
              <Upload className="mr-1.5 h-3.5 w-3.5" />
              Trocar
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemover}
              disabled={enviando}
              className="text-destructive hover:text-destructive/80"
            >
              <X className="mr-1.5 h-3.5 w-3.5" />
              Remover
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={enviando}
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted ${
            aspecto === "video" ? "aspect-video" : "aspect-square w-32"
          }`}
        >
          <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <span className="text-xs text-muted-foreground">
            {enviando ? "Enviando..." : "Clique para enviar"}
          </span>
          <span className="mt-0.5 text-xs text-muted-foreground/60">
            JPG, PNG ou WebP (até 5MB)
          </span>
        </button>
      )}

      {enviando && progresso > 0 && (
        <div className="space-y-1">
          <Progress value={progresso} />
          <p className="text-xs text-muted-foreground text-center">
            {progresso}%
          </p>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
