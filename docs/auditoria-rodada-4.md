# Auditoria Rodada 4

Data: 2026-05-01
Escopo: backend (Convex), frontend (React), infraestrutura (Vercel/R2/Resend/CI), segurança (auth/PII/rate-limit)
Contexto: roda APÓS commit `40e1fc2` (Bloco 1 — 8 itens críticos N+1/índices)

---

## Sumário Executivo

| Domínio | P0 | P1 | P2 | P3 | Total | Autônomos | Supervisionados |
|---|---|---|---|---|---|---|---|
| Backend | 3 | 6 | 5 | 1 | 15 | 11 | 4 |
| Frontend | 2 | 4 | 5 | 4 | 15 | 11 | 4 |
| Infra | 3 | 4 | 4 | 1 | 12 | 6 | 6 |
| Segurança | 0 | 2 | 6 | 1 | 9 | 9 | 0 |
| **Total** | **8** | **16** | **20** | **7** | **51** | **37** | **14** |

---

## Backend (Convex)

### [P0] B1: Cascade de deleção em mutation única (account.deleteAccount)
**Arquivo**: `convex/account.ts` (deleteAccount)
**Problema**: Apaga em uma só mutation linhas de ~15 tabelas. Usuário com histórico médio (1k+ progress + 500+ likes + comentários) estoura 8000 writes ou 8s.
**Fix**: Despachar cascata em chunks via `ctx.scheduler.runAfter(0, internal.account.deleteChunk, ...)`.
**Autonomia**: SUPERVISIONADO — toca fluxo LGPD; precisa decidir UX (deleção síncrona vs "em andamento").

### [P0] B2: admin.deleteUserCascade sem chunking
**Arquivo**: `convex/admin.ts` (deleteUserCascade)
**Problema**: Mesmo padrão de B1, pior porque admin pode deletar usuário oficial com milhares de seguidores.
**Fix**: Mover cascata para internalMutation chunked + flag `deleting=true` no users.
**Autonomia**: SUPERVISIONADO — mesma razão de B1.

### [P0] B3: courses.remove e lessons.remove cascata em mutation única
**Arquivo**: `convex/courses.ts:326-421`, `convex/lessons.ts:430-460`
**Problema**: Cascata 10+ tabelas. Curso popular (300 alunos × 30 aulas) estoura.
**Fix**: scheduler chunked + trocar `.filter()` por `.withIndex('by_lesson')` em notebookEntries/courseQuestions/lessonTimestamps (índices faltantes).
**Autonomia**: AUTÔNOMO para índices + filter→withIndex; SUPERVISIONADO para chunking da cascata.

### [P1] B4: certificates.verify faz collect em toda enrollments
**Arquivo**: `convex/certificates.ts:24`
**Problema**: Endpoint público de verificação escaneia toda enrollments por request. O(N) crescente; vetor de DoS.
**Fix**: Adicionar `verificationCode` (índice único) na tabela certificates e fazer lookup direto.
**Autonomia**: SUPERVISIONADO — schema change + migration de certificados existentes.

### [P1] B5: search.globalSearch coleta toda tabela users
**Arquivo**: `convex/search.ts:43`
**Problema**: Cada busca global lê tudo (já reconhecido em comentário).
**Fix**: Usar `withSearchIndex('search_name'/'search_handle')` que já existem no schema.
**Autonomia**: AUTÔNOMO — padrão já usado em `users.searchPublic`.

### [P1] B6: landingHighlights.getCourseTrio sem cap
**Arquivo**: `convex/landingHighlights.ts:226`
**Problema**: Coleta todos cursos publicados a cada hit na home.
**Fix**: `.take(60)` antes de filtrar/ordenar.
**Autonomia**: AUTÔNOMO.

### [P1] B7: admin.listAllCourses N+1 no creator
**Arquivo**: `convex/admin.ts:1261`
**Problema**: Coleta todos cursos + `.unique()` por curso.
**Fix**: `.take(200)` + dedup de `creatorId` antes de buscar usuários.
**Autonomia**: AUTÔNOMO.

### [P1] B8: posts.publish coleta seguidores ilimitados
**Arquivo**: `convex/posts.ts` (publish)
**Problema**: Conta com milhares de seguidores gera leitura única gigante antes do scheduleBulkNotifications.
**Fix**: Paginar leitura: 500 followers/iteração + re-agenda próximo cursor.
**Autonomia**: AUTÔNOMO.

