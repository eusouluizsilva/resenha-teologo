# Plano Mestre — Resenha do Teólogo

> Documento único, acionável e consolidado. Substitui contexto.md, fases-do-projeto.md e qualquer outro documento de planejamento.
> Atualizar sempre que uma decisao for tomada ou uma fase for concluida.
> Ultima atualizacao: 2026-04-19

---

## 1. Visao e Posicionamento

**Missao:** ser a maior plataforma de ensino teologico do mundo.

**Posicionamento:** plataforma gratuita para alunos, com monetizacao inteligente via AdSense e assinaturas, onde criadores de conteudo e instituicoes publicam cursos e constroem audiencia sem pagar para entrar.

**Frase de posicionamento:**
"Uma plataforma de ensino teologico gratuito onde criadores e instituicoes publicam conteudo, monetizam sua audiencia e os alunos estudam com profundidade em um ecossistema completo."

**Publico principal:**
- Criadores de conteudo com audiencia propria (YouTube, Instagram, podcasts)
- Igrejas, seminarios, faculdades teologicas e instituicoes de EAD
- Alunos de teologia no Brasil (primeiro), depois en/es

**Dono:** Luiz Carlos da Silva Junior — Massachusetts, EUA.

---

## 2. Modelo de Negocio

### Regra absoluta
Todo conteudo e gratuito para alunos. Nenhum curso e vendido.

### Fontes de receita da plataforma

| Fonte | Quem paga | Como funciona |
|-------|-----------|---------------|
| Google AdSense | Google | Ads para usuarios do plano free |
| Assinatura Premium (aluno) | Aluno | Mensalidade para remover ads |
| Mensalidade (criador sem ads) | Criador | Remove ads do espaco dele |
| Comissao sobre vendas da loja | Criador | % sobre cada produto vendido na loja |
| Gorjetas / Super Chat | Aluno | Contribuicao direta ao criador em uma aula |

### Como os criadores ganham

1. **Repasse do AdSense:** % dos ganhos do AdSense gerado dentro dos cursos deles, proporcional a visualizacoes dentro do espaco do criador.
2. **Loja propria:** produtos digitais ou fisicos vendidos na plataforma, com comissao retida pela plataforma.

### Valores de referencia (a confirmar)

| Plano | Valor mensal |
|-------|-------------|
| Aluno Premium (sem ads) | R$ 29 |
| Criador sem ads | R$ 99 |
| Plano Igreja / Instituicao | a definir |

---

## 3. Perfis de Usuario

### Aluno
- Acesso gratuito a todos os cursos
- Ve anuncios (plano free) ou paga para remover (premium)
- Dashboard com: progresso por curso, notas por aula, media geral, certificados, gamificacao

### Criador de Conteudo
- Cadastra cursos e aulas via URL de video externo
- Cria questionarios por aula
- Ve relatorios de alunos, notas e repasse do AdSense
- Pode ter loja propria de produtos

### Instituicao (Igreja, Seminario, Faculdade)
- Plano B2B
- Matricula membros em massa
- Acompanha progresso de todos os membros
- Relatorios por membro

### Admin (Luiz)
- Gestao completa da plataforma
- Configuracao do AdSense e repasses
- Gestao de planos, assinaturas e usuarios
- Relatorios financeiros globais

---

## 4. Stack Tecnica

```
Frontend:  React 19 + Vite + TypeScript + Tailwind CSS 4
Backend:   Convex (real-time database + serverless functions)
Auth:      Clerk (email/senha + Google + Facebook)
Deploy:    Vercel
DNS:       GoDaddy (migrar para Cloudflare na Fase 5 — white label)
Storage:   Cloudflare R2 (ebooks, imagens — Fase 2)
Email:     Resend (transacional) + Google Workspace (profissional)
Pagamentos: Stripe (Fase 4)
Animacoes: Framer Motion
i18n:      react-i18next (PT primeiro, EN e ES depois)
PDF:       jsPDF ou Puppeteer (certificados e caderno)
Biblia:    API.Bible + Bolls.life + GetBible
IA Tutor:  Anthropic (Fase 5)
```

---

