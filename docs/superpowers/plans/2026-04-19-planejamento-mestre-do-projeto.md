# Resenha do Teólogo Master Project Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir, lançar e escalar a Resenha do Teólogo como uma plataforma SaaS multi-tenant de ensino teológico, com base gratuita forte para alunos, operação sustentável para criadores e trilha clara de monetização premium, institucional e comercial.
**Architecture:** Frontend React com experiência editorial premium, shell único de dashboard com renderização condicional por perfil, backend Convex com separação rígida por tenant, autenticação Clerk por perfil, borda e deploy em Vercel + Cloudflare, integrações modulares para pagamentos, e-mail, storage, analytics, Bíblia e monetização.
**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS 4, Framer Motion, Convex, Clerk, Vercel, Cloudflare, Cloudflare R2, Resend, Stripe.

---

## Escopo do plano

Este plano cobre um programa completo, não apenas uma feature. O projeto envolve múltiplos subsistemas independentes e interligados:

- [ ] Aquisição pública e landing pages
- [ ] Autenticação e onboarding por perfil
- [ ] Dashboard único condicional por perfil
- [ ] Experiência do criador dentro do dashboard
- [ ] Experiência do aluno dentro do dashboard
- [ ] Experiência institucional dentro do dashboard
- [ ] Motor de cursos, aulas, quizzes, progresso e certificados
- [ ] Monetização com AdSense, premium, loja e repasses
- [ ] Comunidade, retenção e notificações
- [ ] Infraestrutura, segurança, conformidade e observabilidade
- [ ] Crescimento, conteúdo, analytics e operação

Cada grande frente acima deve gerar, no momento certo, um plano de execução próprio com backlog técnico detalhado.

## Visão norteadora

A Resenha do Teólogo não deve parecer uma startup genérica com cursos anexados. Ela deve ser percebida como uma plataforma editorial, acadêmica e institucional, com profundidade teológica, clareza pedagógica e operação moderna de SaaS.

Princípios que não podem ser quebrados:

- [ ] Todo curso permanece gratuito para o aluno
- [ ] Multi-tenant desde o início, com filtragem por `creatorId` e isolamento rigoroso entre criadores
- [ ] Português como idioma principal, com arquitetura pronta para EN e ES
- [ ] Vídeo sempre por URL externa, nunca upload direto
- [ ] Certificado somente com desempenho mínimo de 70%
- [ ] AdSense nunca deve aparecer para usuário com premium ativo
- [ ] Landing, páginas institucionais e dashboard seguem direção dark premium
- [ ] Área de estudo do aluno segue direção light editorial e altamente legível
- [ ] Orange `#F37E20` usado com disciplina, como acento e não como base
- [ ] A experiência visual deve comunicar profundidade, confiança e leitura prolongada

## Decisão estrutural do dashboard

O produto deve operar com um dashboard único, não com três dashboards independentes. A base de navegação, layout, permissões e estrutura visual deve ser compartilhada, enquanto o que aparece ou deixa de aparecer na tela será controlado pelo perfil do usuário.

Diretrizes obrigatórias dessa decisão:

- [ ] Manter uma única entrada principal em `/dashboard`
- [ ] Manter um único `DashboardLayout` como app shell institucional
- [ ] Controlar menu, rotas, widgets, atalhos, cards e ações por configuração de perfil
- [ ] Centralizar permissões em helpers e mapas de configuração, evitando condição solta espalhada pela interface
- [ ] Garantir que backend e frontend validem acesso, pois ocultar item visual não substitui autorização real
- [ ] Permitir que superfícies de estudo do aluno usem linguagem light editorial dentro da mesma arquitetura de dashboard
- [ ] Preparar a base para evoluir de perfil para permissões mais finas no futuro, sem reescrever a navegação inteira

## Estado atual do projeto

O repositório já possui uma base relevante, mas ainda está concentrado em superfície pública, autenticação e dashboard inicial do criador.

### O que já existe

