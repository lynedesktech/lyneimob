/**
 * Script para limpar TODOS os dados do banco de dados.
 * Apaga tudo: usuarios, organizacoes, imoveis, clientes, negocios, etc.
 * Usado para testar o sistema do zero.
 *
 * Executar: node scripts/limpar-banco.mjs
 */

const SUPABASE_URL = "https://ldahoecercachalpmvkh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxkYWhvZWNlcmNhY2hhbHBtdmtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDc5NTA1NCwiZXhwIjoyMDkwMzcxMDU0fQ.WpfwX4SPgimnYmtEdfAcq6q_t2vghD2uRgMdIjvgQGQ";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=minimal"
};

async function deletarTudo(tabela) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${tabela}?id=not.is.null`, {
    method: "DELETE",
    headers
  });

  if (!res.ok) {
    const erro = await res.text();
    console.error(`  ERRO ao limpar ${tabela}: ${erro}`);
    return false;
  }

  console.log(`  OK: ${tabela} limpa`);
  return true;
}

async function listarUsuariosAuth() {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users?per_page=1000`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    }
  });

  if (!res.ok) {
    console.error("  ERRO ao listar usuarios auth:", await res.text());
    return [];
  }

  const data = await res.json();
  return data.users || [];
}

async function deletarUsuarioAuth(id) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
    method: "DELETE",
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    }
  });

  if (!res.ok) {
    const erro = await res.text();
    console.error(`  ERRO ao deletar usuario auth ${id}: ${erro}`);
    return false;
  }

  return true;
}

async function main() {
  console.log("===========================================");
  console.log("  LIMPEZA TOTAL DO BANCO DE DADOS");
  console.log("  Isso vai apagar TUDO. Sem volta.");
  console.log("===========================================\n");

  // Ordem de delecao: das folhas para as raizes (respeita foreign keys)
  console.log("1/6 - Limpando tabelas folha (mensagens, fotos, historico)...");
  await deletarTudo("mensagens_whatsapp");
  await deletarTudo("historico_tarefas_roadmap");
  await deletarTudo("imovel_fotos");
  await deletarTudo("loteamento_fotos");
  await deletarTudo("cliente_interesses");
  await deletarTudo("cliente_interacoes");

  console.log("\n2/6 - Limpando atividades, conversas e leads...");
  await deletarTudo("atividades");
  await deletarTudo("conversas_whatsapp");
  await deletarTudo("leads_portais");

  console.log("\n3/6 - Limpando negocios...");
  await deletarTudo("negocios");

  console.log("\n4/6 - Limpando entidades principais...");
  await deletarTudo("clientes");
  await deletarTudo("lotes");
  await deletarTudo("loteamentos");
  await deletarTudo("imoveis");
  await deletarTudo("pipeline_etapas");
  await deletarTudo("tipos_atividade");
  await deletarTudo("config_whatsapp");
  await deletarTudo("dominios_customizados");
  await deletarTudo("resumos_semanais");
  await deletarTudo("eventos_billing");
  await deletarTudo("convites");
  await deletarTudo("tarefas_roadmap");

  console.log("\n5/6 - Limpando usuarios e organizacoes...");
  await deletarTudo("usuarios");
  await deletarTudo("organizacoes");

  console.log("\n6/6 - Limpando usuarios do auth (Supabase Auth)...");
  const usuarios = await listarUsuariosAuth();
  console.log(`  Encontrados ${usuarios.length} usuarios no auth`);

  for (const user of usuarios) {
    const ok = await deletarUsuarioAuth(user.id);
    if (ok) {
      console.log(`  OK: auth user ${user.email} removido`);
    }
  }

  console.log("\n===========================================");
  console.log("  LIMPEZA CONCLUIDA!");
  console.log("  O banco esta vazio e pronto para testes.");
  console.log("  Ao criar um novo usuario, o sistema vai");
  console.log("  gerar automaticamente a organizacao,");
  console.log("  etapas do pipeline e tipos de atividade.");
  console.log("===========================================");
}

main().catch(console.error);
