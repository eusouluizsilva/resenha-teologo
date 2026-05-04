# Auditoria + Plano, 2026-05-04

48 itens totais. 37 eu resolvo, 11 dependem de você.

---

## CRÍTICO (faz logo)

1. **Aluno novo entra perdido** (cai no painel sem saber o que fazer, perde gente que não volta) → ativar tour de boas-vindas em 3 telas.
2. **Sem celebração quando completa aula** (parece sem graça, não vicia) → toast com confeti, badges de streak, página de conquistas.
3. **Streak invisível** (gamificação está pronta no banco mas não aparece) → card "Sua jornada hoje" com metas e barra de sequência.
4. **Tela branca quando dá erro** (qualquer bug derruba a página inteira) → ErrorBoundary global com mensagem amigável.
5. **Sem alerta quando site cai** (você só descobre quando alguém reclama) → Sentry + UptimeRobot.

---

## ALTO IMPACTO

6. **Preview de aula pública sem CTA forte** (visitante não vira aluno) → botão fixo no rodapé mobile + "1.247 alunos já assistiram".
7. **Telas vazias só com texto "Em breve"** (parece site morto) → ilustrações SVG nos 5 lugares vazios.
8. **Spinners diferentes em cada tela** (parece amador) → componente Skeleton padrão.
9. **Tela branca de 300-800ms ao trocar de rota** (sensação de travado) → fallback de loading entre rotas.
10. **AulaPage com 3099 linhas** (lenta, trava ao digitar, difícil mexer) → quebrar em 6 componentes.
11. **PerfilPage com 1927 linhas e 55 inputs** (laggy, formulário pesado) → dividir em sub-páginas por aba.
12. **Sem testes automatizados** (cada deploy é "rezar e ver") → Vitest + 8 testes nas mutations críticas.
13. **Email único provedor (Resend)** (se cair, ninguém recebe nada) → fila durável + retry + fallback Postmark.
14. **Dashboard do aluno faz 60-100 leituras toda vez** (lento com muitos cursos) → cache de 5min.
15. **R2 sem CDN** (imagens 2-5x mais lentas que poderiam ser) → migrar DNS pra Cloudflare e usar `cdn.resenhadoteologo.com`.

---

## MÉDIO

16. **Notificações sem agrupamento** (10 likes viram 10 notificações separadas) → agrupar tipo "João e mais 9 curtiram".
17. **Sem busca global cmd+K** (componente existe, não está ligado) → atalho global com busca de cursos, aulas e blog.
18. **Comentários sem formatação** (só texto puro, sem negrito/itálico, sem ranking) → toolbar mínima + botão "útil" já existe no banco.
19. **Caderno só exporta entrada por entrada** (aluno quer baixar todas do curso de uma vez) → botão "exportar curso inteiro".
20. **Certificado pago sem prévia** (paga R$ 29,90 sem ver como vai ficar) → mockup com nome real antes do botão pagar.
21. **Player trava em conexão ruim** (YouTube não deixa trocar qualidade) → pill "mudar qualidade" quando detecta buffer.
22. **Lista de notificações sem paginação** (aluno antigo com 500+ baixa tudo de uma vez) → scroll infinito de 50.
23. **CSP aceita scripts inline** (proteção XSS anulada) → migrar pra nonces (precisa janela de teste).
24. **App.tsx com 555 linhas e 60 rotas** (difícil achar coisa) → dividir em arquivos por área.
25. **Bundle dividido em 30 pedaços** (waterfall em mobile lento) → consolidar em vendor + app + lazy.
26. **Sem proteção contra bundle crescer descontrolado** → CI que falha se passar de 200KB.
27. **Mistura português e inglês nos arquivos** (LoginPage vs CursoForum, grep ruim) → padronizar tudo em PT.
28. **Convex Free no limite** (próxima coisa que estoura é storage) → mover capas pro R2 público.
29. **OnboardingModal órfão** (componente pronto sem uso, peso morto) → ativar (item 1) ou deletar.

---

## BAIXO

30. **Mobile sem tab bar fixa embaixo** (hambúrguer funciona mas não é ideal) → barra fixa: Início, Cursos, Caderno, Perfil.
31. **Sem dark mode no painel do aluno** (estudo noturno cansa vista) → toggle nas preferências.
32. **Arquivos de seed em prod** (peso desnecessário no deploy) → mover pra internalMutation.
33. **Documentos .md espalhados na raiz** (organização) → mover pra /docs.
34. **i18n não começou** (plano fala EN/ES, hoje só PT) → só começar quando decidir vender em outro idioma.
35. **Cascade de delete de curso em mutação única** (estoura com curso popular) → fazer em pedaços.

---

## EXTERNO (você precisa fazer)

36. **Criar conta Sentry e me passar DSN** (15min em sentry.io) → ativo error tracking em 30min depois.
37. **Migrar DNS do GoDaddy pro Cloudflare** (1-2h) → libera CDN do R2.
38. **Token R2 com TTL 90d** (10min em dash.cloudflare.com) → segurança de credencial.
39. **UptimeRobot 4 endpoints** (15min) → alerta quando site cai.
40. **Validar SPF/DKIM Resend** (30min, GoDaddy DNS) → emails param de cair em spam.
41. **Renomear conta Stripe pra "Resenha do Teólogo"** (5min no dashboard) → cliente vê nome certo na fatura.
42. **Promover Service Account a Owner no Search Console** (10min) → Google Indexing API funcionando.
43. **AdSense: criar 4 ad units e me mandar slot IDs** (20min, depois de aprovar) → começa a pagar.
44. **Configurar 2 secrets R2 no GitHub** (10min) → backup automatizado roda.
45. **Rodar primeira execução do backup Convex** (5min: `gh workflow run`) → valida que backup tá funcionando.
46. **Confirmar IndexNow no Bing Webmaster** (15min) → 5-10% de tráfego potencial recuperado.

---

## PLANO (5 semanas)

### Semana 1, "UX visível"
1, 2, 3, 4, 7, 8

### Semana 2, "Conversão + descoberta"
6, 9, 16, 17, 20

### Semana 3, "Backend escala"
13, 14, 22, 25, 32

### Semana 4, "Refator de gigantes"
10, 11, 24, 26

### Semana 5, "Qualidade + UX médio"
12, 18, 19, 21, 30, 33

### Backlog (depois)
15 (espera 37), 23, 27, 28, 29, 31, 34, 35

---

## EU COMEÇO POR ONDE?

Opções de start imediato (sem depender de você):
- ErrorBoundary global (1h) → item 4
- Skeleton padrão (3h) → item 8
- Ilustrações empty state (2h) → item 7
- size-limit no CI (1h) → item 26

Diz qual semana começa e qual item da lista de start você quer agora.