- [x] Landing page pública
- [x] Fluxos de entrada e cadastro
- [x] Cadastro separado para aluno, criador e instituição
- [x] Base visual principal alinhada à identidade editorial premium
- [x] Dashboard unificado com navegação inicial
- [x] Área do criador com visão geral, cursos, edição de curso, módulos, aulas, financeiro e perfil
- [x] Schema Convex com `users`, `courses`, `modules`, `lessons`, `quizzes`, `enrollments`, `progress` e `donations`
- [x] Mutations e queries básicas para usuários, cursos, módulos, aulas e quizzes

### O que está parcial

- [ ] O dashboard unificado já existe, mas ainda está orientado principalmente ao perfil criador
- [ ] O perfil aluno ainda não possui seus módulos reais dentro da mesma estrutura condicional
- [ ] O perfil instituição ainda não possui seus módulos reais dentro da mesma estrutura condicional
- [ ] Financeiro atual é inicial e ainda não representa o sistema real de repasse e monetização
- [ ] Há estrutura de progresso e matrícula no schema, mas a experiência completa de consumo ainda não está implementada

### O que ainda não existe

- [ ] Player anti-skip funcional com rastreamento de tempo assistido
- [ ] Matrícula real e consumo real de cursos pelo aluno
- [ ] Fluxo de quiz em aula com correção, aprovação e trava pedagógica
- [ ] Geração e emissão de certificado
- [ ] Páginas públicas de catálogo, curso e aula para aluno
- [ ] Premium do aluno e premium do criador
- [ ] AdSense com regras de exibição
- [ ] Stripe operacional para assinaturas, doações e loja
- [ ] Bíblia, caderno digital, ebooks e flashcards
- [ ] Fórum, notificações e perguntas ao professor
- [ ] White label, IA tutor, biblioteca geral, PWA e acessibilidade avançada

## Premissas operacionais

- [ ] Planejamento baseado em execução founder-led com apoio de IA e cadência enxuta
- [ ] Cronograma proposto é realista para um time pequeno, não para uma squad completa dedicada
- [ ] O projeto precisa validar valor para três públicos: aluno, criador e instituição
- [ ] O produto precisa nascer com base sólida de dados e permissões antes de acelerar features
- [ ] O design system não é acabamento visual, é parte central do posicionamento premium
- [ ] As experiências por perfil devem viver no mesmo app shell, com configuração centralizada de visibilidade e acesso

## Meta macro de 12 meses

- [ ] Lançar a Fase 1 com fluxo completo de criação, consumo, quiz e certificado
- [ ] Validar ativação de criadores e retenção de alunos
- [ ] Lançar ecossistema de estudo com Bíblia, notas e ebooks
- [ ] Abrir monetização com premium, loja e repasses
- [ ] Estruturar base institucional e piloto white label
- [ ] Preparar fundação para IA tutor, biblioteca e crescimento em escala

## Modelo de execução recomendado

### Cadência

- [ ] Trabalhar em sprints semanais com revisão quinzenal de escopo
- [ ] Manter backlog separado por frente: produto, plataforma, design, growth, operação
- [ ] Fechar cada fase com critérios de saída claros, nunca por sensação de "está quase pronto"
- [ ] Não abrir duas frentes pesadas de produto ao mesmo tempo quando uma depende da outra

### Ordem de prioridade

- [ ] Primeiro completar o núcleo de aprendizagem
- [ ] Depois ampliar profundidade de estudo
- [ ] Depois abrir comunidade e retenção
- [ ] Depois ativar monetização avançada
- [ ] Depois escalar para white label, IA e ecossistema amplo

### Janela de tempo realista

- [ ] Sprint 0, 1 a 2 semanas
- [ ] Fase 1, 5 a 7 semanas
- [ ] Fase 2, 4 a 6 semanas
- [ ] Fase 3, 3 a 5 semanas
- [ ] Fase 4, 4 a 6 semanas
- [ ] Fase 5, 6 a 8 semanas

Tempo total estimado: 23 a 34 semanas para um lançamento robusto, considerando iteração, ajustes e operação real.

## Sprint 0, fundação e endurecimento

Objetivo: fechar lacunas estruturais antes de acelerar features.

### Produto e UX

