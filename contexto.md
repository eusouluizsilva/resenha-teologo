# Contexto do Projeto — Resenha do Teólogo (Plataforma de Ensino)

> Arquivo de referência completo. Atualizar sempre que novas ideias ou decisões forem tomadas.

---

## Visão Geral

Plataforma de ensino online multi-tenant (SaaS) estilo white label, com marketplace de cursos, loja online, gamificação e monetização via Google AdSense + assinaturas premium.

Inspiração: YouTube (modelo de monetização) + Hotmart/Teachable (plataforma de cursos) + white label por criador.

---

## Modelo de Negócio

> **IMPORTANTE:** Nenhum curso é vendido na plataforma. Todo conteúdo é gratuito para os alunos.

### Fontes de Receita da Plataforma
| Fonte | Quem paga | Como funciona |
|-------|-----------|---------------|
| Google AdSense | Google paga a plataforma | Ads exibidos para usuários free |
| Assinatura Premium (aluno) | Aluno | Mensalidade para remover propagandas |
| Mensalidade (criador) | Criador de conteúdo | Paga para não ter ads no espaço dele |
| Comissão sobre vendas da loja | Criador (% descontada) | % sobre cada venda de produto na loja — cobre taxas + margem da plataforma |

### Monetização dos Criadores de Conteúdo
Criadores **não vendem cursos**. Monetizam de duas formas:

1. **Repasse do AdSense**
   - Recebem % dos ganhos do AdSense gerado dentro dos cursos deles
   - Baseado em: visualizações de ads + cliques dentro do espaço do criador
   - Plataforma calcula o total do AdSense e repassa a % proporcional ao criador

2. **Loja Online própria**
   - Cada criador pode ter sua loja na plataforma (produtos digitais, físicos, etc.)
   - Plataforma retém uma comissão sobre cada venda (cobre taxas de pagamento + margem)
   - Criador recebe o restante

### O que NÃO existe na plataforma
- Venda de cursos (cursos são sempre gratuitos)
- Paywall de conteúdo

---

## Perfis de Usuário

### 1. Aluno
- Acesso gratuito a todos os conteúdos (tudo é free por padrão)
- Vê propagandas do AdSense (plano free)
- Pode assinar plano premium para remover propagandas
- Tem dashboard próprio com:
  - % de conclusão de cada curso matriculado
  - Nota individual por vídeo
  - Média total de aproveitamento
  - Gamificação (pontos, badges, progresso)
  - Certificados emitidos

### 2. Criador de Conteúdo
- Cadastra cursos na plataforma
- Tem dashboard próprio com:
  - Input de vídeos (via URL — YouTube, Vimeo, etc.)
  - Criação de questionários por vídeo
  - Número de alunos matriculados
  - Relatório de ganhos e repasses
- Pode ter loja própria white label na plataforma
- Opção de pagar mensalidade para remover ads do seu espaço

### 3. Admin (Luiz — dono da plataforma)
- Gestão completa da plataforma
- Configuração de AdSense
- Gestão de repasses para criadores
- Gestão de planos e assinaturas
- Relatórios financeiros

---

## Dinâmica dos Vídeos

- A plataforma **não faz upload de vídeos** — usa URL externa (YouTube, Vimeo, etc.)
- Isso evita sobrecarga de armazenamento e custo de infraestrutura
- Player com **trava anti-skip**: o aluno só pode dar Play e Pause — não pode avançar o vídeo
- O vídeo precisa ser assistido **100% para liberar o questionário**
- Após concluir o vídeo, abre automaticamente o **questionário** sobre aquele vídeo

---

## Sistema de Questionários e Certificação

- Cada vídeo tem um questionário criado pelo criador de conteúdo
- O questionário só é liberado após 100% do vídeo assistido
- As notas somam para a **média total do aluno no curso**
- **Média mínima para certificado: 70%**
- O aluno pode pular vídeos e não responder questionários, MAS:
  - Não consegue emitir o certificado sem a média mínima
  - O sistema trava a emissão do certificado sem os requisitos cumpridos

---

## Gamificação

- Dashboard do aluno com:
  - Nota por vídeo (visual e clara)
  - Média total do curso (barra de progresso)
  - Sistema de pontos / XP
  - Badges / conquistas
  - % de conclusão por curso
