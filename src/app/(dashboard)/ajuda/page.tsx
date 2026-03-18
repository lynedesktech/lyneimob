import {
  LayoutDashboard,
  Building2,
  Users,
  Handshake,
  CalendarCheck,
  MapPin,
  Globe,
  Settings,
  MessageCircle,
} from "lucide-react"
import { CardModuloAjuda } from "@/components/ajuda/card-modulo-ajuda"

const modulos = [
  {
    titulo: "Dashboard",
    descricao: "Visão geral do seu negócio com resumo semanal e métricas",
    icone: <LayoutDashboard className="h-5 w-5" />,
    passos: [
      {
        titulo: "Entendendo o painel",
        descricao:
          "O dashboard é a primeira tela que aparece quando você entra no sistema. Ele mostra um resumo rápido de tudo que está acontecendo: negócios em andamento, atividades pendentes e métricas importantes.",
      },
      {
        titulo: "Resumo semanal com IA",
        descricao:
          "Toda semana a IA analisa seus dados e gera um resumo automático com insights — o que avançou, o que precisa de atenção e sugestões de próximos passos.",
      },
      {
        titulo: "Gráficos e métricas",
        descricao:
          "Os gráficos mostram o funil de negócios (quantos em cada etapa), seu portfólio de imóveis por tipo e a evolução mensal das suas vendas.",
      },
    ],
  },
  {
    titulo: "Imóveis",
    descricao: "Cadastro, edição e gestão do portfólio de imóveis",
    icone: <Building2 className="h-5 w-5" />,
    passos: [
      {
        titulo: "Cadastrar um imóvel",
        descricao:
          "Clique em \"Novo Imóvel\" no topo da página. Preencha os dados básicos (tipo, finalidade, endereço, valores, área) e clique em Salvar. A IA pode gerar a descrição do anúncio automaticamente.",
      },
      {
        titulo: "Adicionar fotos",
        descricao:
          "Na página de detalhe do imóvel, vá na aba \"Fotos\". Arraste as imagens ou clique para selecionar. Você pode marcar uma como foto de capa e reordenar as demais.",
      },
      {
        titulo: "Gerar descrição com IA",
        descricao:
          "Na aba \"IA\" do imóvel, clique em \"Gerar descrição\". A IA cria um texto profissional para anúncio com base nos dados cadastrados. Você pode editar depois ou pedir para melhorar.",
      },
      {
        titulo: "Publicar no site",
        descricao:
          "Marque a opção \"Publicar no site\" no formulário do imóvel. Ele aparecerá automaticamente no seu site público para os visitantes verem.",
      },
      {
        titulo: "Filtrar e buscar",
        descricao:
          "Use os filtros no topo da listagem para encontrar imóveis por tipo, finalidade, status, faixa de preço ou bairro. Também pode usar a busca global (Ctrl+K) para encontrar rapidamente.",
      },
    ],
  },
  {
    titulo: "Clientes",
    descricao: "Cadastro de clientes, interesses e histórico",
    icone: <Users className="h-5 w-5" />,
    passos: [
      {
        titulo: "Cadastrar um cliente",
        descricao:
          "Clique em \"Novo Cliente\". Preencha nome, telefone, email e dados básicos. Defina o status inicial (ativo, inativo, lead).",
      },
      {
        titulo: "Registrar interesses",
        descricao:
          "Na aba \"Preferências\" do cliente, registre o que ele procura: tipo de imóvel, faixa de preço, bairros preferidos, número de quartos. Isso ajuda a IA a fazer o match automático.",
      },
      {
        titulo: "Ver negócios vinculados",
        descricao:
          "Na aba \"Negócios\" do cliente, você vê todas as negociações associadas a ele — ativas, ganhas e perdidas — com link direto para cada uma.",
      },
      {
        titulo: "Match com IA",
        descricao:
          "A IA analisa os interesses do cliente e sugere imóveis compatíveis do seu portfólio. Quanto mais completos os dados de interesse, melhor o match.",
      },
    ],
  },
  {
    titulo: "Negócios",
    descricao: "Pipeline de vendas com Kanban e acompanhamento de negociações",
    icone: <Handshake className="h-5 w-5" />,
    passos: [
      {
        titulo: "Criar um negócio",
        descricao:
          "Clique em \"Novo Negócio\". Vincule um cliente, um imóvel (ou lote), defina o valor e a etapa do funil. O negócio aparecerá no Kanban.",
      },
      {
        titulo: "Usar o Kanban",
        descricao:
          "O Kanban mostra seus negócios organizados por etapa (Qualificação, Proposta, Negociação, etc.). Arraste os cards entre as colunas conforme o negócio avança.",
      },
      {
        titulo: "Ganhar ou perder negócio",
        descricao:
          "Quando fechar uma venda, marque como \"Ganho\". Se perdeu, marque como \"Perdido\" e registre o motivo. Se havia um lote vinculado, ele é atualizado automaticamente para \"vendido\".",
      },
      {
        titulo: "Ações em massa",
        descricao:
          "Na visualização em lista, selecione vários negócios e use a barra de ações para mover de etapa, excluir ou alterar status em lote.",
      },
    ],
  },
  {
    titulo: "Atividades",
    descricao: "Agenda de visitas, ligações, follow-ups e tarefas",
    icone: <CalendarCheck className="h-5 w-5" />,
    passos: [
      {
        titulo: "Criar uma atividade",
        descricao:
          "Clique em \"Nova Atividade\". Escolha o tipo (visita, ligação, reunião, etc.), data e horário, e opcionalmente vincule a um cliente ou negócio.",
      },
      {
        titulo: "Visualizar no calendário",
        descricao:
          "Alterne entre as visualizações mensal, semanal e diária para ver suas atividades organizadas no tempo. Clique em qualquer atividade para ver os detalhes.",
      },
      {
        titulo: "Marcar como concluída",
        descricao:
          "Quando realizar a atividade, marque como concluída. Atividades atrasadas aparecem em destaque para lembrar você.",
      },
    ],
  },
  {
    titulo: "Loteamentos",
    descricao: "Gestão de empreendimentos com lotes, fotos e integração com vendas",
    icone: <MapPin className="h-5 w-5" />,
    passos: [
      {
        titulo: "Cadastrar um loteamento",
        descricao:
          "Clique em \"Novo Loteamento\". Preencha nome, localização e status do empreendimento. Você pode publicar no site público para divulgação.",
      },
      {
        titulo: "Adicionar lotes",
        descricao:
          "Na página de detalhe do loteamento, use a tabela de lotes para cadastrar individualmente ou importe vários de uma vez via CSV.",
      },
      {
        titulo: "Importar lotes por CSV",
        descricao:
          "Na aba de importação, faça upload de um arquivo CSV com os dados dos lotes (quadra, número, área, valor). O sistema faz o mapeamento automático das colunas.",
      },
      {
        titulo: "Fotos e descrição com IA",
        descricao:
          "Na aba \"Fotos\", adicione imagens do empreendimento. Na aba \"IA\", gere uma descrição profissional automaticamente com base nos dados cadastrados.",
      },
      {
        titulo: "Vincular lote a um negócio",
        descricao:
          "Ao criar um negócio, selecione o loteamento e o lote específico. Quando o negócio for ganho, o lote é marcado automaticamente como vendido.",
      },
    ],
  },
  {
    titulo: "Meu Site",
    descricao: "Personalização do site público da sua imobiliária",
    icone: <Globe className="h-5 w-5" />,
    passos: [
      {
        titulo: "Acessar configurações do site",
        descricao:
          "Vá em Configurações → Meu Site. Lá você define o nome do site, cores, telefone de contato, WhatsApp e texto da página Sobre.",
      },
      {
        titulo: "Fazer upload da logo",
        descricao:
          "Na aba \"Logo\", envie a imagem da sua logo. Ela aparecerá no header e footer do seu site público. Aceita JPG, PNG ou WebP até 5MB.",
      },
      {
        titulo: "Publicar imóveis e loteamentos",
        descricao:
          "Para que imóveis e loteamentos apareçam no site, marque \"Publicar no site\" em cada cadastro. Somente os publicados ficam visíveis para visitantes.",
      },
      {
        titulo: "Visualizar o site",
        descricao:
          "Seu site fica acessível em uma URL com o slug da sua organização. Compartilhe esse link com seus clientes para que vejam seus imóveis disponíveis.",
      },
    ],
  },
  {
    titulo: "Configurações",
    descricao: "Empresa, equipe, pipeline, integrações e mais",
    icone: <Settings className="h-5 w-5" />,
    passos: [
      {
        titulo: "Dados da empresa",
        descricao:
          "Configure nome, endereço, telefone e CRECI da sua empresa. Esses dados aparecem no site público e nos relatórios.",
      },
      {
        titulo: "Gerenciar equipe",
        descricao:
          "Adicione corretores e gerentes à sua equipe. Defina cargos e permissões — admin vê tudo, gerente vê registros, corretor vê apenas os próprios.",
      },
      {
        titulo: "Personalizar pipeline",
        descricao:
          "Configure as etapas do seu funil de vendas (Qualificação, Proposta, Negociação, etc.). Renomeie, reordene ou adicione novas etapas conforme seu processo.",
      },
      {
        titulo: "Tipos de atividade",
        descricao:
          "Personalize os tipos de atividade disponíveis (visita, ligação, reunião, etc.) com nomes e cores que façam sentido para sua equipe.",
      },
    ],
  },
  {
    titulo: "WhatsApp e Integrações",
    descricao: "Agente IA no WhatsApp e integração com portais imobiliários",
    icone: <MessageCircle className="h-5 w-5" />,
    passos: [
      {
        titulo: "Conectar o WhatsApp",
        descricao:
          "Vá em Configurações → WhatsApp e siga o wizard de conexão. Você vai precisar das credenciais da API do WhatsApp Business (ID do número e token de acesso).",
      },
      {
        titulo: "Configurar o agente IA",
        descricao:
          "Após conectar, configure o horário de atendimento e o corretor padrão para receber os leads. O agente IA vai qualificar os leads automaticamente via WhatsApp.",
      },
      {
        titulo: "Como funciona o atendimento",
        descricao:
          "Quando um lead manda mensagem, o agente IA responde automaticamente: identifica o interesse, qualifica o lead e cadastra no CRM. Quando pronto, transfere para o corretor humano.",
      },
      {
        titulo: "Integração com portais",
        descricao:
          "Em Configurações → Portais, configure a integração com portais imobiliários. Seus imóveis são exportados automaticamente via XML feed.",
      },
    ],
  },
]

export default function PaginaAjuda() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold">Central de Ajuda</h1>
        <p className="text-sm text-muted-foreground">
          Aprenda a usar cada módulo do sistema com tutoriais e vídeos
        </p>
      </div>

      {/* Grid de módulos */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {modulos.map((modulo) => (
          <CardModuloAjuda
            key={modulo.titulo}
            titulo={modulo.titulo}
            descricao={modulo.descricao}
            icone={modulo.icone}
            passos={modulo.passos}
          />
        ))}
      </div>
    </div>
  )
}
