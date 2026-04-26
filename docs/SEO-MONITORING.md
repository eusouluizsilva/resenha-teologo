# SEO Monitoring — Resenha do Teólogo

Guia operacional para acompanhar a saúde de SEO da plataforma após as Ondas 1 a 4. Use mensalmente.

---

## 1. Submissão inicial (uma única vez)

### 1.1 Google Search Console

1. Acesse https://search.google.com/search-console e adicione propriedade do tipo **Domain** (`resenhadoteologo.com`).
2. Verifique via DNS TXT na Cloudflare. Aguardar até 24h para validação.
3. Em **Sitemaps**, submeter exatamente:
   - `https://resenhadoteologo.com/sitemap-index.xml`
4. Em **Settings > Crawl stats**, confirmar que o Googlebot está acessando.
5. Em **URL inspection**, testar manualmente uma URL de cada categoria:
   - Landing: `https://resenhadoteologo.com/`
   - Curso: `https://resenhadoteologo.com/cursos/[primeiro-slug]`
   - Aula preview: `https://resenhadoteologo.com/cursos/[slug]/[lesson-slug]`
   - Artigo: `https://resenhadoteologo.com/blog/[handle]/[post-slug]`
   - Perfil: `https://resenhadoteologo.com/[handle]`
   - Categoria blog: `https://resenhadoteologo.com/blog/categoria/biblia`

### 1.2 Bing Webmaster Tools

1. Acesse https://www.bing.com/webmasters e adicione `resenhadoteologo.com`.
2. Importe direto do GSC (botão "Import from Google Search Console") para acelerar.
3. Submeter o mesmo sitemap-index.

### 1.3 Verificação técnica imediata

Após o deploy, rodar este checklist:

```
curl -I https://resenhadoteologo.com/robots.txt
  Esperado: 200 OK, content-type: text/plain

curl -I https://resenhadoteologo.com/sitemap-index.xml
  Esperado: 200 OK, content-type: application/xml

curl -I https://resenhadoteologo.com/og-default.jpg
  Esperado: 200 OK, content-type: image/jpeg, ~25KB

curl -s https://resenhadoteologo.com/sitemap-index.xml | head
  Esperado: <?xml version="1.0"...> com <sitemap> entries
```

---

## 2. Validadores de Schema (rodar a cada nova feature)

| Página | URL teste | Schemas que devem aparecer |
|---|---|---|
| `/` | https://search.google.com/test/rich-results | EducationalOrganization, WebSite, FAQPage |
| `/sobre` | https://search.google.com/test/rich-results | AboutPage, BreadcrumbList, FAQPage |
| `/cursos` | https://search.google.com/test/rich-results | CollectionPage, ItemList, BreadcrumbList |
| `/cursos/:slug` | https://search.google.com/test/rich-results | Course, BreadcrumbList |
| `/cursos/:slug/:lesson` | https://search.google.com/test/rich-results | LearningResource, BreadcrumbList |
| `/blog` | https://search.google.com/test/rich-results | Blog, BreadcrumbList |
| `/blog/:handle/:slug` | https://search.google.com/test/rich-results | Article, BreadcrumbList |
| `/:handle` | https://search.google.com/test/rich-results | Person ou Organization, BreadcrumbList |

Validador alternativo (mais estrito): https://validator.schema.org/

Validador de Open Graph (Facebook): https://developers.facebook.com/tools/debug/
Validador de Twitter Card: https://cards-dev.twitter.com/validator

---

## 3. Métricas mensais (planilha simples)

Criar uma planilha com colunas: `data`, `clicks`, `impressões`, `CTR médio`, `posição média`, `páginas indexadas`, `Core Web Vitals`. Preencher dia 1 de cada mês.

### 3.1 Onde puxar cada número