### [P1] B9: lib/autoEnroll coleta todos users em backfill
**Arquivo**: `convex/lib/autoEnroll.ts:142`
**Problema**: `.collect()` users + loop de enrollOnce. Quebra com 500+ usuários.
**Fix**: Scheduler chunked em batches de 100.
**Autonomia**: AUTÔNOMO.

### [P2] B10: account.exportMyData usa .filter() em várias tabelas
**Arquivo**: `convex/account.ts` (exportMyData)
**Problema**: `.filter(q => q.eq(q.field('userId'), ...))` em vez de `withIndex`.
**Fix**: Trocar por `withIndex` onde existem; criar índices faltantes.
**Autonomia**: AUTÔNOMO.

### [P2] B11: admin.broadcastNotification + sendBroadcastNotification duplicados
**Arquivo**: `convex/admin.ts:569-763`
**Problema**: Duas funções coletam todos users e enfileiram notifs sem chunking de read.
**Fix**: Consolidar usando `scheduleBulkNotifications` + cursor paginado.
**Autonomia**: AUTÔNOMO.

### [P2] B12: enrollments N+1 em listByStudent e listStudentsByCreator
**Arquivo**: `convex/enrollments.ts:5-43, 139-300`
**Problema**: Loops sequenciais buscando progress/lessons/users/progress.
**Fix**: `Promise.all` + dedup de userIds.
**Autonomia**: AUTÔNOMO.

### [P2] B13: learningPaths.listMyEnrollments N+1 sequencial
**Arquivo**: `convex/learningPaths.ts:826-861`
**Problema**: Para cada pathEnrollment, loop por item + `.first()` sequencial.
**Fix**: Promise.all + take cap.
**Autonomia**: AUTÔNOMO.

### [P2] B14: sitemapData/indexnow take(5000) users + double .first() N+1
**Arquivo**: `convex/sitemapData.ts:163-188`, `convex/indexnow.ts:181-196`
**Problema**: Por usuário, dois `.first()` (post + course). Worst case 10k round trips.
**Fix**: Queries diretas em posts/courses publicados (já tem index by_published) + dedup authorIds.
**Autonomia**: AUTÔNOMO.

### [P3] B15: lessonMaterials nextOrder via collect
**Arquivo**: `convex/lessonMaterials.ts:62, 112`
**Problema**: Coleta materiais inteiros só para `length+1`.
**Fix**: `.order('desc').first()` no campo `order`.
**Autonomia**: AUTÔNOMO.

---

## Frontend (React)

### [P0] F1: Inputs sem id/htmlFor em todo o sistema (a11y crítico)
**Arquivo**: 38 arquivos, 259 `<label>` mas só 4 `htmlFor=` em todo o `src/`
**Problema**: Labels puramente visuais, screen readers não associam ao input.
**Fix**: Gerar `id` único por input + `htmlFor` correspondente. Transformação mecânica.
**Autonomia**: AUTÔNOMO.

### [P0] F2: ★ unicode em listagem admin (viola identidade)
**Arquivo**: `src/pages/dashboard/admin/CursosAdminPage.tsx:125`
**Problema**: Caractere `★` para rating; regra exige SVG Heroicons stroke.
**Fix**: SVG estrela stroke em container `bg-[#F37E20]/10 text-[#F37E20]`.
**Autonomia**: AUTÔNOMO.

### [P1] F3: Travessões em copy hardcoded visível
**Arquivo**: `src/pages/dashboard/aluno/ComoConseguirCertificadoPage.tsx:94,139`; `EditarAulaPage.tsx:915`; `MembrosPage.tsx:404`
**Problema**: Travessão `—` em texto exibido. Regra explícita proíbe.
**Fix**: Vírgula, ponto ou dois-pontos.
**Autonomia**: AUTÔNOMO.

### [P1] F4: Setas unicode `→ ↑ ↓` na UI
**Arquivo**: 8 arquivos (EditarTrilhaPage, InstituicaoDashboardPage, CursosAdminPage, AdminPage, AllUsersModal, ComentariosAdminPage, ComoConseguirCertificadoPage)
**Problema**: Setas unicode em links/botões; regra exige SVG.
**Fix**: SVG arrow stroke (ChevronRight/ArrowUp/ArrowDown).
**Autonomia**: AUTÔNOMO.

### [P1] F5: VerifyCertificatePage sem useSeo + canonical
**Arquivo**: `src/pages/public/VerifyCertificatePage.tsx`
**Problema**: Página pública indexável sem title/description/canonical/OG. URL compartilhada por alunos e empregadores.
**Fix**: `useSeo({ title, description, url, image })`.
**Autonomia**: AUTÔNOMO.