- Estratégia de gamificação a definir (pontos, níveis, rankings)

---

## White Label

- Cada criador pode ter sua "versão" da plataforma (subdomínio ou personalização visual)
- Loja própria do criador dentro da plataforma
- Detalhes técnicos de subdomínio a definir

---

## Biblioteca Teológica

### Visão
Ser a **maior plataforma de ensino teológico do mundo** — não apenas cursos, mas um ecossistema completo de estudo bíblico.

### Recursos da Biblioteca
- **Traduções da Bíblia** acessíveis durante a aula (painel lateral ou popup)
  - Múltiplas versões: ACF, NVI, ARA, NAA, KJV, NIV, ESV, etc.
  - Textos originais: Hebraico (AT) e Grego (NT)
  - Interlinear (original + tradução lado a lado)
- **eBooks por aula** — criador pode fazer upload de material complementar (PDF, ePub)
- **Biblioteca geral da plataforma** — acervo de livros teológicos, comentários bíblicos, dicionários
- **Biblioteca do criador** — cada criador pode ter seu próprio acervo dentro do curso

### Integração durante a aula
- Aluno assiste ao vídeo e tem painel lateral com:
  - Versículos referenciados na aula
  - Tradução de escolha do aluno
  - eBook/material da aula para download ou leitura inline
  - Anotações pessoais do aluno

### Caderno Digital do Aluno
- Anotações por aula vinculadas ao timestamp do vídeo
- Clica na anotação → vídeo volta exatamente naquele momento
- Anotações na Bíblia: sublinhar versículos com cores + comentário pessoal
- Destaques nos eBooks das aulas salvos automaticamente no caderno
- Flashcards: aluno transforma anotação em flashcard com revisão espaçada
- Exportar caderno em PDF
- Dashboard do aluno com todas as anotações organizadas por curso

---

## Sistema de Comunicação e Comunidade

### Notificações (sininho)
- **Aluno recebe notificação quando:**
  - Professor responde sua pergunta
  - Alguém responde seu comentário no fórum
  - Nova aula publicada em curso matriculado
- **Professor/Criador recebe notificação quando:**
  - Aluno faz uma pergunta vinculada a uma anotação ou aula
  - Novo comentário no fórum do seu curso
  - Novo aluno matriculado

### Perguntas ao Professor
- Aluno faz pergunta diretamente vinculada a uma aula ou anotação
- Professor responde pela dashboard dele
- Notificação em tempo real para ambos os lados

### Fórum por Curso e por Aula
- Cada curso tem seu fórum geral
- Cada aula tem seu fórum específico
- Comentários públicos visíveis a todos os alunos matriculados
- Qualquer aluno pode responder comentários de outros
- Professor pode responder e fixar comentários importantes
- Sistema de likes/votos nos comentários
- Professor pode marcar uma resposta como "resposta oficial"

---

### Fontes de dados para Bíblia (APIs gratuitas)
- **API.Bible** (bible.api.bible) — mais de 2.500 traduções em centenas de idiomas
- **Bolls.life API** — textos originais grego e hebraico
- **GetBible API** — várias versões em português

---

## Loja Online

- Loja geral da plataforma
- Cada criador pode ter sua loja própria (white label)
- Produtos: cursos, e-books, materiais digitais (a definir)
- Processador de pagamento: a definir (Stripe / Mercado Pago)

---

## Monetização AdSense

- Propagandas exibidas para usuários do plano free (alunos e visitantes)
- Aluno pode pagar assinatura premium para remover ads
- Criador pode pagar mensalidade para remover ads do espaço dele
- Receita do AdSense é parcialmente repassada ao criador conforme acessos

---

## Stack Técnica Atual

```
Frontend:  React 19 + Vite + TypeScript + Tailwind CSS 4
Backend:   Convex (BaaS — real-time database + functions)
Auth:      Clerk
Deploy:    a definir
```

---

## Infraestrutura e Serviços

### Domínio e DNS
- Domínio: `resenhadoteologo.com` (já registrado no GoDaddy)
- DNS: migrar GoDaddy → Cloudflare (necessário para white label funcionar)
- Plataforma em 3 idiomas: Português (primeiro), Inglês e Espanhol (depois)
- Multilingual via `react-i18next` no frontend

