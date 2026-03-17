import { redirect } from "next/navigation"

// A página de configurações foi unificada em /configuracoes
// super_admin agora vê todos os cards (imobiliária + plataforma) em uma só tela
export default function AdminConfiguracoesPage() {
  redirect("/configuracoes")
}
