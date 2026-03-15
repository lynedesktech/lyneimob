"use client"

import Image from "next/image"
import { useState, useRef } from "react"
import { criarClienteBrowser } from "@/lib/supabase/client"
import { useOrganizacao } from "@/hooks/use-organizacao"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ImagePlus, Trash2, Star, Loader2 } from "lucide-react"
import { toast } from "sonner"
import type { ImovelFoto } from "@/types/database"

type GaleriaFotosProps = {
  imovelId: string
  fotos: ImovelFoto[]
}

export function GaleriaFotos({ imovelId, fotos: fotosIniciais }: GaleriaFotosProps) {
  const [fotos, setFotos] = useState<ImovelFoto[]>(fotosIniciais)
  const [enviando, setEnviando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const supabase = criarClienteBrowser()
  const { organizacao } = useOrganizacao()

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = e.target.files
    if (!arquivos || arquivos.length === 0 || !organizacao) return

    if (fotos.length + arquivos.length > 20) {
      toast.error("Limite máximo de 20 fotos por imóvel")
      return
    }

    setEnviando(true)

    for (const arquivo of Array.from(arquivos)) {
      const extensao = arquivo.name.split(".").pop()?.toLowerCase()
      if (!["jpg", "jpeg", "png", "webp"].includes(extensao ?? "")) {
        toast.error(`Formato não suportado: ${arquivo.name}`)
        continue
      }

      if (arquivo.size > 5 * 1024 * 1024) {
        toast.error(`Arquivo muito grande: ${arquivo.name} (máx. 5MB)`)
        continue
      }

      const nomeArquivo = `${crypto.randomUUID()}.${extensao}`
      const caminho = `${organizacao.id}/${imovelId}/${nomeArquivo}`

      const { error: erroUpload } = await supabase.storage
        .from("imovel-fotos")
        .upload(caminho, arquivo)

      if (erroUpload) {
        toast.error(`Erro ao enviar ${arquivo.name}`)
        continue
      }

      const { data: urlData } = supabase.storage
        .from("imovel-fotos")
        .getPublicUrl(caminho)

      const { data: novaFoto, error: erroInsert } = await supabase
        .from("imovel_fotos")
        .insert({
          imovel_id: imovelId,
          url: urlData.publicUrl,
          ordem: fotos.length,
          eh_capa: fotos.length === 0,
        })
        .select()
        .single()

      if (erroInsert) {
        toast.error(`Erro ao salvar registro de ${arquivo.name}`)
        continue
      }

      setFotos((prev) => [...prev, novaFoto as ImovelFoto])
    }

    setEnviando(false)
    if (inputRef.current) inputRef.current.value = ""
    toast.success("Fotos enviadas com sucesso")
  }

  async function marcarComoCapa(fotoId: string) {
    // Desmarcar todas
    await supabase
      .from("imovel_fotos")
      .update({ eh_capa: false })
      .eq("imovel_id", imovelId)

    // Marcar a selecionada
    await supabase
      .from("imovel_fotos")
      .update({ eh_capa: true })
      .eq("id", fotoId)

    setFotos((prev) =>
      prev.map((f) => ({ ...f, eh_capa: f.id === fotoId }))
    )
    toast.success("Foto de capa atualizada")
  }

  async function excluirFoto(foto: ImovelFoto) {
    // Extrair caminho do storage a partir da URL
    const urlObj = new URL(foto.url)
    const caminhoStorage = urlObj.pathname.split("/imovel-fotos/").pop()

    if (caminhoStorage) {
      await supabase.storage
        .from("imovel-fotos")
        .remove([decodeURIComponent(caminhoStorage)])
    }

    await supabase.from("imovel_fotos").delete().eq("id", foto.id)

    setFotos((prev) => prev.filter((f) => f.id !== foto.id))
    toast.success("Foto removida")
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base">
          Fotos ({fotos.length}/20)
        </CardTitle>
        <div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={enviando || fotos.length >= 20}
          >
            {enviando ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <ImagePlus className="mr-2 h-4 w-4" />
            )}
            {enviando ? "Enviando..." : "Adicionar fotos"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {fotos.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {fotos
              .sort((a, b) => a.ordem - b.ordem)
              .map((foto) => (
                <div key={foto.id} className="group relative aspect-video overflow-hidden rounded-lg border">
                  <Image
                    src={foto.url}
                    alt={foto.descricao ?? "Foto do imóvel"}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />

                  {foto.eh_capa && (
                    <div className="absolute left-2 top-2">
                      <span className="flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground">
                        <Star className="h-3 w-3" />
                        Capa
                      </span>
                    </div>
                  )}

                  <div className="absolute inset-0 flex items-end justify-end gap-1 bg-gradient-to-t from-black/50 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    {!foto.eh_capa && (
                      <Button
                        variant="secondary"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => marcarComoCapa(foto.id)}
                        title="Definir como capa"
                      >
                        <Star className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => excluirFoto(foto)}
                      title="Excluir foto"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
            <ImagePlus className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">Nenhuma foto</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Adicione fotos para valorizar o anúncio do imóvel
            </p>
            <Button
              variant="outline"
              onClick={() => inputRef.current?.click()}
            >
              <ImagePlus className="mr-2 h-4 w-4" />
              Adicionar fotos
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