- [ ] Consolidar mapa completo de páginas por perfil: público, aluno, criador, instituição, admin
- [ ] Fechar linguagem de navegação e taxonomia principal do produto
- [ ] Formalizar arquitetura do dashboard único, sidebar, header, home, rotas e blocos condicionais por perfil
- [ ] Formalizar estados vazios, carregamento, erro e sucesso dentro do design system
- [ ] Definir componentes mestres de cards, tabelas, métricas, formulários, shells e CTAs

### Arquitetura e dados

- [ ] Auditar todo schema Convex para garantir que nenhuma entidade futura quebre multi-tenant
- [ ] Definir estratégia consistente de autorização por perfil e por tenant
- [ ] Criar camada central de `permissions`, `route access` e `dashboard config by profile`
- [ ] Criar convenção de services e hooks para separar UI de acesso a dados
- [ ] Definir naming consistente para entidades, rotas e funções

### Ambiente e operação

- [ ] Fechar `.env` esperado por ambiente local, preview e produção
- [ ] Configurar projetos base em Vercel, Clerk, Convex, Resend, Stripe e Cloudflare
- [ ] Definir estratégia de logs, erros e monitoramento inicial
- [ ] Documentar fluxo de deploy, rollback e validação pós-release

### Analytics e governança

- [ ] Definir eventos essenciais de funil: visita, cadastro, publicação, matrícula, início de aula, conclusão, quiz, certificado, assinatura e doação
- [ ] Estabelecer dashboard mínimo de indicadores para fundadores
- [ ] Definir política de priorização: bug crítico, dívida bloqueadora, feature validada, experimento

### Critério de saída do Sprint 0

- [ ] Estrutura de permissões e dados revisada
- [ ] Ambientes e integrações base preparados
- [ ] Mapa do produto fechado
- [ ] KPIs principais definidos
- [ ] Base visual e estrutural pronta para escalar sem retrabalho severo

## Fase 1, núcleo do produto e MVP real

Objetivo: permitir que um criador publique um curso e que um aluno consuma esse curso até receber um certificado válido.

### Frente A, autenticação e identidade

- [ ] Finalizar integração real do Clerk com Google, Facebook e e-mail/senha
- [ ] Sincronizar criação e atualização de usuário entre Clerk e Convex
- [ ] Garantir onboarding por perfil com redirecionamento correto
- [ ] Implementar guards de rota por autenticação e por tipo de perfil
- [ ] Resolver perfil ativo do usuário para carregar navegação e módulos corretos no dashboard único

### Frente B, arquitetura do dashboard único

- [ ] Consolidar `DashboardLayout` como shell único para aluno, criador e instituição
- [ ] Centralizar itens de navegação por perfil em configuração única
- [ ] Centralizar rotas permitidas por perfil em configuração única
- [ ] Centralizar cards, widgets e atalhos da home por perfil
- [ ] Criar helpers reutilizáveis para renderização condicional, sem espalhar regras de perfil pelo JSX
- [ ] Garantir fallback elegante para módulos ainda não liberados por perfil

### Frente C, criador e gestão de conteúdo

- [ ] Finalizar CRUD de cursos com validações de publicação
- [ ] Finalizar CRUD de módulos com ordenação clara
- [ ] Finalizar CRUD de aulas com campos pedagógicos e controle de publicação
- [ ] Finalizar builder de quiz por aula
- [ ] Permitir rascunho, revisão e publicação progressiva do curso
- [ ] Exibir estatísticas reais de cursos, alunos e conclusão

### Frente D, experiência pública e catálogo

- [ ] Criar página pública de catálogo de cursos
- [ ] Criar página pública de detalhe do curso
- [ ] Criar estrutura pública de autor, instituição e categorias
- [ ] Implementar CTA de matrícula respeitando o perfil do usuário

### Frente E, experiência do aluno dentro do dashboard único

- [ ] Entregar home do aluno dentro do dashboard único, em light mode editorial
- [ ] Implementar matrícula em curso
- [ ] Criar página de curso em andamento
- [ ] Criar página de aula com player, materiais e quiz
- [ ] Mostrar progresso por curso, módulo e aula
- [ ] Exibir área de certificados emitidos
- [ ] Garantir que as superfícies de estudo do aluno convivam com o shell único sem quebrar a legibilidade editorial