| Métrica | Fonte | Caminho |
|---|---|---|
| Clicks, impressões, CTR, posição | GSC | Performance > Search results > 28d |
| Páginas indexadas | GSC | Indexing > Pages > "Indexed" |
| Páginas excluídas | GSC | Indexing > Pages > "Not indexed" |
| Core Web Vitals | GSC | Experience > Core Web Vitals |
| URLs com erro de schema | GSC | Enhancements > [tipo] |
| Velocidade real (campo) | https://pagespeed.web.dev/ | Rodar na home + 1 curso + 1 artigo |

### 3.2 Metas do trimestre (ajustar após 90 dias de dados)

- Páginas indexadas: 100% das URLs do sitemap (excluindo dashboard).
- Erros de schema: 0.
- Core Web Vitals: 75%+ das URLs em "Good".
- LCP: < 2.5s.
- INP: < 200ms.
- CLS: < 0.1.
- CTR médio: subir 5% mês a mês nos primeiros 6 meses.

---

## 4. Alertas que importam

Configurar email no GSC para receber:

- **Coverage issues**: queda > 10% em URLs indexadas.
- **Manual actions**: qualquer ação manual da equipe Google.
- **Security issues**: malware ou phishing detectado.
- **Mobile usability**: problemas em telas mobile.
- **Core Web Vitals**: degradação para "Poor".

Bing tem alertas equivalentes em **Configure my site > Notifications**.

---

## 5. Revisão trimestral (rodar todo dia 1 de janeiro/abril/julho/outubro)

1. Auditoria via Lighthouse no PageSpeed Insights:
   - Home, 3 cursos top, 3 artigos top, 3 perfis top.
   - Anotar score Performance, Accessibility, Best Practices, SEO.
2. Re-rodar todos os schemas no Rich Results Test (lista da seção 2).
3. Verificar que o `sitemap-index.xml` ainda lista todas as 8 sub-sitemaps esperadas.
4. Revisar `robots.txt` para garantir que rotas novas privadas (ex.: `/dashboard/algum-novo-fluxo/`) estejam bloqueadas.
5. Conferir se cada `<title>` e `<meta description>` ainda está dentro de 50–60 e 140–160 caracteres, respectivamente, nas páginas mais visitadas.
6. Rodar `curl -s https://resenhadoteologo.com/sitemap-courses.xml | xmllint --format -` e validar que não há URLs com slug vazio ou `null`.

---

## 6. Quando a coisa der errado

| Sintoma | Diagnóstico provável | Ação |
|---|---|---|
| GSC mostra "Discovered, currently not indexed" para muitas URLs | Conteúdo raso, duplicação ou falta de links internos | Auditar conteúdo da página, adicionar links internos cruzados (curso linka para artigos do autor, autor lista cursos) |
| Página principal cai 30%+ em impressões em 1 semana | Possível atualização de algoritmo ou erro de schema | Conferir Search Status Dashboard do Google e re-validar schemas |
| `sitemap-index.xml` retorna 404 | Build do `generate-sitemap.mjs` falhou | Rodar `npm run prebuild` localmente e checar logs do Vercel |
| Core Web Vitals degradou para Poor | Imagem nova quebrou LCP, ou bundle JS cresceu | Lighthouse local, identificar o asset, voltar para versão anterior |
| Schema "Article" sumiu de um post | Cover image foi removida ou markdown ficou vazio | Reabrir o post no editor, garantir cover + corpo > 200 chars |

---

## 7. Ferramentas externas opcionais

Não obrigatórias, mas úteis depois de 6 meses de dados acumulados:

- **Ahrefs Webmaster Tools** (grátis para domínios verificados): backlinks, anchor text.
- **Semrush** (pago): tracking de keywords e concorrentes.
- **Plausible Analytics** (pago, leve, sem cookie banner): pageviews por URL sem GA bloat.
- **Sentry** (já no stack): para detectar JS errors que matam crawl.

---

## 8. Histórico de mudanças

Manter este arquivo atualizado:

- 2026-04-25: Criado após Ondas SEO 1 a 4.
- (próxima entrada): documentar primeiro mês de dados do GSC.