### [P1] F6: AcceptInvitePage sem PublicPageShell + sem useSeo
**Arquivo**: `src/pages/public/AcceptInvitePage.tsx:11-43`
**Problema**: Renderiza header próprio em vez de `PublicPageShell`. Sem useSeo (deveria ser `noindex`).
**Fix**: `PublicPageShell` + `useSeo({ noindex: true })`.
**Autonomia**: SUPERVISIONADO — decisão sobre noindex e shell.

### [P1] F7: ContactPage sem formulário, só mailtos
**Arquivo**: `src/pages/public/ContactPage.tsx:54-79`
**Problema**: Só lista de mailtos. AdSense/usuários esperam form inline.
**Fix**: Form com nome/email/mensagem persistindo via Convex action + Resend.
**Autonomia**: SUPERVISIONADO — requer copy, fluxo, backend mutation.

### [P2] F8: Empty states textuais "Em breve" sem ilustração
**Arquivo**: `BlogIndexPage:88`; `BlogCategoryPage:96`; `LojaPage:224`; `LandingPage:199-216`
**Problema**: Só "Em breve" sem ilustração SVG nem CTA secundário.
**Fix**: SVG decorativo + CTA.
**Autonomia**: SUPERVISIONADO — requer copy e ilustração.

### [P2] F9: useEffect sem deps em StatusPage (lint suprimido)
**Arquivo**: `src/pages/public/StatusPage.tsx:103-108`
**Problema**: `eslint-disable` para set-state-in-effect. React 19 strict mode roda 2x.
**Fix**: Guarda `ranOnce.current` ou `useEffectEvent`.
**Autonomia**: AUTÔNOMO.

### [P2] F10: Catch silenciados sem feedback ao usuário
**Arquivo**: `src/pages/auth/RegisterPage.tsx:239-251,265-267`
**Problema**: 3 `catch { /* noop */ }`. Falha em recordConsent/enableFunction deixa usuário inconsistente.
**Fix**: `console.error` mínimo; estratégia de retry depende de produto.
**Autonomia**: AUTÔNOMO (logar) + SUPERVISIONADO (retry).

### [P2] F11: PlanosPage com "Em breve" hardcoded em features
**Arquivo**: `src/pages/dashboard/PlanosPage.tsx:64`; `LandingPage.tsx:1043,1054,1094`
**Problema**: Bíblia já está pública em `/biblia`, mas pricing diz "(em breve)".
**Fix**: Remover "(em breve)" e atualizar copy.
**Autonomia**: AUTÔNOMO.

### [P3] F12: aria-live ausente em mutações
**Arquivo**: Sistema inteiro, só 7 ocorrências em 4 arquivos
**Problema**: 38 arquivos com forms/mutations não anunciam sucesso/erro a SR.
**Fix**: `role="status" aria-live="polite"` em containers de feedback.
**Autonomia**: AUTÔNOMO.

### [P3] F13: Rota redirect morta meu-perfil-publico
**Arquivo**: `src/App.tsx:521`
**Problema**: Verificar se ainda há referências; se não, deletar.
**Fix**: Grep + remover se órfã.
**Autonomia**: AUTÔNOMO.

### [P3] F14: useCallback/useMemo ausentes em PerfilPage gigante
**Arquivo**: `src/pages/dashboard/criador/PerfilPage.tsx` (1500+ linhas, 2 useMemo/useCallback)
**Problema**: 55 inputs controlados sem memoização. Cada keystroke re-renderiza tudo.
**Fix**: `useCallback` em handlers, `useMemo` em derived state.
**Autonomia**: AUTÔNOMO.

### [P3] F15: Lista admin sem virtualização (potencial)
**Arquivo**: `AllUsersModal.tsx`, `AlunosPage.tsx`
**Problema**: Sem `react-window`/`react-virtual`. Validar tamanho atual.
**Fix**: Paginação ou virtualização se necessário.
**Autonomia**: SUPERVISIONADO — decisão de UX.

---

## Infraestrutura

### [P0] I1: Convex deploy roda com `--typecheck=disable`
**Arquivo/Sistema**: `.github/workflows/convex-deploy.yml:24`
**Problema**: Deploy de produção pula typecheck. Pode subir backend quebrado.
**Fix**: Trocar para `npx convex deploy` (sem flag) + `npm run check` antes.
**Autonomia**: AUTÔNOMO.

### [P0] I2: CSP permite `unsafe-inline` + `unsafe-eval`
**Arquivo/Sistema**: `vercel.json:35`
**Problema**: `script-src` aceita `unsafe-inline`/`unsafe-eval`. Anula proteção XSS.
**Fix**: Remover `unsafe-eval`; migrar inline para nonce/hash.
**Autonomia**: SUPERVISIONADO — validar Clerk/AdSense em staging.