## 5. Infraestrutura Atual — Status (2026-04-19)

| Servico | Status | Observacao |
|---------|--------|-----------|
| Convex dev | Ativo | unique-mastiff-494.convex.cloud |
| Convex prod | Ativo | blessed-platypus-993.convex.cloud — schema deployado |
| Clerk Production | Ativo | resenhadoteologo.com — DNS verificado, SSL emitido |
| Vercel v18 | Parcial | Primeiro deploy funciona, segundo falha (bug CLI sem integracao GitHub) |
| GitHub | Ativo | https://github.com/willyfvn/resenha-teologo |
| GitHub Actions | Bugado | Workflow ativo mas deploy trava no segundo push |
| DNS resenhadoteologo.com | Ativo | Aponta para Vercel (ainda v17 antigo, precisa migrar para v18) |
| DNS resenhadoteologo.com.br | Ativo | Aponta para Vercel |
| Google OAuth | Ativo | Configurado para Clerk Production |
| Resend | Pendente | Nao configurado |
| Cloudflare R2 | Pendente | Nao configurado |
| Stripe | Pendente | Fase 4 |
| Google AdSense | Pendente | Fase 2 |
| YouTube Data API | Pendente | Necessario para Fase 1 (duracao dos videos) |
| API.Bible | Pendente | Fase 2 |

### Pendencias criticas de infraestrutura

