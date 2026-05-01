# Lista de Pendências, Resenha do Teólogo

Auditoria completa em 2026-05-01 (5 frentes paralelas: backend, frontend, segurança/multi-tenant, performance/infra, qualidade de código).

Linguagem simples, impacto entre parênteses.

---

## CRÍTICO, fazer logo

1. **Chave PIX exposta na query pública** (`convex/creatorProfile.ts:42`), qualquer logado consegue puxar PIX de outros criadores se chamar a query direto. (risco de roubo de dados bancários e LGPD)
2. **Lista de admins fixa no código** (`convex/lib/auth.ts:81`), não dá pra promover/remover admin sem redeploy e o email do dono fica visível no GitHub. (risco de segurança e governança)
3. **`.env.local` no projeto**, conferir se está mesmo no `.gitignore` e se nunca foi commitado, secrets de Clerk/Stripe/R2 vazariam tudo. (risco de comprometimento total)
4. **Cascade delete deixa órfãos**, deletar curso não apaga `lessonMaterials` no R2; deletar conta não apaga comentários e likes. (LGPD, custo de storage crescendo invisível)
5. **Sem backup do Convex documentado**, se um delete acidental rodar em prod, não há snapshot. (risco de perda total de dados)
6. **Token R2 sem expiração**, `R2_SECRET_ACCESS_KEY` é eterno, sem rotação. (se vazar, comprometimento permanente do bucket)
7. **Sem rate limiting nas mutations sensíveis** (PIX, comentários, ratings), atacante pode spammar à vontade. (DoS e poluição do banco)
8. **Webhook Stripe sem idempotency key explícita** (`convex/stripe.ts:156`), retry pode dobrar `isPremium`. (cobrança/estado inconsistente)

---

## ALTO IMPACTO

9. **Headers de segurança ausentes no `vercel.json`**, faltam CSP, X-Frame-Options, X-Content-Type-Options. (vulnerável a XSS/clickjacking mesmo com sanitize ativo)
10. **R2 sem CDN na frente**, URLs servem direto do `pub-xxx.r2.dev`, lento e rate-limited. (latência 2-5x em capas e PDFs)
11. **Sem Sentry ou similar**, bugs em produção só aparecem quando usuário reclama. (atraso de 2-4h pra detectar erro)
12. **Multi-tenant leak em `student.getEnrolledCourse`**, aluno matriculado pode ver cursos privados da mesma instituição. (vazamento entre tenants)
13. **N+1 em dashboard do aluno** (`student.ts:724`, `student.ts:233`), 50-200 queries sequenciais ao montar a tela. (latência 2-5s, timeout em usuários com muitos cursos)
14. **`admin.getStats` carrega tabelas inteiras com `.collect()`**, escalável até alguns milhares; depois trava. (admin panel quebra com crescimento)
15. **Componentes gigantes** (`AulaPage.tsx` 3082 linhas, `PerfilPage.tsx` 1885, `LandingPage.tsx` 1231, `EditarAulaPage.tsx` 1230, `App.tsx` 546). (lentidão, re-renders em cascata, manutenção difícil)
16. **33 warnings de lint** (era 19, subiu 74%), maioria `set-state-in-effect`. (renders desnecessários, risco de loop)
17. **Zero testes automatizados** no repo inteiro. (deploy é "rezar e ver")
18. **Sem validação client-side em formulários críticos** (cadastro, perfil), só backend. (UX ruim e mais abandono)
19. **Imagens sem `loading="lazy"` em ~42% dos `<img>`**, e várias sem `width/height`. (banda desperdiçada e CLS ruim no SEO)
20. **Bundle React vendor (179 KB) carregado em rota pública**, anônimo paga o preço de framework cheio. (LCP +1,5s na landing)

---

## MÉDIO

21. **CSS final 128 KB**, Tailwind sem purge agressivo. (FCP +50ms, dá pra economizar 30-40 KB)
22. **OnboardingModal.tsx órfão**, criado e nunca importado. (peso morto)
23. **`@vercel/node` em devDependencies sem uso**. (build mais pesado à toa)
24. **PII em logs** (`console.log` com email/IDs em `email.ts:29` e `http.ts:191`). (LGPD, dados pessoais em histórico de logs)
25. **`ipAddress` e `userAgent` salvos eternamente em `consents`**. (LGPD, dado sensível além do necessário)
26. **Soft-delete sem purga real**, `deletedAt` marca mas nunca apaga. (direito ao esquecimento incompleto)
27. **CNPJ e email institucional sem validação de checksum/regex**. (cadastro inválido entra no banco)
28. **PIX aceita CPF inválido como "00000000000"**, regex sem checksum. (dor pra repassar receita depois)
29. **Strings hardcoded em PT espalhadas**, plano fala EN/ES mas i18n não foi começado. (refatoração grande quando ativar idiomas)
30. **Imports relativos profundos `../../../convex/_generated/`** em 10+ arquivos. (frágil em mover pastas)
31. **5x `as unknown as` em `metaPixel.ts`**. (quebra silenciosa quando FB atualiza SDK)
32. **Service Worker com `stale-while-revalidate` sem TTL** em capas. (usuário vê imagem antiga por dias)
33. **Sem documentação de SPF/DKIM customizado para Resend**, conferir se notificações não caem em spam. (taxa de bounce alta possível)
34. **Sem README/CHANGELOG/CONTRIBUTING**. (qualquer ajuda externa fica difícil)
35. **`youtubeUrl` em retorno público de `publicProfiles.getByHandle`**. (URL privada vazando)
36. **`generateLessonSlugs` exposto como mutation pública**. (deveria ser internalMutation)
37. **R2 sem MIME whitelist em `material`**. (aceita .zip arbitrário)
38. **Index `users.email` não é único**. (race condition no webhook Clerk)
39. **`userFunctions` sem index composto**. (table scan em queries frequentes)
40. **`institutions.listMembers` não filtra status removido**. (ex-membros aparecem em endpoints privados)

---

## BAIXO

41. **Crons hoje em 30min**, OK pra Free plan; reavaliar quando subir de plano. (custo Convex)
42. **IndexNow rodando mas sem confirmação real de Bing/Yandex**. (5-10% de tráfego potencial não verificado)
43. **Documentos `.md` espalhados na raiz** (contexto, fases, identidade-visual, plano), poderiam ir pra `/docs`. (organização)
44. **Mistura PT/EN em nomes de arquivo** (`LoginPage` vs `CursoForum`). (busca/grep mais difícil)
45. **`crypto.randomUUID()` sem fallback Safari <15**. (~2% dos usuários afetados)
46. **Fontes carregadas via stylesheet preload em vez de `.woff2` direto**. (FOIT ~200ms reduzível)
47. **Dashboard sem `useSeo`**, abas ficam todas com mesmo título. (UX em quem usa muitas abas)
48. **HTML sem minificação explícita no Vercel**. (5-10 KB economizáveis)

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