### [P0] I3: Sem error tracking
**Arquivo/Sistema**: `src/main.tsx`, `convex/*`
**Problema**: Sem ErrorBoundary global, sem Sentry. Erros só em console.
**Fix**: `@sentry/react` no front + capturas em catches estratégicos.
**Autonomia**: SUPERVISIONADO — requer conta + DSN nova.

### [P1] I4: SDKs desatualizados
**Arquivo/Sistema**: `package.json`
**Problema**: convex 1.35.1 → 1.37.0; marked 14 → 18 (breaking renderer).
**Fix**: `npm i convex@^1.37.0`. Marked separado.
**Autonomia**: AUTÔNOMO (convex); SUPERVISIONADO (marked).

### [P1] I5: Sitemap depende de Convex no build
**Arquivo/Sistema**: `scripts/generate-sitemap.mjs`
**Problema**: Prebuild faz queries ao Convex prod. Se Convex cair, sitemap vazio.
**Fix**: Cron Convex semanal escreve sitemap em R2.
**Autonomia**: SUPERVISIONADO — decisão arquitetural.

### [P1] I6: R2 sem `R2_PUBLIC_BASE_URL` + sem CORS/lifecycle
**Arquivo/Sistema**: `convex/r2.ts`, `.env.example`
**Problema**: Imagens públicas usam presigned GET de 7d, gerando regravação semanal e cache miss.
**Fix**: `cdn.resenhadoteologo.com` no R2 + lifecycle 30d em `temp/` + CORS.
**Autonomia**: SUPERVISIONADO — ação no painel Cloudflare.

### [P1] I7: Resend sem fallback nem rate-limit local
**Arquivo/Sistema**: `convex/email.ts`
**Problema**: Sem provider secundário. Resend down → todos os emails falham.
**Fix**: Tabela `emailOutbox` + cron retry + fallback Postmark/SES.
**Autonomia**: SUPERVISIONADO — requer conta secundária.

### [P2] I8: Sem backup automatizado do Convex
**Arquivo/Sistema**: Convex prod
**Problema**: Free não tem PITR. Perda de dados → perda total.
**Fix**: GH Action semanal `npx convex export` → R2 com lifecycle 90d.
**Autonomia**: AUTÔNOMO — `CONVEX_DEPLOY_KEY` já existe.

### [P2] I9: Sem pre-commit hook (lint/typecheck local)
**Arquivo/Sistema**: ausência de `.husky/`
**Problema**: CI roda check, nada bloqueia commit local.
**Fix**: husky + lint-staged + `tsc -b --noEmit` + eslint.
**Autonomia**: AUTÔNOMO.

### [P2] I10: SLA monitoring ausente
**Arquivo/Sistema**: `vercel.json`
**Problema**: Sem healthcheck pra root, sitemap, API Convex.
**Fix**: UptimeRobot/BetterStack pra 4 endpoints.
**Autonomia**: SUPERVISIONADO — conta externa.

### [P2] I11: `manualChunks` separa convex por path frágil
**Arquivo/Sistema**: `vite.config.ts:40`
**Problema**: `id.includes('/convex/')` casa com `node_modules/@convex-dev/*` futuros.
**Fix**: `id.includes('node_modules/convex/')`.
**Autonomia**: AUTÔNOMO.

### [P3] I12: CSP sem domínios Meta Pixel
**Arquivo/Sistema**: `src/lib/metaPixel`, `vercel.json` CSP
**Problema**: Quando ativar Meta Pixel será bloqueado.
**Fix**: `connect.facebook.net` em script-src; `www.facebook.com` em img/connect-src.
**Autonomia**: AUTÔNOMO.

---

## Segurança

### [P1] S1: PageView/AdImpression flood
**Arquivo**: `convex/analytics.ts:9-70`
**Problema**: Mutations públicas, anônimas, sem rate limit. Atacante rota 1000 req/s rotacionando sessionId, infla métricas e estoura plan Convex.
**Fix**: `checkRateLimit` por sessionId (max 30/min).
**Autonomia**: AUTÔNOMO.

### [P1] S2: r2.generateUploadUrl sem role check para `cover`/`material`/`post-image`
**Arquivo**: `convex/r2.ts:310-357`
**Problema**: Qualquer user autenticado gera presigned PUT até 50MB. Atacante enche bucket com órfãos.
**Fix**: `purpose !== 'avatar'` exige `userFunctions` contendo `criador` (ou admin).
**Autonomia**: AUTÔNOMO.

