# Plano Completo — Resenha do Teólogo (Plataforma de Ensino Teológico)

## Contexto

Estou construindo uma plataforma SaaS de ensino teológico multi-tenant chamada **Resenha do Teólogo**. O dono mora nos EUA (Massachusetts) mas o público-alvo principal é o Brasil. A visão é ser a maior plataforma de ensino teológico do mundo.

A inspiração é uma combinação de:
- **YouTube** (modelo de monetização via ads + repasse para criadores)
- **Hotmart/Teachable** (plataforma de cursos com dashboard para criadores)
- **White label** (cada criador/instituição tem seu espaço personalizado)

---

## Modelo de Negócio

**REGRA FUNDAMENTAL: Nenhum curso é vendido. Todo conteúdo é gratuito para os alunos.**

### Fontes de receita da plataforma

| Fonte | Como funciona |
|-------|---------------|
| Google AdSense | Ads exibidos para usuários free — Google paga a plataforma |
| Assinatura Premium (aluno) | Aluno paga mensalidade para remover propagandas |
| Mensalidade (criador) | Criador paga para não ter ads no espaço dele |
| Comissão sobre vendas da loja | % sobre cada venda na loja do criador (cobre taxas + margem) |

### Como os criadores de conteúdo monetizam

1. **Repasse do AdSense** — recebem % dos ganhos do AdSense gerado dentro dos cursos deles, calculado por acessos e interações com ads no espaço deles
2. **Loja própria** — cada criador tem sua loja na plataforma para vender produtos digitais ou físicos. A plataforma retém uma comissão por transação.

---

## Perfis de Usuário

### Aluno
- Acesso gratuito a todos os conteúdos
- Vê propagandas do AdSense (plano free)
- Pode assinar plano premium para remover ads
- Dashboard com:
  - % de conclusão por curso
  - Notas por vídeo e média geral
  - Gamificação (XP, badges, conquistas)
  - Caderno digital pessoal
  - Certificados emitidos

### Criador de Conteúdo / Professor
- Cadastra cursos gratuitamente
- Dashboard com:
  - Gerenciamento de cursos e aulas (via URL de vídeo externo)
  - Criação de questionários por aula
  - Número de alunos matriculados
  - Relatório de ganhos e repasses do AdSense
  - Gestão da loja própria
- Pode pagar mensalidade para remover ads do seu espaço
- Espaço white label personalizável

### Admin (dono da plataforma)
- Gestão completa da plataforma
- Configuração de AdSense e cálculo de repasses
- Gestão de planos, assinaturas e comissões
- Relatórios financeiros globais

---

## Dinâmica das Aulas (Vídeos)

- A plataforma **não faz upload de vídeos** — usa URL externa (YouTube, Vimeo, etc.)
- Player com **trava anti-skip**: aluno só pode dar Play e Pause — não pode avançar
- Vídeo precisa ser assistido **100%** para liberar o questionário
- Após concluir o vídeo, questionário abre automaticamente

---

## Sistema de Questionários e Certificação

- Cada aula tem um questionário criado pelo criador
- Questionário só libera após 100% do vídeo assistido
- Notas somam para a **média total do aluno no curso**
- **Média mínima para emitir certificado: 70%**
- Aluno pode navegar pelo curso sem responder, mas não emite certificado sem a média
- Certificado gerado automaticamente em PDF com dados do aluno e do curso

---

## Gamificação

- Sistema de XP (pontos de experiência) por aula concluída e questionário respondido
- Badges e conquistas (ex: "Primeiro certificado", "7 dias seguidos", "100 aulas concluídas")
- Barra de progresso por curso
- Ranking entre alunos (opcional, pode ser desativado pelo criador)
- Níveis do aluno na plataforma (iniciante, intermediário, avançado, etc.)

---

## Biblioteca Teológica (diferencial principal)

### Visão
Não apenas cursos — um ecossistema completo de estudo bíblico. O aluno tem tudo que precisa em um só lugar.

### Bíblia integrada nas aulas
- Painel lateral durante a aula com acesso às traduções
- Versões em português: ACF, NVI, ARA, NAA e outras
- Versões em inglês: KJV, NIV, ESV e outras
- Textos originais: Hebraico (Antigo Testamento) e Grego (Novo Testamento)
- Modo interlinear: original + tradução lado a lado
- Aluno escolhe sua tradução preferida

### Fontes de dados (APIs gratuitas)
- API.Bible — mais de 2.500 traduções em centenas de idiomas
- Bolls.life API — textos originais grego e hebraico
- GetBible API — versões em português

### eBooks e materiais por aula
- Criador faz upload de PDF/ePub como material complementar de cada aula
- Aluno lê inline ou faz download
- Destaques no eBook são salvos automaticamente no caderno do aluno

### Biblioteca geral da plataforma
- Acervo de livros teológicos, comentários bíblicos, dicionários teológicos
- Biblioteca do criador — cada criador pode manter seu próprio acervo no curso

---

## Caderno Digital do Aluno

- Anotações por aula vinculadas ao **timestamp do vídeo** (clica → vídeo volta naquele momento)
- Anotações em versículos da Bíblia com sublinhado colorido
- Destaques nos eBooks salvos automaticamente
- Flashcards: aluno transforma anotação em flashcard com revisão espaçada (estilo Anki)
- Dashboard do caderno com todas as anotações organizadas por curso
- Exportar caderno completo em PDF

---

## Sistema de Comunicação e Comunidade