### Frente F, base institucional dentro do dashboard único

- [ ] Entregar navegação inicial e home institucional dentro do mesmo dashboard
- [ ] Definir módulos visíveis de membros, relatórios e gestão institucional
- [ ] Preparar arquitetura para liberar recursos institucionais sem criar um app separado

### Frente G, player anti-skip e progresso

- [ ] Integrar YouTube IFrame API
- [ ] Implementar player customizado com overlay controlado
- [ ] Rastrear tempo assistido por aluno e por aula
- [ ] Bloquear conclusão da aula sem tempo mínimo assistido
- [ ] Definir comportamento para reconexão, refresh e retomada
- [ ] Salvar progresso de forma resiliente e auditável

### Frente H, quiz, aprovação e certificado

- [ ] Implementar execução de quiz por aula
- [ ] Definir regra de aprovação por quiz e por curso
- [ ] Calcular média final do curso
- [ ] Emitir certificado apenas acima de 70%
- [ ] Criar template de certificado com linguagem editorial premium
- [ ] Registrar emissão de certificado no histórico do aluno

### Frente I, base de monetização inicial

- [ ] Estruturar locais elegíveis para AdSense sem poluir a experiência
- [ ] Implementar regra de supressão de anúncios para premium ativo
- [ ] Mapear futuro premium sem ativar cobrança ainda, se isso acelerar a Fase 1
- [ ] Exibir doações recebidas de forma básica para criador

### Critério de saída da Fase 1

- [ ] Um criador consegue publicar curso completo
- [ ] Um aluno consegue se cadastrar, matricular, assistir aula, fazer quiz e concluir curso
- [ ] O sistema registra progresso e emite certificado corretamente
- [ ] O produto está pronto para piloto fechado com usuários reais

### KPIs da Fase 1

- [ ] Taxa de conclusão do cadastro
- [ ] Taxa de publicação do primeiro curso por criador
- [ ] Taxa de matrícula por visitante autenticado
- [ ] Taxa de conclusão da primeira aula
- [ ] Taxa de conclusão de curso
- [ ] Taxa de certificação

## Fase 2, ecossistema de estudo

Objetivo: transformar a plataforma em um ambiente de estudo contínuo, não apenas em um player de aulas.

### Bíblia e leitura aprofundada

- [ ] Integrar API.Bible ou provedor equivalente
- [ ] Criar painel lateral de Bíblia dentro da experiência de estudo
- [ ] Permitir seleção de traduções
- [ ] Planejar estrutura futura para originais, interlinear e comentários

### Caderno digital

- [ ] Criar notebook por aluno com salvamento automático
- [ ] Permitir vincular notas a aula, minuto do vídeo, curso e referência bíblica
- [ ] Permitir exportação de notas em formato útil, como PDF ou documento

### eBooks e biblioteca de apoio

- [ ] Criar entidade e fluxo de ebooks por curso ou por criador
- [ ] Implementar leitor básico ou download controlado
- [ ] Organizar biblioteca pessoal do aluno

### Flashcards e revisão

- [ ] Definir modelo pedagógico de flashcards
- [ ] Permitir criação automática ou manual por curso
- [ ] Exibir revisão por repetição simples em primeira versão

### Financeiro do criador, versão real

- [ ] Criar visão de repasses por AdSense e doações
- [ ] Criar painel com saldo, histórico e previsão
- [ ] Preparar terreno para loja e monetização futura

### Critério de saída da Fase 2

- [ ] O aluno passa a estudar dentro da plataforma mesmo sem vídeo em reprodução
- [ ] A retenção aumenta pela utilidade diária do ecossistema
- [ ] O criador começa a perceber valor operacional além da publicação do curso

### KPIs da Fase 2

- [ ] DAU e WAU de estudo
- [ ] Sessões com uso de Bíblia
- [ ] Sessões com criação de notas
- [ ] Retenção D7 e D30 de alunos ativos
- [ ] Frequência de retorno por aluno

## Fase 3, comunidade e retenção

Objetivo: aumentar recorrência, vínculo entre alunos e criadores e efeito de rede leve.