### Email profissional
- Principal: `hello@resenhadoteologo.com`
- Alias: `contato@resenhadoteologo.com` (redireciona para hello@)
- Provedor: Google Workspace ($6/mês) — integra com Analytics e AdSense
- Email transacional da plataforma: Resend (`noreply@resenhadoteologo.com`)

### Ordem de cadastro definida
1. Vercel (já conecta com GitHub)
2. Cloudflare (adicionar domínio + pegar nameservers)
3. GoDaddy (trocar nameservers para Cloudflare)
4. Google Workspace (email profissional)
5. Convex (banco de dados)
6. Clerk (autenticação)
7. Resend (email transacional — precisa domínio verificado)
8. Stripe (pagamentos)
9. Cloudflare R2 (storage — mesmo painel)
10. Google Cloud (YouTube API + AdSense API)
11. Google AdSense (precisa site no ar para aprovar)
12. Google Analytics (após site no ar)
13. API.Bible (bíblia integrada)
14. Anthropic / OpenAI / Gemini (fase 5 — IA tutor)

### Arquivos criados no projeto
- `contexto.md` — visão geral e histórico de decisões
- `fases-do-projeto.md` — plano completo de desenvolvimento em 5 fases
- `credenciais.md` — template .env + guia de cadastro (protegido no .gitignore)
- `plano-do-projeto.md` — documento completo para consulta externa (ChatGPT/Gemini)
- `identidade-visual.md` — design system completo
- `CLAUDE.md` — instrução permanente para o Claude Code

## Estado atual do desenvolvimento

### Páginas criadas
- `src/pages/LandingPage.tsx` — landing page completa com 8 seções
- `src/pages/SignInPage.tsx` — tela de login (Google + Facebook + email/senha)
- `src/pages/SignUpPage.tsx` — seleção de perfil (Aluno / Criador / Instituição)

### Componentes criados
- `src/components/layout/Navbar.tsx` — navbar responsiva com menu mobile

### Infraestrutura
- `src/lib/motion.ts` — tokens de animação (fadeUp, fadeIn, staggerContainer, etc.)
- `src/index.css` — design tokens via @theme do Tailwind 4
- `vite.config.ts` — alias @/ configurado
- `index.html` — favicon adaptativo dark/light

### Seções da landing page (em ordem)
1. Hero — headline + dois CTAs + badges
2. Stats — 4 números de impacto
3. Como funciona — 3 cards com ícones SVG
4. Para criadores — benefícios + dashboard mockado
5. Para igrejas e instituições — 6 cards
6. Diferenciais — tabela comparativa vs concorrentes + 6 cards de argumento
7. Biblioteca teológica — preview da Bíblia integrada
8. Planos — Gratuito / Premium aluno / Criador sem ads
9. CTA final
10. Footer — logo + redes sociais + Silva Growth + termos

---

## Identidade Visual
> Documento completo em `identidade-visual.md` — ler sempre antes de criar qualquer componente.

**Direção estética oficial:** editorial teológico premium com estrutura SaaS moderna

