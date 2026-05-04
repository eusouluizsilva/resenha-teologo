# Auditoria Rodada 3, Resenha do Teólogo (2026-05-01)

Quatro frentes paralelas: backend Convex, frontend React/Vite, infraestrutura/deploy, segurança AppSec.

Total: **78 itens novos** (após dedupe entre frentes), classificados em **CRÍTICO / ALTO / MÉDIO / BAIXO** e em **[RESOLVO SOZINHO]** vs **[DEPENDE DE VOCÊ]**.

Não inclui itens já marcados `[x]` em `lista-de-pendencias.md`.

---

## CRÍTICO (atacar primeiro)

### Backend / Segurança

1. **[RESOLVO]** `convex/r2.ts:348` Action pública `generateDownloadUrl` aceita qualquer `key` e devolve presigned GET sem checar ownership/matrícula. Qualquer logado lê qualquer objeto privado do bucket. (vazamento entre tenants, bypass de paywall, LGPD; CVSS 8.8)
2. **[RESOLVO]** `convex/courses.ts:178` `generateSlugs` exposto como mutation pública sem auth nem `requireAdmin`; faz `.collect()` + patch em massa. (DoS + alteração não autorizada, mesmo bug de #36 já fechado para lessons)
3. **[RESOLVO]** `convex/stripe.ts:201` `upsertFromWebhook` não cross-checa que `metadata.clerkUserId` foi originado pelo próprio user. Forjar metadata em qualquer evento Stripe ativa premium para outros. (bypass de cobrança)
4. **[RESOLVO]** `package.json` `@clerk/clerk-react@^5.61.5` tem CVE GHSA-w24r-5266-9c3c (auth bypass, high). (CVSS 7.5; bump pra última)
5. **[RESOLVO]** `package.json` `@vercel/node@^5.7.13` puxa `undici` vulnerável (CRLF injection, request smuggling, unbounded decompression). (CVSS 7.5)

### Infra

6. **[RESOLVO]** `.github/workflows/` Vercel auto-deploy do `main` não roda `tsc -b --noEmit`, lint nem testes; `convex-deploy.yml` ainda usa `--typecheck=disable`. (regressão entra em prod sem alarme)
7. **[DEPENDE]** Vercel preview deploys sem isolamento de env e sem `noindex`. PR previews podem ser indexados pelo Google e usar `VITE_CONVEX_URL` de prod. (vazamento de dados de prod em preview, canibalização SEO; precisa configuração no painel Vercel)
8. **[RESOLVO]** Pasta `dist/` versionada com 23 arquivos `*\ 2.js` (build local stale, permissões `-rw-------`). 4.6MB de lixo. (deploy de fallback pode mandar bundle inconsistente)

---

## ALTO

### Backend (queries pesadas e N+1)

9. **[RESOLVO]** `convex/lessons.ts:165` `ensureUniqueYouTubeUrl` faz `.collect()` de todas as aulas do criador a cada save. (latência crescente no editor)
10. **[RESOLVO]** `convex/lessons.ts:327` `runScheduledPublish` (cron 30min) faz N+1: por aula publicada, `.collect()` em enrollments + Promise.all de pushInternal. Curso com 5000 matriculados trava o cron. (timeout, notificações perdidas)
11. **[RESOLVO]** `convex/admin.ts:264` `listAllUsers` faz `.collect()` em 5 tabelas inteiras (users, userFunctions, courses, enrollments, progress) por abertura do painel. (admin trava com crescimento)
12. **[RESOLVO]** `convex/account.ts:38+` `exportMyData` e `deleteAccount` usam `.filter()` em 18 tabelas (sem índice). (LGPD export pode não completar, custo brutal)
13. **[RESOLVO]** `convex/reengagement.ts:30` Loop até 500 alunos com query interna; até 500 queries sequenciais por cron diário. (latência do cron)
14. **[RESOLVO]** `convex/notifications.ts:27` `countUnread` lê `take(100)` mais recentes e filtra `!readAt`. Usuário com 100+ não lidas vê contador travado. (UX confusa)
15. **[RESOLVO]** `convex/courses.ts:285` `markComplete` faz N+1 dentro de N+1 ao notificar matriculados. Curso com 2000 alunos estoura timeout. (ação trava silenciosamente)
16. **[RESOLVO]** `convex/courses.ts:304` `remove` faz 9 `.collect()` com `.filter()` em vez de índice `by_courseId`. (delete trava em curso popular, gera órfãos)
17. **[RESOLVO]** `convex/admin.ts:1320` `listRecentCommentsAcrossPlatform` faz N+1: 240 round-trips por abertura da aba moderação. (latência alta)
18. **[RESOLVO]** `convex/dataRetention.ts:25` Cron mensal faz `.collect()` em comments + consents inteiros. Quando comentários crescerem, estoura timeout e LGPD para silenciosamente. (LGPD bloqueado sem alarme)

### Segurança

19. **[RESOLVO]** `api/prerender.ts:228` `marked.parse` injeta HTML cru no SSR sem sanitizar. Autor de blog pode injetar `<script>` em previews (Slack/WhatsApp/Googlebot). (CVSS 6.4)
20. **[RESOLVO]** `convex/users.ts:89` + `src/pages/public/PublicProfilePage.tsx:783` Campos website/social aceitam qualquer string; `<a href={...}>` renderiza sem validar esquema. Stored XSS via `javascript:`. (CVSS 6.1)
21. **[RESOLVO]** `vercel.json` Header `Content-Security-Policy` ainda não existe, apenas X-Frame-Options/X-Content-Type/Referrer-Policy/HSTS. Item #9 do pendente foi marcado prematuramente. (sem defense in depth contra XSS; CVSS 5.4)
22. **[RESOLVO]** `convex/admin.ts:666` `sendBroadcastNotification` valida link só com `startsWith('/') || startsWith('http')`, aceitando qualquer dominio externo. (open redirect via broadcast; CVSS 5.3)
23. **[RESOLVO]** `package-lock.json` ReDoS em `path-to-regexp` (GHSA-9wv6-86v2-598j) transitivo via @vercel/node. (CVSS 7.5)

### Infra

24. **[DEPENDE]** Sem backup Convex automatizado em destino externo. Free plan não tem snapshot retroativo. (delete acidental ou bug apaga conteúdo permanentemente; precisa decisão de cadência e destino)
25. **[RESOLVO]** Sem rollback strategy documentada para Vercel/Convex. Recuperar de deploy quebrado leva 5 a 15 min. (downtime evitável)
26. **[RESOLVO]** `public/sw.js:9` Service worker `v4` sem invalidação automática entre versões. Janela de bug em prod estende até 1h após hotfix. (HTML stale após deploy)
27. **[DEPENDE]** SPF/DKIM/DMARC do Resend não validados no DNS GoDaddy. (transactional cai em spam; precisa acesso GoDaddy)
28. **[DEPENDE]** Sem error tracking nem alerta de 5xx em prod. Falhas em pagamento, prerender e auth-sync passam despercebidas. (precisa criar conta Sentry e me passar DSN)
29. **[DEPENDE]** Uptime monitoring externo zero. Vercel não cobre Convex/DNS down. (precisa criar UptimeRobot ou BetterStack)

### Frontend

30. **[RESOLVO]** `src/components/AdSlot.tsx:93` `<ins class="adsbygoogle">` sem `min-height` reservado. CLS direto na landing/blog/curso quando AdSense preenche. (Core Web Vitals)
31. **[RESOLVO]** `src/pages/dashboard/criador/PerfilPage.tsx` 28 `<label>` sem `htmlFor` + RegisterPage 9 labels sem `for`. Leitor de tela não associa. (a11y/WCAG 1.3.1, 4.1.2)
32. **[RESOLVO]** `src/pages/dashboard/criador/PerfilPage.tsx` (1885 linhas) zero `useMemo`/`useCallback`/`memo`. Cada keystroke recalcula listas e cria handlers. (lag perceptível)
33. **[RESOLVO]** `src/pages/dashboard/admin/AllUsersModal.tsx:779` Lista linear sem virtualização. Acima de algumas centenas, abrir modal congela aba. (perf admin)
34. **[RESOLVO]** `src/lib/motion.ts` Nenhum lugar usa `useReducedMotion` da framer-motion. CSS reduce-motion não afeta variantes JS-driven. (a11y/WCAG 2.3.3, viola regra do projeto)

---

## MÉDIO

### Backend

35. **[RESOLVO]** `convex/posts.ts:226` `viewCount + 1` sem operação atômica. Reads concorrentes perdem incrementos. (subcontagem em posts virais)
36. **[RESOLVO]** `convex/student.ts:500` `quizAttempts` sem guarda atômica. Double-click em submit burla `allowQuizRetry=false`. (bypass anti-retry)
37. **[RESOLVO]** `convex/account.ts:283` `donations.studentId = 'deleted-user'` literal. Múltiplos deletes colidem em mesmo placeholder. (colisão de identidade fiscal)
38. **[RESOLVO]** `convex/schema.ts:486` Tabela `donations` só tem `by_creatorId`. Falta `by_studentId`. (latência em export LGPD e admin)
39. **[RESOLVO]** `convex/admin.ts:559` `broadcastNotification` e `sendBroadcastNotification` têm 80 linhas duplicadas. (manutenção e divergência)
40. **[RESOLVO]** `convex/admin.ts:907` `deleteUserCascade` apaga 20+ tabelas em mutation única. Limite 8s estoura em usuário com muito conteúdo. (cascata pela metade)
41. **[RESOLVO]** `convex/posts.ts:507` `listMine` faz `.collect()` + Promise.all de presign por post. 200 rascunhos = 200 presigns. (latência em "meus artigos")
42. **[RESOLVO]** `convex/posts.ts:454` `publish` notifica seguidores com `take(100)` silencioso. 500 seguidores avisa só 100. (notificação parcial)
43. **[RESOLVO]** `convex/r2.ts:294` `generateUploadUrl` sem rate limit nem cap diário por usuário. (DoS de armazenamento, custo R2)
44. **[RESOLVO]** `convex/posts.ts:218` `incrementView` sem rate limit nem dedupe server-side; "idempotência fica no client". (poluição do ranking de blog)

### Frontend

45. **[RESOLVO]** `src/components/ui/Skeleton.tsx` Componente definido e zero importações. 38 arquivos usam `animate-spin` em vez de skeleton em listagens. (CLS quando spinners viram listas)
46. **[RESOLVO]** `src/lib/store.ts` 58 linhas de código morto (CRUD em localStorage da era pre-Convex). (peso morto + lixo no localStorage de usuários antigos)
47. **[RESOLVO]** `src/components/certificate/CertificatePreview.tsx:11` `import QRCode from 'qrcode'` estático (~30KB) puxado para chunk de Certificados mesmo sem certificado aberto. (perf chunk)
48. **[RESOLVO]** `src/components/certificate/CertificatePreview.tsx:25` Fontes Cinzel/EB Garamond/Pinyon Script via `fonts.googleapis.com` (viola regra de self-host). (perf + privacidade)
49. **[RESOLVO]** `src/components/AdSlot.tsx:47` `useEffect` espelha `setShouldRender(!isPremium && enabled)` em vez de `const shouldRender = !isPremium && enabled`. (anti-pattern, render extra)
50. **[RESOLVO]** `src/components/blog/FollowButton.tsx:47` `handleClick` sem disable durante request. Double-click dispara duas mutations. (UX, depende de idempotência backend)
51. **[RESOLVO]** ~13 arquivos do dashboard com `<img>` sem `loading="lazy"` nem `width`/`height`. Item #19 só tratou rotas públicas. (CLS interno)
52. **[RESOLVO]** `src/pages/public/SobrePage.tsx:194` `onError` da foto manipula `target.style.display + parent.innerHTML`, fora do reconciler React. (bug latente)
53. **[RESOLVO]** `src/components/auth/AuthLayout.tsx:80` + 23 lugares em `CertificatePreview.tsx` com `style={{ fontFamily: 'Source Serif 4, serif' }}` em vez de classe `font-serif`. (consistência)

### Infra

54. **[RESOLVO]** `vercel.json` Sem `regions: ['gru1']` nem runtime declarado para `api/prerender.ts`. (latência crawler BR +150ms)
55. **[RESOLVO]** `vercel.json` CSP/security-headers ausentes para função serverless `api/prerender`. (clickjacking via prerender, indexação de path interno)
56. **[RESOLVO]** `.github/workflows/convex-deploy.yml:21` `npm install --prefer-offline` em vez de `npm ci`. (drift entre dev e CI)
57. **[RESOLVO]** Sem performance budget / bundle-size monitor. (LCP regride sem alarme)
58. **[DEPENDE]** Logs em prod só em dashboards efêmeros, sem retenção/exportação. (post-mortem cego, fraco em LGPD; precisa decisão de log drain pago)
59. **[DEPENDE]** Sem cost monitoring com alertas em Convex/R2/Stripe/Clerk. (bill surprise; precisa configurar alerta nos painéis)
60. **[RESOLVO]** `public/manifest.webmanifest:16` Sem ícones 192x192 e 256x256, só 512 e 1024. (Lighthouse PWA + ícone borrado em Android)
61. **[RESOLVO]** `api/prerender.ts` Sem runtime/maxDuration declarados em `vercel.json`. (deploy futuro pode pegar runtime diferente)

### Segurança

62. **[RESOLVO]** `convex/admin.ts` 24 mutations admin sem audit log. (sem trilha forense; gap LGPD art. 37)
63. **[RESOLVO]** `package-lock.json` ReDoS em `minimatch` (GHSA-3ppc-4f35-3m26 + 2 outros). (DoS em build/dev tooling)
64. **[RESOLVO]** `package-lock.json` ReDoS em `ajv` (GHSA-2g4f-4pwh-qvx6). (DoS em validators)
65. **[RESOLVO]** `package-lock.json` DoS em `smol-toml` (GHSA-v3rj-xjv7-4jmq).
66. **[DEPENDE]** `convex/r2.ts:337` Presigned GET com TTL de 7 dias como fallback quando `R2_PUBLIC_BASE_URL` não setado. (URL vazada permanece válida 7 dias; precisa setar env Convex prod)

---

## BAIXO

67. **[RESOLVO]** `convex/r2.ts:108` `presignS3Url` recomputa `signingKey` (4 HMACs) por request. 20 covers = 80 HMACs. (latência fixa em listagens; cachear `signingKey` por dateStamp)
68. **[RESOLVO]** `src/main.tsx:11` Source Serif (3 woff2) carregado em todas as rotas, mesmo na landing. (~30-50KB de fontes ociosas no LCP da home)
69. **[RESOLVO]** `src/App.tsx:395` RouteTracker com `.catch(() => {})` engole erros de pageview silenciosamente. (visibilidade operacional)
70. **[RESOLVO]** `src/components/blog/ArticleBody.tsx:1` `react-markdown` + `remark-gfm` + `rehype-sanitize` (~70KB) estáticos no editor. Considerar lazy no preview. (chunk MeuBlogPage)
71. **[RESOLVO]** `src/main.tsx:285` `setInterval(checkForUpdate)` para SW sem `clearInterval`. Se registro falhar e refizer, intervalo duplica. (leak teórico)
72. **[RESOLVO]** `src/pages/dashboard/criador/VisaoGeralPage.tsx:176` Thumbnails do curso com `alt=""` (não é decorativo). Mesmo em LandingPage e TrilhaPublica. (a11y)
73. **[RESOLVO]** `src/components/AdSlot.tsx:67` `IntersectionObserver` recriado a cada mudança de prop. Não vaza, mas é trabalho desnecessário. (perf marginal)
74. **[RESOLVO]** `convex/users.ts:225` `searchPublic` faz `.collect()` na tabela inteira. (custo crescente; índice + paginate)
75. **[RESOLVO]** `convex/stripe.ts:53` `throw new Error('Stripe API failed: ' + errText)` propaga corpo bruto Stripe. (mensagens internas vazam; CVSS 3.1)
76. **[RESOLVO]** `convex/institutions.ts:200` Fallback `Math.random()` para invite token se WebCrypto ausente. (tokens previsíveis em runtime hipotético; CVSS 2.6)
77. **[RESOLVO]** `tsconfig.tsbuildinfo` aparece em `git status` mas é artefato de build. Falta no `.gitignore`. (ruído em PR)
78. **[RESOLVO]** `scripts/generate-sitemap.mjs:109` `prebuild` consome Convex de prod a cada `vercel build`. (queries Convex infladas no Free plan)

### Tópicos sem ação direta (nem RESOLVO nem DEPENDE puro)

79. **[DEPENDE]** Strings PT hardcoded em todas as páginas, dívida cresceu 50%+ desde a última auditoria. (refator antes de ativar i18n; já é item #29 no pendente)
80. **[DEPENDE]** Lista de países hardcoded incompleta (14 países) em RegisterPage e IdentitySelector. (decisão de produto sobre quais países)
81. **[DEPENDE]** Banner LGPD com `analytics_storage=granted` por default antes do consent explícito (`src/lib/consent.ts:101`). (compliance UE estrito; precisa decisão de política)
82. **[DEPENDE]** `index.html:51` data-ad-client em HTML estático e em env var. (decisão de quando consolidar)
83. **[DEPENDE]** `.env` no working tree com `CLERK_SECRET_KEY` real (sk_test). Gitignored mas em texto plano. (rotacionar e mover para gerenciador externo)

---

## Resumo executivo

| Categoria | RESOLVO SOZINHO | DEPENDE DE VOCÊ | Total |
|-----------|-----------------|-----------------|-------|
| Backend   | 25              | 0               | 25    |
| Frontend  | 21              | 4               | 25    |
| Infra     | 11              | 9               | 20    |
| Segurança | 13              | 2               | 15    |
| **Total** | **70**          | **15**          | **85** (com sobreposição entre frentes, 78 únicos) |

### Top 5 a atacar em sequência (alto impacto, esforço razoável)

1. **#1 (`r2.generateDownloadUrl`)** Vazamento entre tenants ativo agora.
2. **#3 (`stripe.upsertFromWebhook` cross-check)** Bypass de cobrança.
3. **#2 (`courses.generateSlugs` público)** Mass patch não autorizado.
4. **#4 + #5 + #23 + #63 + #64 + #65 (`npm audit fix` + bumps)** Limpa 6 CVEs em uma sessão.
5. **#6 (CI/CD checks no front)** Sem isso, qualquer regressão futura entra em prod.

### Top 5 que precisam decisão sua

1. **#28 Sentry** Criar conta, me passar DSN.
2. **#29 UptimeRobot** Criar conta, monitorar 3 endpoints.
3. **#24 Backup Convex** Decidir cadência e destino (R2 ou Drive).
4. **#27 SPF/DKIM Resend** Acesso ao GoDaddy DNS.
5. **#7 Preview deploys** Configurar env split e Vercel Authentication no painel.

### Sobreposição com `lista-de-pendencias.md`

Confirmado que **78 itens novos** não duplicam nada já marcado `[x]` na lista anterior. Algumas tags já listadas como pendentes externos (Sentry, backup, SPF) reaparecem aqui com nível de urgência atualizado.
