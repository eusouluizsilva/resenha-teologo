# Fases de Desenvolvimento — Resenha do Teólogo

> Ordem de construção baseada em: validar o modelo mais rápido, menor risco técnico primeiro, receita o mais cedo possível.

---

## Fase 1 — MVP Core (Base da Plataforma)
> Objetivo: plataforma funcional com o ciclo completo aluno → aula → questionário → certificado

### O que será construído
- [ ] Autenticação completa (Clerk) — cadastro, login, recuperação de senha
- [ ] 3 perfis de usuário: Admin, Criador de Conteúdo, Aluno
- [ ] Dashboard do Criador:
  - Criar curso (título, descrição, thumbnail)
  - Adicionar aulas com URL de vídeo externo (YouTube, Vimeo)
  - Criar questionário por aula (múltipla escolha)
  - Ver número de alunos matriculados
- [ ] Player de vídeo com anti-skip:
  - YouTube IFrame API com `controls=0` (sem barra de progresso)
  - Overlay customizado com apenas Play / Pause / Volume
  - Rastreamento de tempo assistido real (verificação a cada 5s)
  - Libera questionário ao atingir 90% do tempo assistido
- [ ] Sistema de questionários:
  - Abre automaticamente após concluir o vídeo
  - Calcula nota por aula
  - Calcula média geral do aluno no curso
- [ ] Certificado automático em PDF:
  - Gerado quando aluno atinge 70% de média
  - Nome do aluno, curso, data, carga horária
- [ ] Dashboard do Aluno:
  - Cursos matriculados
  - % de conclusão por curso
  - Nota por aula e média geral
  - Certificados emitidos para download
- [ ] Área pública de cursos (landing page de cada curso)
- [ ] Google AdSense — instalação inicial dos ads

---

## Fase 2 — Ecossistema de Estudo
> Objetivo: transformar a plataforma no melhor ambiente de estudo teológico do mundo

### O que será construído
- [ ] Bíblia integrada durante a aula:
  - Painel lateral retrátil
  - 1 tradução inicial (ACF)
  - Busca por livro, capítulo e versículo
  - Cache das passagens no Convex (reduz chamadas à API)
- [ ] Mais traduções da Bíblia:
  - Português: NVI, ARA, NAA
  - Inglês: KJV, NIV, ESV
  - Textos originais: Hebraico (AT) e Grego (NT)
  - Modo interlinear (original + tradução lado a lado)
- [ ] eBooks por aula:
  - Upload de PDF/ePub pelo criador
  - Leitura inline na plataforma
  - Download disponível para o aluno
- [ ] Caderno Digital do Aluno:
  - Anotações por aula vinculadas ao timestamp do vídeo
  - Clica na anotação → vídeo volta naquele momento
  - Sublinhado colorido em versículos da Bíblia
  - Destaques nos eBooks salvos automaticamente
  - Dashboard do caderno com todas as anotações por curso
  - Exportar caderno em PDF
- [ ] Flashcards:
  - Aluno transforma anotação em flashcard
  - Sistema de revisão espaçada (estilo Anki)
- [ ] Dashboard de repasse do AdSense:
  - Admin vê ganhos por URL de curso (via AdSense API)
  - Sistema calcula % de repasse por criador automaticamente
  - Criador cadastra chave PIX no perfil
  - Admin vê relatório de repasses a pagar

---

## Fase 3 — Comunidade e Comunicação
> Objetivo: criar engajamento, retenção e relação aluno-professor

### O que será construído
- [ ] Fórum por curso:
  - Comentários públicos visíveis a todos os matriculados
  - Qualquer aluno pode responder
  - Professor pode fixar e marcar "resposta oficial"
  - Sistema de likes/votos
- [ ] Fórum por aula:
  - Mesmo sistema, específico para cada aula
- [ ] Perguntas ao professor:
  - Aluno faz pergunta vinculada a uma aula ou timestamp
  - Professor responde pelo dashboard
- [ ] Notificações em tempo real (sininho):
  - Aluno: resposta do professor, resposta no fórum, nova aula
  - Professor: nova pergunta, novo comentário, novo aluno matriculado
- [ ] Automação de reengajamento:
  - E-mail automático via Resend para alunos inativos há 7+ dias
  - Push notification (PWA) para lembrar de continuar o curso

---

## Fase 4 — Monetização e Assinaturas
> Objetivo: ativar todas as fontes de receita da plataforma

### O que será construído
- [ ] Plano Premium para alunos:
  - Assinatura mensal via Stripe (remove ads)
  - Gerenciamento de assinatura no dashboard do aluno
