import { redirect } from "next/navigation"

// O painel da plataforma foi integrado ao /painel principal.
// super_admin agora vê as métricas globais diretamente no dashboard.
export default function AdminPainelPage() {
  redirect("/painel")
}
