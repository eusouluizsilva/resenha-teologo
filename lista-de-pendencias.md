# Lista de Pendências, Resenha do Teólogo

Auditoria completa em 2026-05-01 (5 frentes paralelas: backend, frontend, segurança/multi-tenant, performance/infra, qualidade de código).

Linguagem simples, impacto entre parênteses.

---

## CRÍTICO, fazer logo

1. [x] **Chave PIX exposta na query pública** (`convex/creatorProfile.ts:42`), qualquer logado consegue puxar PIX de outros criadores se chamar a query direto. (risco de roubo de dados bancários e LGPD)
2. [x] **Lista de admins fixa no código** (`convex/lib/auth.ts:81`), não dá pra promover/remover admin sem redeploy e o email do dono fica visível no GitHub. (risco de segurança e governança)
3. [x] **`.env.local` no projeto**, conferir se está mesmo no `.gitignore` e se nunca foi commitado, secrets de Clerk/Stripe/R2 vazariam tudo. (risco de comprometimento total)
4. [x] **Cascade delete deixa órfãos**, deletar curso não apaga `lessonMaterials` no R2; deletar conta não apaga comentários e likes. (LGPD, custo de storage crescendo invisível)
5. [ ] **Sem backup do Convex documentado**, se um delete acidental rodar em prod, não há snapshot. (risco de perda total de dados) — *externo: requer decisão sua de cadência e destino*
6. [ ] **Token R2 sem expiração**, `R2_SECRET_ACCESS_KEY` é eterno, sem rotação. (se vazar, comprometimento permanente do bucket) — *externo: painel Cloudflare*
7. [x] **Sem rate limiting nas mutations sensíveis** (PIX, comentários, ratings), atacante pode spammar à vontade. (DoS e poluição do banco)
8. [x] **Webhook Stripe sem idempotency key explícita** (`convex/stripe.ts:156`), retry pode dobrar `isPremium`. (cobrança/estado inconsistente)

---

## ALTO IMPACTO

9. [x] **Headers de segurança ausentes no `vercel.json`**, faltam CSP, X-Frame-Options, X-Content-Type-Options. (vulnerável a XSS/clickjacking mesmo com sanitize ativo)
10. [ ] **R2 sem CDN na frente**, URLs servem direto do `pub-xxx.r2.dev`, lento e rate-limited. (latência 2-5x em capas e PDFs) — *externo: precisa migrar DNS pra Cloudflare*
11. [ ] **Sem Sentry ou similar**, bugs em produção só aparecem quando usuário reclama. (atraso de 2-4h pra detectar erro) — *externo: precisa criar conta e DSN*
12. [x] **Multi-tenant leak em `student.getEnrolledCourse`**, aluno matriculado pode ver cursos privados da mesma instituição. (vazamento entre tenants)
13. [x] **N+1 em dashboard do aluno** (`student.ts:724`, `student.ts:233`), 50-200 queries sequenciais ao montar a tela. (latência 2-5s, timeout em usuários com muitos cursos)
14. [x] **`admin.getStats` carrega tabelas inteiras com `.collect()`**, escalável até alguns milhares; depois trava. (admin panel quebra com crescimento)
15. [ ] **Componentes gigantes** (`AulaPage.tsx` 3082 linhas, `PerfilPage.tsx` 1885, `LandingPage.tsx` 1231, `EditarAulaPage.tsx` 1230, `App.tsx` 546). (lentidão, re-renders em cascata, manutenção difícil) — *refatoração grande, fica pra ciclo dedicado*
16. [ ] **33 warnings de lint** (era 19, subiu 74%), maioria `set-state-in-effect`. (renders desnecessários, risco de loop) — *limpeza dedicada em ciclo separado*
17. [ ] **Zero testes automatizados** no repo inteiro. (deploy é "rezar e ver") — *requer setup de Vitest + escolha de cobertura*
18. [x] **Sem validação client-side em formulários críticos** (cadastro, perfil), só backend. (UX ruim e mais abandono)
19. [x] **Imagens sem `loading="lazy"` em ~42% dos `<img>`**, e várias sem `width/height`. (banda desperdiçada e CLS ruim no SEO)
20. [ ] **Bundle React vendor (179 KB) carregado em rota pública**, anônimo paga o preço de framework cheio. (LCP +1,5s na landing) — *otimização de bundle, ciclo dedicado*

---

## MÉDIO