- [ ] Plano Premium para criadores:
  - Mensalidade via Stripe (remove ads do espaço deles)
  - Gerenciamento no dashboard do criador
- [ ] Plano Igreja / Instituição (B2B):
  - Pastor/Coordenador compra assinatura em lote
  - Matricula membros em massa
  - Dashboard de acompanhamento de progresso de todos os membros
- [ ] Loja do criador (básica):
  - Cadastro de produtos (digitais e físicos)
  - Checkout via Stripe (PIX + boleto + cartão)
  - Plataforma retém % por transação
  - Criador vê relatório de vendas
- [ ] Doações / Gorjetas:
  - Aluno pode enviar contribuição para o criador em uma aula
  - Plataforma retém % da gorjeta
- [ ] Relatórios financeiros completos para Admin:
  - Total AdSense + repasses por criador
  - Total de assinaturas ativas
  - Total de comissões de loja
  - Projeção de receita

---

## Fase 5 — Escala e White Label
> Objetivo: crescimento acelerado e aquisição de instituições

### O que será construído
- [ ] White label completo:
  - Subdomínio para cada criador (`criador.resenhadoteologo.com.br`)
  - Vercel Middleware para roteamento por hostname
  - Personalização visual: logo, cores, banner
  - Cloudflare para gestão de DNS dinâmico
- [ ] Gamificação avançada:
  - Sistema de níveis e XP completo
  - Ranking entre alunos (por curso e global)
  - Conquistas e badges detalhados
  - Perfil público do aluno com histórico de conquistas
- [ ] IA Teológica (Tutor):
  - LLM responde dúvidas básicas baseadas no conteúdo da aula
  - Só encaminha ao professor se a IA não souber
  - Integrado ao sistema de perguntas
- [ ] Modo Estudo Profundo:
  - Silencia notificações
  - Expande Bíblia + Caderno para 80% da tela
  - Foco total no estudo
- [ ] Busca semântica:
  - Convex Vector Search nos cadernos e eBooks
  - Aluno busca termos em todas as suas anotações
- [ ] PWA / Offline First:
  - Caderno digital funciona offline
  - Bíblia funciona offline (versões baixadas)
  - Sincroniza quando voltar online
- [ ] Biblioteca teológica geral:
  - Acervo de comentários bíblicos, dicionários, livros
  - Acervo público da plataforma + acervo privado por criador
- [ ] Acessibilidade:
  - Suporte a leitores de tela
  - Legendas automáticas nos vídeos
- [ ] LGPD / Compliance:
  - Termos de uso e privacidade
  - Consentimento de dados
  - Fluxo de exclusão de conta

---

## Resumo Visual das Fases

```
FASE 1 — MVP Core
└── Auth + Cursos + Player Anti-Skip + Quiz + Certificado + Dashboard

FASE 2 — Ecossistema de Estudo
└── Bíblia + eBooks + Caderno Digital + Flashcards + AdSense Repasse

FASE 3 — Comunidade
└── Fórum + Notificações + Perguntas ao Professor + Reengajamento

FASE 4 — Monetização
└── Assinaturas + Loja + Doações + Plano Igreja + Relatórios

FASE 5 — Escala
└── White Label + IA + Gamificação + PWA + Biblioteca + Busca Semântica
```

---

## Decisões Técnicas Já Tomadas

| Decisão | Solução |
|---------|---------|
| Anti-skip | YouTube IFrame API `controls=0` + overlay Play/Pause + rastreamento de tempo |
| Vídeos | URL externa (YouTube/Vimeo) — sem upload |
| Repasse AdSense | AdSense API por URL → cálculo automático → PIX manual → Stripe Connect ao escalar |
| Auth | Clerk |
| Backend | Convex (real-time + serverless) |
| Deploy | Vercel |
| DNS/White Label | Cloudflare + Vercel Middleware |
| Storage (eBooks/imagens) | Cloudflare R2 |
| Email | Resend |
| Pagamentos | Stripe (PIX + boleto + cartão) |
| PDF (certificado/caderno) | jsPDF ou Puppeteer |
| Bíblia | API.Bible + Bolls.life + GetBible |

---

## Estimativa de Tempo por Fase

| Fase | Estimativa | Resultado |
|------|-----------|-----------|
| Fase 1 | 3–4 semanas | Plataforma ao ar com ciclo completo |
| Fase 2 | 3–4 semanas | Diferencial teológico ativo |
| Fase 3 | 2–3 semanas | Comunidade engajada |
| Fase 4 | 3–4 semanas | Receita ativa |
| Fase 5 | 4–6 semanas | Escala e institucional |