### Fórum por curso e aula

- [ ] Criar discussões por curso
- [ ] Criar discussões por aula
- [ ] Definir moderação básica, denúncia e regras de convivência

### Perguntas ao professor

- [ ] Permitir envio de perguntas pelos alunos
- [ ] Organizar caixa de entrada do criador
- [ ] Definir SLA esperado e estados da pergunta

### Notificações

- [ ] Implementar notificações in-app
- [ ] Preparar notificações por e-mail com Resend
- [ ] Disparar eventos de novos cursos, respostas, certificados e anúncios importantes

### Reengajamento

- [ ] Criar automações simples de retorno para alunos inativos
- [ ] Criar lembretes de continuidade de curso
- [ ] Criar estímulos para retomada de trilhas incompletas

### Critério de saída da Fase 3

- [ ] A plataforma possui canais mínimos de interação
- [ ] O aluno recebe motivos claros para voltar
- [ ] O criador ganha mecanismos de relacionamento com sua comunidade

### KPIs da Fase 3

- [ ] Taxa de retorno semanal
- [ ] Número médio de interações por curso
- [ ] Tempo médio de resposta do criador
- [ ] Redução de abandono em cursos iniciados

## Fase 4, monetização e operação financeira

Objetivo: monetizar sem quebrar a promessa central de acesso gratuito ao conteúdo educacional.

### Premium do aluno

- [ ] Definir proposta de valor do premium, remoção de anúncios, benefícios extras, talvez ferramentas avançadas
- [ ] Integrar Stripe para assinatura recorrente
- [ ] Criar paywall e regras de acesso
- [ ] Implementar gating de anúncios para premium

### Premium do criador

- [ ] Definir valor do plano para criadores
- [ ] Vincular benefícios reais, remoção de anúncios no espaço do criador, recursos extras, analytics avançado
- [ ] Integrar cobrança recorrente e gestão de status

### Loja do criador

- [ ] Definir escopo da loja, ebooks, materiais, recursos, consultorias ou outros itens digitais
- [ ] Implementar catálogo, checkout e pedidos
- [ ] Aplicar comissão da plataforma

### Doações e gorjetas

- [ ] Evoluir sistema atual de doações para fluxo Stripe real
- [ ] Exibir histórico e status de pagamento com clareza
- [ ] Permitir mensagens de apoio com moderação básica

### Plano instituição

- [ ] Definir packaging da oferta B2B
- [ ] Criar gestão de membros e relatórios
- [ ] Preparar faturamento e operação para instituições

### Administrativo e relatórios financeiros

- [ ] Criar visão administrativa de receita, repasses, comissões e inadimplência
- [ ] Criar relatórios para fechamento mensal
- [ ] Preparar dados para contabilidade e auditoria operacional

### Critério de saída da Fase 4

- [ ] O produto monetiza em pelo menos três linhas, anúncios, premium e transações
- [ ] Criadores percebem benefício financeiro claro
- [ ] Instituições têm oferta inicial utilizável

### KPIs da Fase 4

- [ ] MRR de aluno premium
- [ ] MRR de criador premium
- [ ] Receita líquida da plataforma
- [ ] GMV da loja e de doações
- [ ] ARPU por tipo de usuário

## Fase 5, escala, diferenciação e moat

Objetivo: transformar a plataforma em infraestrutura educacional teológica de longo prazo.

### White label

- [ ] Definir arquitetura de branding, domínio, identidade e configuração por tenant
- [ ] Garantir isolamento de conteúdo, membros, pagamentos e analytics
- [ ] Criar onboarding próprio para instituição white label

### IA tutor

- [ ] Definir escopo seguro da IA, resumo, revisão, perguntas sobre aula, plano de estudo
- [ ] Implementar RAG ou base semântica apenas quando conteúdo estiver organizado
- [ ] Definir limites, custo por uso e moderação

### Gamificação

- [ ] Criar sistema de trilhas, metas, streaks e marcos sem parecer infantil
- [ ] Reforçar disciplina e progresso com linguagem institucional

### Biblioteca ampla