### Notificações em tempo real (sininho)
**Aluno recebe notificação quando:**
- Professor responde sua pergunta
- Alguém responde seu comentário no fórum
- Nova aula publicada em curso que está matriculado

**Professor/Criador recebe notificação quando:**
- Aluno faz uma pergunta vinculada a uma aula
- Novo comentário no fórum do seu curso
- Novo aluno matriculado no curso

### Perguntas ao Professor
- Aluno faz pergunta vinculada diretamente a uma aula ou timestamp
- Professor responde pelo dashboard
- Notificação em tempo real para ambos

### Fórum por Curso e por Aula
- Cada curso tem fórum geral
- Cada aula tem seu próprio fórum
- Comentários públicos visíveis a todos os matriculados
- Qualquer aluno pode responder outros alunos
- Professor pode fixar comentários importantes
- Sistema de likes/votos
- Professor pode marcar "resposta oficial"

---

## White Label

- Cada criador/instituição pode personalizar visualmente seu espaço
- Subdomínio próprio (ex: `joao.resenhadoteologo.com.br`)
- Loja própria dentro da plataforma
- Identidade visual personalizável (logo, cores)

---

## Loja Online

- Loja geral da plataforma
- Cada criador tem sua loja própria (white label)
- Produtos: materiais digitais, físicos, e-books, recursos de estudo
- Processador de pagamento: Stripe (dono nos EUA) + suporte a PIX e boleto para Brasil
- Plataforma retém comissão por transação

---

## Monetização AdSense

- Ads exibidos para todos os usuários free (alunos e visitantes)
- Aluno premium: paga mensalidade e não vê ads
- Criador premium: paga mensalidade e não tem ads no espaço dele
- Receita do AdSense é calculada por espaço/criador e repassada proporcionalmente

---

## Stack Técnica

```
Frontend:   React 19 + Vite + TypeScript + Tailwind CSS 4
Backend:    Convex (BaaS — real-time database + serverless functions)
Auth:       Clerk
Deploy:     Vercel
DNS/CDN:    Cloudflare (subdomínios white label)
Storage:    Cloudflare R2 ou AWS S3 (eBooks, materiais, imagens da loja)
Email:      Resend (transacional)
Pagamento:  Stripe (PIX + boleto + cartão)
Analytics:  Google Analytics 4 + AdSense API
PDF:        jsPDF ou Puppeteer (certificados e caderno)
```

---

## Infraestrutura e Custos

| Ferramenta | Plano inicial | Custo |
|------------|--------------|-------|
| Vercel | Free | $0 |
| Convex | Free (1M calls/mês) | $0 |
| Clerk | Free (até 10k usuários) | $0 |
| Cloudflare | Free | $0 |
| Resend | Free (3k emails/mês) | $0 |
| Google AdSense | — | Te paga |
| Stripe | Sem mensalidade | % por transação |
| Domínio | — | ~$15/ano |
| **Total para lançar** | | **~$15/ano** |

Escala com uso — paga só quando crescer.

---

## Estratégia de Marketing e Aquisição

### Público-alvo B2B (foco principal)
1. **Criadores de conteúdo** com audiência própria (YouTube, Instagram, podcast)
2. **Universidades e seminários com EAD** que querem plataforma complementar
3. **Pastores e líderes religiosos** com comunidades ativas

### Por que focar em criadores e instituições
- Criador traz sua audiência pronta — efeito multiplicador imediato
- Universidade pode trazer milhares de alunos de uma vez
- Reduz custo de aquisição de alunos (CAC) drasticamente
- Cada criador ativo = mais views AdSense + potencial de loja

### Proposta de valor para o criador
- Zero custo para entrar
- Monetiza pelo AdSense sem investir nada
- Loja própria inclusa
- Infraestrutura completa sem precisar construir nada

---

## Projeção de Receita

Para atingir $10.000/mês bruto (cenário moderado):

| Fonte | Meta | Receita |
|-------|------|---------|
| 700 alunos premium | $6/mês cada | $4.200 |
| 80 criadores premium | $20/mês cada | $1.600 |
| AdSense | 1M views/mês | $1.500 |
| Comissão lojas | $27k em vendas | $2.700 |
| **Total** | | **~$10.000** |

---

## Perguntas em Aberto (decisões futuras)

- [ ] Valor exato das mensalidades (aluno premium e criador premium)
- [ ] % de comissão sobre vendas da loja
- [ ] % de repasse do AdSense para criadores
- [ ] Domínio da plataforma já registrado?
- [ ] Quais plataformas de vídeo aceitar além do YouTube?
- [ ] Estratégia de gamificação detalhada (níveis, ranking)
- [ ] Detalhes do white label (subdomínio vs. domínio próprio do criador)

---

## Pedido para o ChatGPT / Gemini

Com base neste plano completo, preciso das suas contribuições em:

1. **O que está faltando?** — Funcionalidades, fluxos ou cenários que não foram considerados
2. **Riscos do modelo de negócio** — O que pode dar errado? Como mitigar?
3. **Sugestões de melhorias** — No modelo de monetização, na experiência do usuário, na estratégia de aquisição
4. **Arquitetura técnica** — Sugestões para a stack escolhida ou alternativas melhores
5. **Priorização** — Se você fosse construir isso, o que desenvolveria primeiro para validar o modelo mais rápido?
6. **Diferenciais competitivos** — Como fortalecer o posicionamento frente a Hotmart, Udemy, plataformas EAD tradicionais?
