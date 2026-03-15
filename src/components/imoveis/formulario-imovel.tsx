"use client"

import { useActionState } from "react"
import Link from "next/link"
import { criarImovel, atualizarImovel } from "@/actions/imoveis"
import type { EstadoFormulario } from "@/types/formulario"
import type { Imovel } from "@/types/database"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ArrowLeft } from "lucide-react"

const opcoesTipo = [
  { value: "apartamento", label: "Apartamento" },
  { value: "casa", label: "Casa" },
  { value: "terreno", label: "Terreno" },
  { value: "sala_comercial", label: "Sala Comercial" },
  { value: "galpao", label: "Galpão" },
  { value: "cobertura", label: "Cobertura" },
  { value: "kitnet", label: "Kitnet" },
  { value: "fazenda", label: "Fazenda" },
  { value: "sitio", label: "Sítio" },
  { value: "loja", label: "Loja" },
  { value: "outro", label: "Outro" },
]

const opcoesFinalidade = [
  { value: "venda", label: "Venda" },
  { value: "aluguel", label: "Aluguel" },
  { value: "venda_e_aluguel", label: "Venda e Aluguel" },
]

const opcoesStatus = [
  { value: "disponivel", label: "Disponível" },
  { value: "reservado", label: "Reservado" },
  { value: "vendido", label: "Vendido" },
  { value: "alugado", label: "Alugado" },
  { value: "inativo", label: "Inativo" },
]

const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
]

type FormularioImovelProps = {
  imovel?: Imovel
}

export function FormularioImovel({ imovel }: FormularioImovelProps) {
  const action = imovel ? atualizarImovel : criarImovel
  const [estado, formAction, pendente] = useActionState<
    EstadoFormulario,
    FormData
  >(action, {})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" render={<Link href="/imoveis" />}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {imovel ? "Editar imóvel" : "Novo imóvel"}
          </h1>
          <p className="text-muted-foreground">
            {imovel
              ? "Atualize as informações do imóvel"
              : "Preencha os dados para cadastrar um novo imóvel"}
          </p>
        </div>
      </div>

      <form action={formAction} className="space-y-6">
        {imovel && <input type="hidden" name="id" value={imovel.id} />}

        {estado.erro && (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {estado.erro}
          </div>
        )}

        {/* Dados Básicos */}
        <Card>
          <CardHeader>
            <CardTitle>Dados básicos</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="codigo">Código interno</Label>
              <Input
                id="codigo"
                name="codigo"
                placeholder="Ex: APT-001"
                defaultValue={imovel?.codigo ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="titulo">Título do anúncio</Label>
              <Input
                id="titulo"
                name="titulo"
                placeholder="Ex: Apartamento 3 quartos no Centro"
                defaultValue={imovel?.titulo ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select name="tipo" defaultValue={imovel?.tipo} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {opcoesTipo.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="finalidade">Finalidade</Label>
              <Select
                name="finalidade"
                defaultValue={imovel?.finalidade}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a finalidade" />
                </SelectTrigger>
                <SelectContent>
                  {opcoesFinalidade.map((opcao) => (
                    <SelectItem key={opcao.value} value={opcao.value}>
                      {opcao.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {imovel && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  name="status"
                  defaultValue={imovel.status}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    {opcoesStatus.map((opcao) => (
                      <SelectItem key={opcao.value} value={opcao.value}>
                        {opcao.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                name="descricao"
                placeholder="Descreva o imóvel em detalhes..."
                rows={4}
                defaultValue={imovel?.descricao ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle>Endereço</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                name="cep"
                placeholder="00000-000"
                defaultValue={imovel?.cep ?? ""}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="logradouro">Logradouro</Label>
              <Input
                id="logradouro"
                name="logradouro"
                placeholder="Rua, Avenida, etc."
                defaultValue={imovel?.logradouro ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero">Número</Label>
              <Input
                id="numero"
                name="numero"
                placeholder="123"
                defaultValue={imovel?.numero ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="complemento">Complemento</Label>
              <Input
                id="complemento"
                name="complemento"
                placeholder="Apto 101, Bloco A"
                defaultValue={imovel?.complemento ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                name="bairro"
                placeholder="Centro"
                defaultValue={imovel?.bairro ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                name="cidade"
                placeholder="São Paulo"
                defaultValue={imovel?.cidade ?? ""}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select name="estado" defaultValue={imovel?.estado} required>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {estados.map((uf) => (
                    <SelectItem key={uf} value={uf}>
                      {uf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Valores */}
        <Card>
          <CardHeader>
            <CardTitle>Valores</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="preco_venda">Preço de venda (R$)</Label>
              <Input
                id="preco_venda"
                name="preco_venda"
                type="number"
                step="0.01"
                min="0"
                placeholder="500000"
                defaultValue={imovel?.preco_venda ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="preco_aluguel">Aluguel (R$/mês)</Label>
              <Input
                id="preco_aluguel"
                name="preco_aluguel"
                type="number"
                step="0.01"
                min="0"
                placeholder="2500"
                defaultValue={imovel?.preco_aluguel ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="iptu">IPTU (R$/ano)</Label>
              <Input
                id="iptu"
                name="iptu"
                type="number"
                step="0.01"
                min="0"
                placeholder="1200"
                defaultValue={imovel?.iptu ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="condominio">Condomínio (R$/mês)</Label>
              <Input
                id="condominio"
                name="condominio"
                type="number"
                step="0.01"
                min="0"
                placeholder="800"
                defaultValue={imovel?.condominio ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Características */}
        <Card>
          <CardHeader>
            <CardTitle>Características</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <Label htmlFor="area_total">Área total (m²)</Label>
              <Input
                id="area_total"
                name="area_total"
                type="number"
                step="0.01"
                min="0"
                placeholder="120"
                defaultValue={imovel?.area_total ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="area_construida">Área construída (m²)</Label>
              <Input
                id="area_construida"
                name="area_construida"
                type="number"
                step="0.01"
                min="0"
                placeholder="90"
                defaultValue={imovel?.area_construida ?? ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quartos">Quartos</Label>
              <Input
                id="quartos"
                name="quartos"
                type="number"
                min="0"
                placeholder="3"
                defaultValue={imovel?.quartos ?? 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suites">Suítes</Label>
              <Input
                id="suites"
                name="suites"
                type="number"
                min="0"
                placeholder="1"
                defaultValue={imovel?.suites ?? 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banheiros">Banheiros</Label>
              <Input
                id="banheiros"
                name="banheiros"
                type="number"
                min="0"
                placeholder="2"
                defaultValue={imovel?.banheiros ?? 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="vagas_garagem">Vagas de garagem</Label>
              <Input
                id="vagas_garagem"
                name="vagas_garagem"
                type="number"
                min="0"
                placeholder="2"
                defaultValue={imovel?.vagas_garagem ?? 0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="andares">Andares</Label>
              <Input
                id="andares"
                name="andares"
                type="number"
                min="1"
                placeholder="Apenas para comercial"
                defaultValue={imovel?.andares ?? ""}
              />
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle>Observações internas</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              id="observacoes_internas"
              name="observacoes_internas"
              placeholder="Notas privadas sobre o imóvel (só visíveis para sua equipe)..."
              rows={3}
              defaultValue={imovel?.observacoes_internas ?? ""}
            />
          </CardContent>
        </Card>

        {/* Ações */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" render={<Link href="/imoveis" />}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pendente}>
            {pendente
              ? imovel
                ? "Salvando..."
                : "Cadastrando..."
              : imovel
                ? "Salvar alterações"
                : "Cadastrar imóvel"}
          </Button>
        </div>
      </form>
    </div>
  )
}