- [ ] Unificar cursos, ebooks, notas, Bíblia, flashcards e materiais em uma biblioteca pessoal
- [ ] Criar busca robusta e filtros por tema, autor, nível e tradição

### PWA e continuidade

- [ ] Implementar PWA com foco em leitura e continuidade
- [ ] Avaliar offline parcial para notas, biblioteca e progresso local

### Acessibilidade e conformidade

- [ ] Fortalecer acessibilidade em contraste, navegação por teclado, leitores de tela e motion reduction
- [ ] Formalizar LGPD, termos, política de privacidade e retenção de dados

### Critério de saída da Fase 5

- [ ] A plataforma passa de produto funcional para ecossistema defensável
- [ ] Há diferenciação real frente a LMSs genéricos
- [ ] Instituições e criadores passam a ver a Resenha do Teólogo como infraestrutura, não só ferramenta

## Frentes transversais obrigatórias

Estas frentes acompanham todas as fases.

### Design system e experiência

- [ ] Consolidar tokens visuais, componentes e padrões em documentação viva
- [ ] Garantir consistência entre dark institucional e light editorial
- [ ] Validar responsividade real em mobile, tablet e desktop
- [ ] Garantir `prefers-reduced-motion` em toda animação relevante
- [ ] Usar ícones SVG limpos, nunca emojis

### Qualidade e testes

- [ ] Definir estratégia mínima de testes para fluxos críticos
- [ ] Cobrir autenticação, publicação, matrícula, progresso, quiz, certificado e pagamento
- [ ] Criar checklist de QA por release
- [ ] Adotar ambiente de preview para validação antes de produção

### Segurança e isolamento

- [ ] Revisar todas as queries e mutations para evitar vazamento entre tenants
- [ ] Garantir autorização por perfil em todo endpoint sensível
- [ ] Proteger dados financeiros e administrativos
- [ ] Preparar trilha de auditoria para eventos críticos

### Conteúdo e growth

- [ ] Estruturar estratégia de SEO e páginas públicas por curso, autor e tema
- [ ] Integrar funil com YouTube, Instagram, Facebook e e-mail
- [ ] Criar estratégia de creators seed para atrair os primeiros professores
- [ ] Criar pipeline de onboarding de novos criadores

### Operação e suporte

- [ ] Definir playbook para suporte de aluno, criador e instituição
- [ ] Criar rotina de monitoramento de bugs e incidentes
- [ ] Organizar base de ajuda e FAQs
- [ ] Definir fluxo de moderação e resposta a abuso

## Roadmap por entregas concretas

### Janela 1, colocar o núcleo de pé

- [ ] Guards de autenticação e perfis
- [ ] Dashboard único condicional por perfil
- [ ] Catálogo público e página de curso
- [ ] Player anti-skip
- [ ] Matrícula e progresso
- [ ] Quiz e certificado

### Janela 2, tornar a plataforma um ambiente de estudo

- [ ] Bíblia integrada
- [ ] Caderno digital
- [ ] Biblioteca e ebooks
- [ ] Flashcards
- [ ] Financeiro real do criador

### Janela 3, aumentar retenção e relacionamento

- [ ] Fórum
- [ ] Perguntas ao professor
- [ ] Notificações
- [ ] Reengajamento

### Janela 4, abrir monetização robusta

- [ ] Premium aluno
- [ ] Premium criador
- [ ] Loja do criador
- [ ] Plano instituição
- [ ] Relatórios financeiros

### Janela 5, escalar e criar barreira competitiva

- [ ] White label
- [ ] IA tutor
- [ ] Biblioteca unificada
- [ ] PWA
- [ ] Acessibilidade e conformidade avançadas

## Dependências críticas

- [ ] Sem autenticação, perfil e guards sólidos, as áreas por persona ficam frágeis
- [ ] Sem player e progresso sólidos, não há base confiável para quiz e certificado
- [ ] Sem catálogo e matrícula, não há experiência real do aluno
- [ ] Sem analytics, fica difícil priorizar evolução e monetização
- [ ] Sem isolamento multi-tenant rigoroso, o projeto corre risco operacional sério
- [ ] Sem fluxo de pagamentos bem modelado, premium, doações, loja e plano instituição viram dívida sistêmica