### Resumo das decisões visuais
- **Modo dual:** Dark (institucional/landing/dashboards) + Light (estudo/leitura/caderno)
- **Paleta principal:** Navy profundo (#1E2430), Laranja estratégico (#F37E20), Ivory (#F7F5F2)
- **Fundo dark:** #0F141A | Fundo light: #FFFFFF | Editorial: #F7F5F2
- **Laranja:** apenas 5% da interface — botões primários, CTAs, progresso, badges
- **Tipografia:** Plus Jakarta Sans (títulos) + Inter (interface) + Source Serif 4 (editorial pontual)
- **Animações:** Framer Motion — tokens Fast/Normal/Moderate/Slow, variantes fadeUp/fadeIn/staggerContainer
- **Regra:** sempre elegante > chamativo, sempre legível > pesado, sempre editorial > genérico

---

## Perguntas Pendentes (a responder quando chegar a hora)

- [ ] Subdomínio para white label? (ex: `criador.resenhadoteologo.com.br`)
- [ ] Processador de pagamento: Stripe, Mercado Pago, outro?
- [ ] O projeto atual no git é o ponto de partida ou recomeça do zero?
- [ ] Domínio da plataforma já registrado?
- [ ] % de comissão sobre vendas
- [ ] Valor das mensalidades (aluno premium, criador sem ads)
- [ ] Estratégia de gamificação detalhada (pontos, níveis, ranking)
- [ ] Quais plataformas de vídeo aceitar além do YouTube?

---

## Histórico de Decisões

| Data | Decisão |
|------|---------|
| 2026-04-18 | Não fazer upload de vídeo — usar URL externa |
| 2026-04-18 | Tudo gratuito para alunos — monetizar via AdSense + assinaturas |
| 2026-04-18 | Certificado exige 70% de média mínima |
| 2026-04-18 | Player com trava anti-skip (só play/pause) |
| 2026-04-18 | Repasse de % do AdSense para criadores por acessos |
| 2026-04-18 | Stack: React + Convex + Clerk (já existente no projeto) |
| 2026-04-18 | Cursos NÃO são vendidos — todo conteúdo é gratuito |
| 2026-04-18 | Criadores monetizam via repasse do AdSense + loja própria |
| 2026-04-18 | Plataforma cobra comissão sobre vendas da loja (taxas + margem) |
| 2026-04-18 | Domínio: resenhadoteologo.com (GoDaddy → migrar DNS para Cloudflare) |
| 2026-04-18 | Plataforma em 3 idiomas: PT (primeiro), EN e ES depois — react-i18next |
| 2026-04-18 | Email: hello@resenhadoteologo.com via Google Workspace |
| 2026-04-18 | Email transacional: Resend (noreply@resenhadoteologo.com) |
| 2026-04-18 | Identidade visual definida — editorial teológico premium com estrutura SaaS moderna |
| 2026-04-18 | CLAUDE.md criado — instrução permanente do projeto para o Claude Code |
| 2026-04-18 | Login via Clerk: Google + Facebook + Email/senha (Apple e GitHub descartados) |
| 2026-04-18 | Projeto inicializado: React 19 + Vite + TypeScript + Tailwind 4 + Framer Motion |
| 2026-04-18 | Estrutura criada: src/pages, src/components/layout, src/lib/motion.ts |
| 2026-04-18 | Landing page construída com 6 seções + Navbar responsiva |
| 2026-04-18 | Páginas criadas: LandingPage, SignInPage, SignUpPage (seleção de perfil) |
| 2026-04-18 | Design tokens configurados no index.css via @theme do Tailwind 4 |
| 2026-04-18 | Motion tokens criados em src/lib/motion.ts (fadeUp, fadeIn, staggerContainer, etc.) |
| 2026-04-18 | Logos mapeadas: branca (dark bg) / preta (light bg) / ícone (favicon/mobile) |
| 2026-04-18 | Logos atualizadas: LOGO ICONE BRANCA.png e LOGO ICONE PRETA.png substituem logo_icone.png |
| 2026-04-18 | Favicon adaptativo: ICONE PRETA no modo claro, ICONE BRANCA no modo escuro (prefers-color-scheme) |
| 2026-04-18 | Tamanho das logos triplicado em toda a plataforma (navbar h-24, footer h-20, login h-28) |
| 2026-04-18 | Redes sociais adicionadas no footer: YouTube, Instagram, Facebook com links reais |
| 2026-04-18 | Seção de planos adicionada: Gratuito (R$0), Premium aluno (R$29/mês), Criador sem ads (R$99/mês) |
| 2026-04-18 | Seção de diferenciais adicionada: tabela comparativa vs Hotmart/YouTube/EAD + 6 cards de argumentos |
| 2026-04-18 | Hero atualizado: gratuito para todos (alunos, criadores, igrejas, instituições) + monetize desde o dia 1 |
| 2026-04-18 | Rodapé: "Desenvolvido por Silva Growth" com link para silvagrowth.com |
| 2026-04-18 | REGRA PERMANENTE: nunca usar travessao (—) em nenhum texto da plataforma |
| 2026-04-18 | REGRA PERMANENTE: nunca usar emojis, substituir por icones SVG Heroicons |

---

## Estratégia de Marketing / Aquisição

### Público-alvo principal (B2B — trazer para a plataforma)
- **Criadores de conteúdo** com audiência própria (YouTube, Instagram, etc.)
- **Universidades e instituições com EAD** que querem uma plataforma complementar
- Foco: quem já tem audiência e quer monetizar sem construir infraestrutura própria

### Por que essa estratégia é inteligente
- Criador traz a audiência dele junto — efeito multiplicador
- Universidade traz centenas/milhares de alunos de uma vez
- Reduz custo de aquisição de alunos (CAC) drasticamente
- Cada criador/instituição = múltiplos alunos + views de AdSense + potencial de loja

### Canais de aquisição (a definir)
- Propaganda direcionada a criadores de conteúdo
- Abordagem direta a instituições EAD
- Programa de indicação entre criadores

---

## Contribuições Externas (ChatGPT + Gemini)

### Pontos em comum nos dois (alta prioridade)
- **Anti-skip com YouTube** — solução definida: usar `controls=0` no YouTube IFrame API para esconder completamente a barra de progresso e controles nativos. Construir overlay customizado com apenas Play/Pause + Volume. Rastrear tempo assistido real via IFrame API (a cada 5s). Libera questionário com 90-95% do tempo assistido.
- **MVP precisa ser enxuto** — não lançar tudo junto. Fases claras de desenvolvimento
- **AdSense não deve ser o pilar principal** no início — tratar como receita complementar escalável
- **Separação por creatorId** deve ser obrigatória em todas as queries desde o início (segurança multi-tenant)

### Funcionalidades faltando (levantadas por ambos)
- PWA / Offline First — caderno e Bíblia funcionando sem internet
- Fluxo de moderação de fórum e comentários
- Política de direitos autorais dos materiais dos criadores (DMCA)
- Onboarding guiado do criador (aprovação de cursos)
- LGPD / Privacidade / Termos de uso
- Automação de e-mail para alunos inativos (Resend — reengajamento após 7 dias)
- Prevenção de fraude em certificados
- Política de suporte e reembolso para a loja
- Lógica objetiva e documentada do repasse do AdSense (hoje ainda conceitual)

### Sugestões de melhorias aceitas
- **Planos para Igrejas (B2B):** pastor compra assinatura "Igreja" e matricula membros em lote, acompanhando progresso de todos
- **Doações / Super Chat:** alunos podem enviar gorjetas em aulas específicas (plataforma retém %)
- **IA Teológica (Tutor):** LLM responde dúvidas básicas baseadas no conteúdo antes de enviar ao professor
- **Modo Estudo Profundo:** silencia notificações e expande Bíblia + caderno para 80% da tela
- **Cache das passagens bíblicas** no Convex para reduzir chamadas às APIs externas
- **Convex Vector Search** para busca semântica nos cadernos e eBooks

### Frase de posicionamento da plataforma (sugestão ChatGPT)
> "Uma plataforma de ensino teológico gratuito, onde criadores e instituições publicam conteúdo, monetizam sua audiência, e os alunos estudam com profundidade em um ecossistema completo."

---

## Fases de Desenvolvimento (MVP por fases)

### Fase 1 — MVP Core
1. Cadastro / Login (Clerk)
2. Área do criador — input de curso + aulas via URL
3. Player com trava anti-skip (validar viabilidade técnica)
4. Questionário por aula + cálculo de média
5. Certificado automático em PDF
6. Dashboard do aluno com progresso

### Fase 2 — Ecossistema de Estudo
7. Bíblia integrada (1 tradução primeiro, ex: ACF)
8. Caderno digital + anotações por timestamp
9. eBooks por aula (upload + leitura inline)
10. AdSense + lógica de repasse para criadores

### Fase 3 — Comunidade
11. Fórum por curso e por aula
12. Notificações em tempo real
13. Perguntas ao professor

### Fase 4 — Escala e Monetização
14. White label completo (subdomínios)
15. Loja online por criador
16. Gamificação avançada (ranking, níveis)
17. Planos para Igrejas (B2B)
18. PWA / Offline First

---

## Próximos Passos

- [ ] Luiz termina de descrever todas as ideias iniciais
- [x] Definir lógica de repasse do AdSense — AdSense API por URL de curso → calcula % → PIX manual no início → Stripe Connect para automatizar ao escalar
- [x] Trava anti-skip — rastrear tempo assistido real via YouTube IFrame API + div sobre barra de progresso. Libera com 90-95% assistido.
- [ ] Definir % exata do repasse do AdSense para criadores
- [ ] Criador cadastra chave PIX no perfil para receber repasse
- [ ] Claude faz as perguntas necessárias
- [ ] Definir arquitetura completa
- [ ] Iniciar desenvolvimento pela Fase 1