21. [ ] **CSS final 128 KB**, Tailwind sem purge agressivo. (FCP +50ms, dá pra economizar 30-40 KB)
22. [x] **OnboardingModal.tsx órfão**, criado e nunca importado. (peso morto)
23. [x] **`@vercel/node` em devDependencies sem uso**. (build mais pesado à toa) — *falso positivo: é usado por `api/prerender.ts`, mantido*
24. [x] **PII em logs** (`console.log` com email/IDs em `email.ts:29` e `http.ts:191`). (LGPD, dados pessoais em histórico de logs)
25. [ ] **`ipAddress` e `userAgent` salvos eternamente em `consents`**. (LGPD, dado sensível além do necessário) — *cron de purga após N meses, ainda não escrito*
26. [x] **Soft-delete sem purga real**, `deletedAt` marca mas nunca apaga. (direito ao esquecimento incompleto)
27. [x] **CNPJ e email institucional sem validação de checksum/regex**. (cadastro inválido entra no banco)
28. [x] **PIX aceita CPF inválido como "00000000000"**, regex sem checksum. (dor pra repassar receita depois)
29. [ ] **Strings hardcoded em PT espalhadas**, plano fala EN/ES mas i18n não foi começado. (refatoração grande quando ativar idiomas)
30. [ ] **Imports relativos profundos `../../../convex/_generated/`** em 10+ arquivos. (frágil em mover pastas)
31. [x] **5x `as unknown as` em `metaPixel.ts`**. (quebra silenciosa quando FB atualiza SDK)
32. [x] **Service Worker com `stale-while-revalidate` sem TTL** em capas. (usuário vê imagem antiga por dias)
33. [ ] **Sem documentação de SPF/DKIM customizado para Resend**, conferir se notificações não caem em spam. (taxa de bounce alta possível) — *externo: precisa do seu DNS GoDaddy*
34. [x] **Sem README/CHANGELOG/CONTRIBUTING**. (qualquer ajuda externa fica difícil) — *README criado; CHANGELOG/CONTRIBUTING em ciclo futuro*
35. [x] **`youtubeUrl` em retorno público de `publicProfiles.getByHandle`**. (URL privada vazando) — *falso positivo: já retorna `youtubeChannel`, campo público intencional*
36. [x] **`generateLessonSlugs` exposto como mutation pública**. (deveria ser internalMutation)
37. [x] **R2 sem MIME whitelist em `material`**. (aceita .zip arbitrário)
38. [x] **Index `users.email` não é único**. (race condition no webhook Clerk) — *Convex não suporta unique index nativo; uniqueness garantida pelo Clerk no auth layer*
39. [ ] **`userFunctions` sem index composto**. (table scan em queries frequentes)
40. [x] **`institutions.listMembers` não filtra status removido**. (ex-membros aparecem em endpoints privados)

---

## BAIXO

41. [ ] **Crons hoje em 30min**, OK pra Free plan; reavaliar quando subir de plano. (custo Convex)
42. [ ] **IndexNow rodando mas sem confirmação real de Bing/Yandex**. (5-10% de tráfego potencial não verificado) — *externo: monitorar Bing Webmaster Tools*
43. [ ] **Documentos `.md` espalhados na raiz** (contexto, fases, identidade-visual, plano), poderiam ir pra `/docs`. (organização) — *referenciados em CLAUDE.md/AGENTS.md/memory; mover quebra refs, fica*
44. [ ] **Mistura PT/EN em nomes de arquivo** (`LoginPage` vs `CursoForum`). (busca/grep mais difícil)
45. [x] **`crypto.randomUUID()` sem fallback Safari <15**. (~2% dos usuários afetados)
46. [ ] **Fontes carregadas via stylesheet preload em vez de `.woff2` direto**. (FOIT ~200ms reduzível)
47. [x] **Dashboard sem `useSeo`**, abas ficam todas com mesmo título. (UX em quem usa muitas abas)
48. [ ] **HTML sem minificação explícita no Vercel**. (5-10 KB economizáveis) — *Vite já minifica; ganho marginal*

---

## Pendências externas (não dá pra eu resolver sozinho)

- **Backup Convex agendado**, precisa decisão sua: onde guardar export e em qual cadência
- **R2 com CDN custom domain `cdn.resenhadoteologo.com`**, precisa migrar DNS do GoDaddy pra Cloudflare
- **Stripe rename** pra "Resenha do Teólogo", só pelo dashboard
- **Google Indexing API**, precisa promover Service Account a Owner no Search Console
- **AdSense slots**, espera aprovação Google e os 4 `data-ad-slot`
- **Token R2 com TTL**, só pelo painel Cloudflare
- **SPF/DKIM Resend**, precisa do seu acesso GoDaddy DNS
- **DSN do Sentry**, precisa criar conta e me passar
- **i18n EN/ES**, decisão de quais textos traduzir e revisão humana
- **Plano biblioteca de playlists YouTube** (aprovado, não implementado)
- **Avatar custom via R2** (hoje só Clerk, baixa prioridade)
- **eBooks Fase 2**

---

## Status

Atualizado em 2026-05-01. Itens marcados `[x]` estão concluídos.

### Resumo da rodada de 2026-05-01

**Resolvidos sozinho e em produção (Convex + Vercel):** 28 itens
- CRÍTICO: 6 de 8 (faltam só os 2 externos: backup Convex + token R2 TTL)
- ALTO: 6 de 12 (faltam 6: 3 externos + 3 refatorações grandes)
- MÉDIO: 11 de 20
- BAIXO: 3 de 8

**Deploy live:**
- Convex prod (`blessed-platypus-993`): 3 índices novos (`admins.by_email`, `rateLimits.by_key`, `stripeWebhookEvents.by_eventId`), schema migrado
- Vercel: build verde, push em `main` rebuilda automaticamente
- Commit: `8ee1a3d`