## Mapa de KPIs do negócio

### Aquisição

- [ ] Visitantes únicos
- [ ] Taxa de cadastro por origem
- [ ] Taxa de ativação de criadores
- [ ] Custo por aquisição, quando mídia paga existir

### Ativação

- [ ] Criadores que publicam o primeiro curso em até 7 dias
- [ ] Alunos que iniciam a primeira aula em até 24 horas
- [ ] Alunos que concluem a primeira aula

### Retenção

- [ ] Retenção D1, D7, D30
- [ ] Número de sessões por semana por aluno
- [ ] Percentual de alunos com uso recorrente de Bíblia e notas

### Monetização

- [ ] RPM ou receita de anúncios por mil sessões
- [ ] Conversão para premium aluno
- [ ] Conversão para premium criador
- [ ] Receita de doações
- [ ] GMV da loja
- [ ] Receita por instituição

### Qualidade do aprendizado

- [ ] Taxa de conclusão de curso
- [ ] Média de quiz por curso
- [ ] Percentual de certificados emitidos
- [ ] Tempo médio até conclusão

## Riscos principais e mitigação

### Escopo excessivo cedo demais

- [ ] Mitigar com foco estrito em Fase 1 antes de abrir novas superfícies pesadas

### Complexidade multi-tenant subestimada

- [ ] Mitigar com revisão de permissão e dados antes de cada nova entidade

### Monetização antes de valor percebido

- [ ] Mitigar validando retenção e utilidade antes de forçar premium agressivo

### Experiência visual inconsistente entre áreas

- [ ] Mitigar consolidando design system e revisão visual por release

### Dependência externa de APIs e provedores

- [ ] Mitigar isolando integrações por adapters e mantendo fallback sempre que possível

### Operação financeira mais complexa que o esperado

- [ ] Mitigar separando claramente fluxo de assinatura, repasse, comissão e doação desde o desenho de dados

## Critérios de prontidão para lançamento público

- [ ] Autenticação confiável
- [ ] Dashboard único funcional para criador e aluno
- [ ] Base institucional funcional dentro do mesmo dashboard
- [ ] Catálogo público de cursos
- [ ] Matrícula e progresso funcionando
- [ ] Quiz e certificado funcionando
- [ ] Logs de erro e métricas mínimas ativas
- [ ] Política de privacidade, termos e suporte básico publicados
- [ ] Pelo menos um grupo piloto de criadores e alunos validando fluxo real

## Plano de execução dos próximos 90 dias

### Mês 1

- [ ] Executar Sprint 0
- [ ] Fechar guards, autenticação real e sincronização Clerk + Convex
- [ ] Entregar catálogo público e páginas de curso
- [ ] Consolidar dashboard único condicional por perfil e iniciar módulo real do aluno

### Mês 2

- [ ] Entregar matrícula, player anti-skip e progresso
- [ ] Entregar quiz por aula
- [ ] Entregar certificado e área de certificados
- [ ] Rodar piloto fechado com primeiros criadores e alunos

### Mês 3

- [ ] Corrigir gargalos do piloto
- [ ] Iniciar Bíblia integrada e caderno digital
- [ ] Instrumentar analytics de ativação e retenção
- [ ] Preparar roadmap operacional da monetização

## Próximos planos que devem ser escritos

- [ ] Plano detalhado da Fase 1, núcleo de aprendizagem
- [ ] Plano técnico do player anti-skip
- [ ] Plano de arquitetura do dashboard único condicional por perfil
- [ ] Plano de catálogo público e páginas de curso
- [ ] Plano de certificados e engine de aprovação
- [ ] Plano de monetização com Stripe, AdSense e repasses

## Definição de sucesso

Este projeto estará no caminho certo quando três coisas acontecerem ao mesmo tempo:

- [ ] O aluno percebe a plataforma como lugar sério de estudo, não apenas como repositório de vídeos
- [ ] O criador percebe a plataforma como canal de alcance, organização e monetização
- [ ] A operação da Resenha do Teólogo consegue crescer sem quebrar identidade, dados ou sustentabilidade financeira
