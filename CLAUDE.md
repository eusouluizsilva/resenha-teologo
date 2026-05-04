# CLAUDE.md — Instruções Permanentes do Projeto

Este arquivo é lido automaticamente pelo Claude Code em toda sessão. Seguir sempre.

---

## Sobre o Projeto

Plataforma SaaS de ensino teológico multi-tenant chamada **Resenha do Teólogo**.
Dono: Luiz Carlos da Silva Junior, mora em Massachusetts, EUA. Público principal: Brasil.
Visão: ser a maior plataforma de ensino teológico do mundo.
Documento completo do projeto: `docs/contexto.md`
Fases de desenvolvimento: `docs/fases-do-projeto.md`

---

## Stack Técnica

```
Frontend:  React 19 + Vite + TypeScript + Tailwind CSS 4
Backend:   Convex (real-time database + serverless functions)
Auth:      Clerk
Deploy:    Vercel
DNS:       Cloudflare
Storage:   Cloudflare R2
Email:     Resend
Payments:  Stripe
```

---

## Identidade Visual — Resumo Executivo

Documento completo: `docs/identidade-visual.md`, ler sempre antes de criar qualquer componente ou página.

**Direção estética:** editorial teológico premium com estrutura SaaS moderna.

### Cores principais
```
Background Dark:   #0F141A
Panel Dark:        #151B23
Card Dark:         #1B2430
Primary Navy:      #1E2430
Accent Orange:     #F37E20   ← usar com disciplina (5% da interface)
Background Light:  #FFFFFF
Background Editor: #F7F5F2
Text Dark:         #111827
```

### Tipografia
- Títulos: **Plus Jakarta Sans**
- Interface: **Inter**
- Editorial/versículos/certificados: **Source Serif 4** (pontual)

### Autenticação (Clerk)
Métodos ativos: **Google + Facebook + Email/senha**
Apple e GitHub desativados — desnecessários para o público teológico.

### Modos
- **Dark** → landing page, dashboards, áreas institucionais
- **Light** → área do aluno, leitor bíblico, caderno, fórum

### Animações (Framer Motion)
- Tokens: Fast 160ms / Normal 240ms / Moderate 360ms / Slow 520ms
- Variantes: `fadeUp`, `fadeIn`, `staggerContainer`, `pageEnter`, `pageExit`
- Sempre respeitar `prefers-reduced-motion`

### Regra final
> Sempre escolha o mais elegante. Sempre escolha o mais legível. Sempre escolha profundidade editorial sobre genérico de startup.

---

## Regras de Design e Interface

- **NUNCA usar emojis** em nenhuma parte da plataforma. Substituir por ícones SVG limpos (Heroicons stroke style) em containers `bg-[#F37E20]/10` com `text-[#F37E20]`
- **NUNCA usar travessão (—)** em nenhum texto da plataforma, copy, email ou notificação. Usar vírgula, ponto ou dois-pontos. O travessão denuncia texto de IA e prejudica a credibilidade.

## Logos — Mapeamento de Uso

| Arquivo | Quando usar |
|---------|-------------|
| `LOGO ICONE PRETA.png` | Favicon, app icon, fundos claros |
| `LOGO ICONE BRANCA.png` | Seções CTA, sobre fundos dark sem container |
| `LOGO RETANGULO LETRA BRANCA.png` | Navbar, footer, qualquer fundo dark |
| `LOGO RETANGULO LETRA PRETA.png` | Fundos claros (área do aluno, light mode) |
| `LOGO QUADRADA LETRA BRANCA.png` | OG image, formatos quadrados dark |
| `LOGO QUADRADA - LETRA PRETA.png` | Formatos quadrados em fundo claro |

## Redes Sociais
- YouTube: https://www.youtube.com/@ResenhaDoTeólogo
- Instagram: https://www.instagram.com/eusouluizsilva/
- Facebook: https://www.facebook.com/profile.php?id=61574237807743
- Email: hello@resenhadoteologo.com

## Regras de Desenvolvimento

1. **Nunca vender cursos** — todo conteúdo é gratuito para alunos
2. **Multi-tenant desde o início** — todo query no Convex deve filtrar por `creatorId`
3. **Separação de dados obrigatória** — nunca vazar dados entre tenants
4. **Idiomas** — PT primeiro, EN e ES depois via `react-i18next`
5. **Vídeos** — sempre via URL externa (YouTube/Vimeo), nunca upload direto
6. **Anti-skip** — YouTube IFrame API com `controls=0` + overlay Play/Pause + rastreamento de tempo assistido
7. **Certificado** — só emitir com média mínima de 70%
8. **AdSense** — nunca exibir para usuários com assinatura premium ativa

---

## Fases de Desenvolvimento

- **Fase 1 (atual):** Auth + Cursos + Player Anti-Skip + Quiz + Certificado + Dashboard
- **Fase 2:** Bíblia + Caderno Digital + eBooks + AdSense Repasse
- **Fase 3:** Fórum + Notificações + Perguntas ao Professor
- **Fase 4:** Assinaturas + Loja + Plano Igreja + Relatórios Financeiros
- **Fase 5:** White Label + IA Tutor + Gamificação + PWA

---

## Arquivos do Projeto

| Arquivo | Conteúdo |
|---------|---------|
| `docs/contexto.md` | Visão geral, modelo de negócio, histórico de decisões |
| `docs/fases-do-projeto.md` | Plano completo de desenvolvimento em 5 fases |
| `docs/identidade-visual.md` | Design system, cores, tipografia, animações |
| `credenciais.md` | Template .env e guia de cadastros (nunca commitar, raiz) |
| `docs/plano-do-projeto.md` | Documento para consulta externa (ChatGPT/Gemini) |
| `docs/lista-de-pendencias.md` | Pendências consolidadas |
| `docs/auditoria-*.md` | Histórico de auditorias |