### [P2] S3: posts.incrementView e share sem rate limit
**Arquivo**: `convex/posts.ts:224-234`, `convex/postReactions.ts:63-92`
**Problema**: Dedup só por sessionId controlado pelo cliente. Infla viewCount/shareCount, afeta postRanking e revenue share futuro.
**Fix**: Throttle por (postId, sessionId) via rateLimits.
**Autonomia**: AUTÔNOMO.

### [P2] S4: testimonials sem rate limit
**Arquivo**: `convex/testimonials.ts:5-67`
**Problema**: Sem throttle, atacante envia depoimentos para milhares de perfis. Fila de moderação infinita.
**Fix**: `checkRateLimit('testimonial.submit', max:5, windowMs:3600_000)`.
**Autonomia**: AUTÔNOMO.

### [P2] S5: incrementView aceita posts unlisted
**Arquivo**: `convex/posts.ts:224-234`
**Problema**: ID enumerável distorce métricas privadas do autor.
**Fix**: Ignorar increment quando `status==='unlisted'`.
**Autonomia**: AUTÔNOMO.

### [P2] S6: handles.claim e updateProfile sem rate limit
**Arquivo**: `convex/handles.ts:35-61`, `convex/users.ts:89-160`
**Problema**: Squat de handles via varredura automatizada.
**Fix**: Rate limit 10/min.
**Autonomia**: AUTÔNOMO.

### [P2] S7: orders.getMine retorna creatorEmail
**Arquivo**: `convex/orders.ts:80-92, 167-200`
**Problema**: Comprador descobre email pessoal do criador. Owner-scoped, mas PII desnecessária.
**Fix**: Omitir `creatorEmail`, manter `creatorHandle`/`creatorName`.
**Autonomia**: AUTÔNOMO.

### [P2] S8: r2.deleteObject usa só `isAdminEmail` (bootstrap)
**Arquivo**: `convex/r2.ts:414-432`
**Problema**: Admin promovido via `admins` table não consegue deletar R2.
**Fix**: Usar `await isAdmin(ctx, ...)`.
**Autonomia**: AUTÔNOMO.

### [P3] S9: stripe.upsertFromWebhook aceita status do payload sem refetch
**Arquivo**: `convex/stripe.ts:160-239`
**Problema**: Risco residual baixo, mitigado por svix sig + idempotência + replay window.
**Fix**: GET `/subscriptions/:id` antes do upsert (defense in depth).
**Autonomia**: AUTÔNOMO.

---

## Verificações OK (não viraram itens)

- Webhook signatures (Clerk svix, Stripe v1) com timingSafeEqual + replay 5min
- Idempotência Stripe por event.id em recordStripeEvent
- `.env`, `credenciais.md` no `.gitignore`. Sem segredos hardcoded
- Markdown render com `rehype-sanitize` schema explícito; zero `dangerouslySetInnerHTML`
- Multi-tenant: queries usam índices por `creatorId`/`studentId`
- LGPD: `account.deleteAccount` faz hard-delete + soft-delete + anonimização
- R2 `generateDownloadUrl` é internalAction
- Comentários com `checkRateLimit(10/min)` consistente
- npm audit produção: 0 vulnerabilidades
- Vercel Analytics + Speed Insights ativos
- IndexNow funcional + cron mensal de safety net
- Robots.txt OK; headers cache `assets/*` immutable; CSP/HSTS/Permissions-Policy presentes
- `regions: ['gru1']` correto pra Brasil
- CI roda lint + check + build em node 22

---

## O que posso resolver sozinho (37 itens)

**Backend (11)**: B3 parcial (índices), B5, B6, B7, B8, B9, B10, B11, B12, B13, B14, B15
**Frontend (11)**: F1, F2, F3, F4, F5, F9, F10 parcial, F11, F12, F13, F14
**Infra (6)**: I1, I4 parcial (convex), I8, I9, I11, I12
**Segurança (9)**: S1, S2, S3, S4, S5, S6, S7, S8, S9

## O que requer sua decisão (14 itens)

**Backend (4)**: B1 (deleteAccount cascade), B2 (deleteUserCascade chunking), B3 parcial (cascade chunking), B4 (certificates schema)
**Frontend (4)**: F6 (AcceptInvitePage shell), F7 (ContactPage form), F8 (empty states), F15 (virtualização)
**Infra (6)**: I2 (CSP unsafe-eval), I3 (Sentry), I4 parcial (marked bump), I5 (sitemap arquitetura), I6 (R2 custom domain), I7 (Resend fallback), I10 (uptime monitoring)