1. **Vercel deploy definitivo:** instalar GitHub App do Vercel no repo (https://github.com/apps/vercel/installations/new), conectar ao projeto v18, remover GitHub Actions.
2. **Corrigir VITE_CONVEX_URL no Vercel v18:** trocar unique-mastiff-494 por blessed-platypus-993 (prod).
3. **Migrar dominio para v18:** adicionar resenhadoteologo.com ao projeto v18 no painel Vercel.
4. **Resend:** configurar email transacional para boas-vindas e certificados (Fase 1).
5. **YouTube Data API:** necessario para obter duracao real dos videos para o anti-skip.

---

## 6. O Que Foi Construido

### Landing Page (/)
- 10 secoes: hero, stats, como funciona, para criadores, para igrejas, diferenciais (tabela comparativa), biblioteca teologica, planos, CTA final, footer
- Versao nova do ChatGPT/Codex, identidade visual editorial premium

### Autenticacao
- /entrar — login email/senha via Clerk
- /cadastro — selecao de perfil (Aluno / Criador / Instituicao)
- /cadastro/aluno, /cadastro/criador, /cadastro/instituicao — formularios completos
- SSOCallbackPage — le perfil salvo e redireciona para /dashboard

### Dashboard Unificado (/dashboard)
- DashboardLayout — guard de autenticacao, timeout 10s
- DashboardSidebar — nav condicional por perfil + switcher de perfil (salva no Clerk)
- Perfil sempre primeiro item do menu
- Visao geral com stats em tempo real do Convex (criador)

### Area do Criador
- Listagem de cursos com stats
- Novo curso (sem upload de thumbnail — gerada automaticamente do primeiro video)
- Editor de curso completo (modulos e aulas)
- LessonDrawer para adicionar aulas
- EditarAulaPage, EditarInfoCursoPage, EditarCursoPage
- Financeiro, Perfil

### Banco de Dados (Convex)
- Schema: users, courses, modules, lessons, quizzes, enrollments, progress, donations
- Multi-tenant via creatorId em todas as queries
- Cascade delete implementado
- Auto-thumbnail: extrai ID do YouTube da URL do video e usa ytimg.com CDN
- Deployado em producao (blessed-platypus-993)

---

## 7. O Que Falta — Fase 1 (MVP Core)

Ordem exata de execucao:

### 7.1 Infraestrutura (fazer agora antes de codar)
- [ ] Resolver deploy Vercel (GitHub App integration)
- [ ] Corrigir VITE_CONVEX_URL no Vercel v18 para apontar para prod
- [ ] Migrar dominio para v18
- [ ] Configurar Resend (email transacional)
- [ ] Obter YouTube Data API key

### 7.2 Area do Aluno
- [ ] /dashboard/meus-cursos — listagem de cursos matriculados com progresso
- [ ] /dashboard/certificados — certificados emitidos para download
- [ ] Pagina publica de cada curso (landing do curso, matricula gratuita)
- [ ] Player de aula com anti-skip

### 7.3 Player Anti-Skip
- [ ] YouTube IFrame API com controls=0 (sem barra nativa)
- [ ] Overlay customizado: apenas Play, Pause e Volume
- [ ] Rastreamento de tempo assistido a cada 5s via IFrame API
- [ ] Liberar questionario ao atingir 90% do tempo assistido
- [ ] Bloqueio total de avanco: sem clique na barra, sem teclado de avanco

### 7.4 Sistema de Quiz
- [ ] Interface do aluno para responder questionario
- [ ] Calculo de nota por aula (0–10)
- [ ] Calculo da media geral do aluno no curso
- [ ] Barra de progresso de conclusao do curso

### 7.5 Certificado
- [ ] Verificar se media >= 70%
- [ ] Gerar PDF com: nome do aluno, nome do curso, carga horaria, data, assinatura visual
- [ ] Download disponivel no dashboard do aluno
- [ ] Verificacao de autenticidade via QR Code ou URL unica

### 7.6 Dashboard do Aluno (completar)
- [ ] VisaoGeralPage — adaptar para mostrar conteudo correto por perfil
- [ ] Stats de progresso consolidado

### 7.7 Area da Instituicao
- [ ] /dashboard/membros — listagem de membros matriculados
- [ ] /dashboard/relatorios — progresso por membro

### 7.8 Email Transacional (Resend)
- [ ] Boas-vindas apos cadastro
- [ ] Confirmacao de matricula em curso
- [ ] Certificado emitido
- [ ] Lembrete de aluno inativo apos 7 dias

### 7.9 AdSense (basico)
- [ ] Instalar tag do AdSense no index.html
- [ ] Exibir ads apenas para usuarios sem assinatura premium
- [ ] Nao exibir ads para criadores com mensalidade ativa

---

## 8. Fases de Desenvolvimento

### Fase 1 — MVP Core (atual)
> Objetivo: plataforma funcional com ciclo completo aluno, aula, questionario e certificado.

**Entrega:** aluno se cadastra, acessa curso, assiste video sem pular, responde quiz, recebe certificado. Criador publica curso e aulas. AdSense instalado.

**Estimativa:** 3 a 4 semanas

**O que falta:** ver secao 7 acima.

---

### Fase 2 — Ecossistema de Estudo
> Objetivo: transformar a plataforma no melhor ambiente de estudo teologico do mundo.

- [ ] Biblia integrada durante a aula (painel lateral retratil)
  - 1 traducao inicial: ACF
  - Busca por livro, capitulo e versiculo
  - Cache das passagens no Convex
- [ ] Mais traducoes: NVI, ARA, KJV, NIV, ESV, Hebraico, Grego, Interlinear
- [ ] eBooks por aula (upload PDF/ePub pelo criador, leitura inline)
- [ ] Caderno Digital do Aluno
  - Anotacoes por aula vinculadas ao timestamp do video
  - Sublinhar versiculo com cores
  - Destaques nos ebooks salvos automaticamente
  - Exportar caderno em PDF
- [ ] Flashcards com revisao espacada (estilo Anki)
- [ ] Dashboard de repasse do AdSense
  - Calculo automatico por criador via AdSense API
  - Criador cadastra chave PIX
  - Admin ve relatorio de repasses a pagar

**Estimativa:** 3 a 4 semanas

---

### Fase 3 — Comunidade
> Objetivo: engajamento, retencao e relacao aluno-professor.

- [ ] Forum por curso (comentarios, likes, respostas, fixar, resposta oficial)
- [ ] Forum por aula
- [ ] Perguntas ao professor vinculadas a aula ou timestamp
- [ ] Notificacoes em tempo real (sininho)
  - Aluno: resposta do professor, novo comentario, nova aula
  - Professor: nova pergunta, novo aluno, novo comentario
- [ ] Automacao de reengajamento: email via Resend para inativos ha 7+ dias

**Estimativa:** 2 a 3 semanas

---

### Fase 4 — Monetizacao e Assinaturas
> Objetivo: ativar todas as fontes de receita.

- [ ] Plano Premium para alunos (Stripe — remove ads)
- [ ] Plano Premium para criadores (Stripe — remove ads do espaco deles)
- [ ] Plano Igreja/Instituicao (B2B — matricula em lote + relatorios)
- [ ] Loja do criador (produtos digitais e fisicos, checkout Stripe, comissao da plataforma)
- [ ] Gorjetas / Super Chat (aluno contribui para o criador em uma aula)
- [ ] Relatorios financeiros completos para o Admin
- [ ] Stripe Connect para automatizar repasse ao criador

**Estimativa:** 3 a 4 semanas

---

### Fase 5 — Escala e White Label
> Objetivo: crescimento acelerado e aquisicao de instituicoes.

- [ ] White label completo (subdominio por criador: criador.resenhadoteologo.com)
  - Vercel Middleware para roteamento por hostname
  - Cloudflare para DNS dinamico
  - Personalizacao visual: logo, cor de destaque, banner
- [ ] Gamificacao avancada: XP, niveis, ranking, badges detalhados, perfil publico
- [ ] IA Teologica (Tutor): LLM responde duvidas baseadas no conteudo antes de ir ao professor
- [ ] Modo Estudo Profundo: silencia notificacoes, expande Biblia + caderno
- [ ] Busca semantica nos cadernos e ebooks (Convex Vector Search)
- [ ] PWA / Offline First: caderno e Biblia funcionam sem internet
- [ ] Biblioteca teologica geral da plataforma
- [ ] Acessibilidade: leitor de tela, legendas automaticas
- [ ] LGPD / Compliance: termos, consentimento, exclusao de conta

**Estimativa:** 4 a 6 semanas

---

## 9. Identidade Visual — Resumo Executivo

Documento completo: `identidade-visual.md`

**Direcao:** editorial teologico premium com estrutura SaaS moderna.

**Deve parecer:** solida, inteligente, reverente, moderna, editorial, confiavel.
**Nao deve parecer:** startup generica, EAD comum, pagina de infoproduto, religioso caricat.

### Paleta

```
Background Dark:   #0F141A
Panel Dark:        #151B23
Card Dark:         #1B2430
Border Dark:       #2A313B
Primary Navy:      #1E2430
Accent Orange:     #F37E20   (maximo 5% da interface)
Background Light:  #FFFFFF
Background Edit:   #F7F5F2
Text Dark:         #111827
```

### Tipografia

- Titulos: Plus Jakarta Sans
- Interface: Inter
- Editorial/versiculos/certificados: Source Serif 4 (uso pontual)

### Modos

- Dark: landing, dashboards, areas institucionais
- Light: area do aluno, leitor biblico, caderno, forum

### Animacoes (Framer Motion)

Fast 160ms / Normal 240ms / Moderate 360ms / Slow 520ms
Variacoes: fadeUp, fadeIn, staggerContainer, pageEnter, pageExit

### Regras absolutas

- Nunca emojis — usar icones SVG Heroicons stroke
- Nunca travessao — usar virgula, ponto ou dois-pontos
- Laranja so em: CTA principal, estado ativo, progresso, badges. Sem areas grandes laranja.
- Composicao editorial, nao empilhamento de componentes
- Hierarquia tipografica forte em toda pagina

### Logos

| Arquivo | Quando usar |
|---------|-------------|
| LOGO ICONE PRETA.png | Favicon, app icon, fundos claros |
| LOGO ICONE BRANCA.png | Secoes CTA, fundos dark sem container |
| LOGO RETANGULO LETRA BRANCA.png | Navbar, footer, qualquer fundo dark |
| LOGO RETANGULO LETRA PRETA.png | Fundos claros (area do aluno, light mode) |
| LOGO QUADRADA LETRA BRANCA.png | OG image, formatos quadrados dark |
| LOGO QUADRADA - LETRA PRETA.png | Formatos quadrados em fundo claro |

---

## 10. Decisoes Tecnicas Tomadas

| Decisao | Solucao |
|---------|---------|
| Videos | URL externa (YouTube/Vimeo) — sem upload |
| Thumbnail do curso | Gerada automaticamente do primeiro video (ytimg.com CDN) |
| Anti-skip | YouTube IFrame API controls=0 + overlay Play/Pause + rastreamento cada 5s + libera com 90% |
| Certificado | Media minima 70%, PDF via jsPDF ou Puppeteer |
| Repasse AdSense | AdSense API por URL de curso, calculo automatico, PIX manual no inicio, Stripe Connect ao escalar |
| Auth | Clerk (email/senha por padrao, OAuth configurado mas nao exibido na UI) |
| Backend | Convex (real-time + serverless, multi-tenant via creatorId) |
| Deploy | Vercel (integracao GitHub nativa como solucao definitiva) |
| DNS/White Label | Cloudflare + Vercel Middleware (Fase 5) |
| Storage | Cloudflare R2 (Fase 2) |
| Email transacional | Resend |
| Email profissional | Google Workspace (hello@resenhadoteologo.com) |
| Pagamentos | Stripe (PIX + boleto + cartao) |
| Biblia | API.Bible + Bolls.life + GetBible |
| IA Tutor | Anthropic (Fase 5) |
| Idiomas | react-i18next — PT primeiro, depois EN e ES |

---

## 11. Perguntas em Aberto (decidir quando chegar a fase)

- [ ] Subdominio para white label: formato exato (criador.resenhadoteologo.com ou outro)
- [ ] Percentual exato de repasse do AdSense para criadores
- [ ] Percentual de comissao sobre vendas da loja
- [ ] Quais plataformas de video aceitar alem do YouTube (Vimeo, Panda, outros)
- [ ] Processador secundario de pagamento (Mercado Pago para PIX de menor fricao)
- [ ] Estrategia de gamificacao detalhada (sistema de pontos, niveis, ranking global vs por curso)
- [ ] Aprovacao de cursos: qualquer criador publica ou ha moderacao?
- [ ] Politica DMCA para conteudos dos criadores
- [ ] Modelo de suporte ao usuario (email, chat, self-service)
- [ ] Valores finais dos planos (Premium aluno R$29, Criador sem ads R$99 — confirmar)

---

## 12. Historico de Decisoes

| Data | Decisao |
|------|---------|
| 2026-04-18 | Nao fazer upload de video — URL externa |
| 2026-04-18 | Todo conteudo gratuito para alunos |
| 2026-04-18 | Certificado exige media minima de 70% |
| 2026-04-18 | Player com trava anti-skip (so play/pause) |
| 2026-04-18 | Repasse de % do AdSense para criadores por acessos |
| 2026-04-18 | Stack: React 19 + Vite + Convex + Clerk |
| 2026-04-18 | Identidade visual: editorial teologico premium com estrutura SaaS moderna |
| 2026-04-18 | Regra permanente: nunca travessao, nunca emojis |
| 2026-04-18 | Login via Clerk: Google + Facebook + Email/senha (Apple e GitHub descartados) |
| 2026-04-18 | Dominio: resenhadoteologo.com (GoDaddy) |
| 2026-04-18 | Plataforma em 3 idiomas: PT, EN, ES via react-i18next |
| 2026-04-18 | Email: hello@resenhadoteologo.com via Google Workspace |
| 2026-04-18 | Email transacional: Resend (noreply@resenhadoteologo.com) |
| 2026-04-19 | Dashboard unificado /dashboard para todos os perfis |
| 2026-04-19 | Troca de perfil salva via Clerk unsafeMetadata |
| 2026-04-19 | Thumbnail do curso gerada automaticamente do primeiro video |
| 2026-04-19 | Convex prod deployado: blessed-platypus-993 |
| 2026-04-19 | Clerk Production ativo com dominio resenhadoteologo.com |
| 2026-04-19 | Google e Facebook OAuth removidos da UI por ora (email/senha apenas) |
| 2026-04-19 | Vercel v18 criado, bug de segundo deploy ativo, solucao pendente (GitHub App integration) |
