/**
 * Script para criar o Super Admin do LyneImob
 *
 * Cria o usuário no Supabase Auth, que dispara o trigger automático
 * criando organização + registro na tabela usuarios.
 * Depois atualiza o perfil para super_admin e popula os dados completos.
 *
 * Uso: node scripts/criar-super-admin.mjs
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync } from "fs"
import { resolve } from "path"

// Carregar .env.local manualmente
const envPath = resolve(process.cwd(), ".env.local")
const envContent = readFileSync(envPath, "utf-8")
const env = {}
for (const line of envContent.split("\n")) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith("#")) continue
  const [key, ...rest] = trimmed.split("=")
  env[key.trim()] = rest.join("=").trim()
}

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("❌ Variáveis NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórias no .env.local")
  process.exit(1)
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

// ============================================================
// Dados do Super Admin
// ============================================================
const SUPER_ADMIN = {
  email: "superadmin@lyneimob.com",
  senha: "LyneImob@2026!",
  nome: "Super Admin",
  telefone: "(11) 99999-0000",
  cargo: "admin",
  bio: "Administrador geral da plataforma LyneImob. Acesso total a todas as organizações e módulos do sistema.",
}

const ORGANIZACAO = {
  nome: "LyneImob - Plataforma",
  email: "contato@lyneimob.com",
  telefone: "(11) 99999-0000",
  creci: null,
}

// ============================================================
// Execução
// ============================================================
async function main() {
  console.log("🚀 Criando Super Admin do LyneImob...\n")

  // 1. Verificar se já existe
  const { data: existente } = await admin
    .from("usuarios")
    .select("id, email, perfil_plataforma")
    .eq("email", SUPER_ADMIN.email)
    .maybeSingle()

  if (existente) {
    console.log(`⚠️  Usuário ${SUPER_ADMIN.email} já existe no banco.`)

    if (existente.perfil_plataforma !== "super_admin") {
      console.log("   Atualizando perfil para super_admin...")
      await admin
        .from("usuarios")
        .update({ perfil_plataforma: "super_admin", super_admin: true })
        .eq("id", existente.id)
      console.log("   ✅ Perfil atualizado!")
    } else {
      console.log("   ✅ Já é super_admin. Nada a fazer.")
    }
    return
  }

  // 2. Criar usuário no Supabase Auth
  console.log("1️⃣  Criando usuário no Supabase Auth...")
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: SUPER_ADMIN.email,
    password: SUPER_ADMIN.senha,
    email_confirm: true,
    user_metadata: { nome: SUPER_ADMIN.nome },
  })

  if (authError) {
    console.error(`❌ Erro ao criar auth user: ${authError.message}`)
    process.exit(1)
  }

  const userId = authData.user.id
  console.log(`   ✅ Auth user criado: ${userId}`)

  // 3. Aguardar trigger criar o registro (pode levar alguns ms)
  console.log("2️⃣  Aguardando trigger criar organização e usuário...")
  await new Promise((r) => setTimeout(r, 2000))

  // 4. Buscar o registro criado pelo trigger
  const { data: usuario } = await admin
    .from("usuarios")
    .select("id, organizacao_id")
    .eq("id", userId)
    .single()

  if (!usuario) {
    console.error("❌ Trigger não criou o registro de usuário. Verifique as migrations.")
    process.exit(1)
  }

  console.log(`   ✅ Registro encontrado na tabela usuarios`)

  // 5. Atualizar dados do usuário
  console.log("3️⃣  Populando dados do super admin...")
  const { error: updateUserError } = await admin
    .from("usuarios")
    .update({
      nome: SUPER_ADMIN.nome,
      telefone: SUPER_ADMIN.telefone,
      cargo: SUPER_ADMIN.cargo,
      bio: SUPER_ADMIN.bio,
      perfil_plataforma: "super_admin",
      super_admin: true,
      ativo: true,
    })
    .eq("id", userId)

  if (updateUserError) {
    console.error(`❌ Erro ao atualizar usuário: ${updateUserError.message}`)
    process.exit(1)
  }

  console.log(`   ✅ Usuário atualizado com perfil super_admin`)

  // 6. Atualizar dados da organização
  console.log("4️⃣  Populando dados da organização...")
  const { error: updateOrgError } = await admin
    .from("organizacoes")
    .update({
      nome: ORGANIZACAO.nome,
      email: ORGANIZACAO.email,
      telefone: ORGANIZACAO.telefone,
      plano: "crm_ia_sdr",
      plano_status: "active",
      limites: {
        max_corretores: 999,
        max_imoveis: 99999,
        max_conversas_ia_mes: 99999,
      },
    })
    .eq("id", usuario.organizacao_id)

  if (updateOrgError) {
    console.error(`❌ Erro ao atualizar organização: ${updateOrgError.message}`)
    process.exit(1)
  }

  console.log(`   ✅ Organização atualizada: "${ORGANIZACAO.nome}"`)

  // 7. Resumo final
  console.log("\n" + "=".repeat(50))
  console.log("🎉 SUPER ADMIN CRIADO COM SUCESSO!")
  console.log("=".repeat(50))
  console.log(`   Email:    ${SUPER_ADMIN.email}`)
  console.log(`   Senha:    ${SUPER_ADMIN.senha}`)
  console.log(`   Nome:     ${SUPER_ADMIN.nome}`)
  console.log(`   Perfil:   super_admin`)
  console.log(`   Org:      ${ORGANIZACAO.nome}`)
  console.log(`   Plano:    crm_ia_sdr (ilimitado)`)
  console.log("=".repeat(50))
  console.log("\n⚠️  IMPORTANTE: Troque a senha após o primeiro login!")
}

main().catch((err) => {
  console.error("❌ Erro inesperado:", err)
  process.exit(1)
})
