# Resenha do Teólogo

Plataforma SaaS multi-tenant de ensino teológico gratuito. Cursos, blog editorial, fórum, certificados e bíblia integrada, em pt-BR.

Site: https://resenhadoteologo.com

## Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS 4, Framer Motion
- **Backend**: Convex (DB realtime + serverless functions)
- **Auth**: Clerk (Google, Facebook, email/senha)
- **Pagamentos**: Stripe (Live mode)
- **Email**: Resend (`hello@resenhadoteologo.com`)
- **Storage**: Cloudflare R2 (capas, materiais)
- **Deploy**: Vercel (auto-deploy do `main`)
- **DNS**: GoDaddy

## Desenvolvimento

```bash
npm install
npm run dev          # Vite local em http://localhost:5173
npx convex dev       # subir Convex em paralelo (em outro terminal)
```

Variáveis de ambiente em `.env.local` (template em `credenciais.md`, gitignored).

## Scripts

- `npm run dev` — servidor Vite
- `npm run build` — TS check + build (gera `dist/`)
- `npm run check` — só `tsc -b --noEmit`
- `npm run lint` — ESLint
- `npm run sitemap` — regenera `dist/sitemap*.xml`

## Deploy

- `git push origin main` → Vercel rebuilda e promove automaticamente.
- `npx convex deploy --yes` → push schema/functions para produção (`blessed-platypus-993`).

## Estrutura

```
convex/         backend (queries, mutations, actions, crons, schema)
src/pages/      rotas (App.tsx)
src/components/ UI compartilhada
src/lib/        utilitários (auth, brand, motion, seo, R2…)
public/         assets estáticos (logos, sw.js, manifest)
api/prerender.ts SSR para crawlers (OG/SEO)
scripts/        geradores (sitemap)
```

## Documentação interna

- `CLAUDE.md` — instruções permanentes do projeto (lidas pelo Claude Code)
- `AGENTS.md` — instruções para outros assistentes
- `contexto.md` — visão geral e histórico de decisões
- `fases-do-projeto.md` — plano em 5 fases
- `identidade-visual.md` — design system completo
- `lista-de-pendencias.md` — auditoria + roadmap de correções
- `credenciais.md` — template `.env` (no `.gitignore`)

## Convenções

- **Multi-tenant**: toda query filtra por `creatorId` ou `institutionId`.
- **Sem emojis e sem travessões** em UI, copy, emails ou notificações.
- **Vídeos só por URL externa** (YouTube/Vimeo); upload direto não.
- **Cursos sempre gratuitos**. Monetização vem de Stripe (assinaturas, certificado pago, doações), AdSense e loja.
- **Certificado**: emitido com média ≥ 70%.

## Status

Fase 1 (auth + cursos + player + quiz + certificado + dashboard) operacional. Stripe Live ativo. Cloudflare R2 plugado em curso/aula/blog. Próximo grande bloco: AdSense ao vivo + repasse a criadores.
