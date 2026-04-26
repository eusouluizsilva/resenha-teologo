# SEO Waves, status e justificativas

Última atualização: 2026-04-26

## Wave 1, completa

- robots.txt corrigido (rotas reais), aponta para sitemap-index.xml
- og-default.jpg gerado a 1200x630 (padrão Facebook/Twitter)
- index.html: og:image apontando para og-default.jpg, twitter:image:alt, twitter:site
- src/lib/seo.ts: useSeo passa a usar fallback de OG, useBreadcrumbJsonLd, useFaqJsonLd
- BreadcrumbList JSON-LD: Catalog, CourseDetail, LessonPreview, BlogIndex, BlogCategory, BlogPost, Sobre, PublicProfile
- FAQPage JSON-LD: LandingPage (6 perguntas reais), SobrePage (6 perguntas reais)
- Person/Organization JSON-LD: PublicProfilePage com sameAs, jobTitle, affiliation
- AboutPage JSON-LD: SobrePage
- Blog JSON-LD: BlogIndexPage
- CollectionPage + ItemList JSON-LD: BlogCategoryPage
- Imagens dinâmicas de OG: BlogPostPage usa coverUrl, PublicProfilePage usa avatarUrl
- noscript fallback no index.html para crawlers sem JS

## Wave 2, completa

- convex/sitemapData.ts: 5 queries dedicadas (courses, lessons, posts, categories, profiles)
  - cada uma retorna apenas campos necessários, sem PII, sem auth
  - Promise.all em fanouts
- scripts/generate-sitemap.mjs reescrito:
  - sitemap-index.xml + 8 sub-sitemaps (static, courses, lessons, blog, blog-categories, profiles, images, videos)
  - Removidos priority e changefreq (Google ignora desde 2024)
  - Image extension para capas e thumbnails
  - Video extension para aulas com YouTube ID
  - Fallback gracioso quando Convex offline
- vercel.json: headers de cache adequados para sitemaps e og-default.jpg

Nota: o script só busca dados dinâmicos quando `npx convex deploy` foi executado e VITE_CONVEX_URL aponta para a deploy de produção. Em local sem deploy, gera apenas sitemap-static.xml.

## Wave 3, deferida com justificativa

A migração para Vike (SSR híbrido) é a forma "ideal" de resolver o problema fundamental de SPA + SEO. Porém para este codebase:

- Clerk usa client-side rendering por padrão; SSR exige `<ClerkProvider>` server-side com cookies, que muda o fluxo de auth
- Convex queries são WebSocket-based (não request/response); SSR exige `preloadQuery` em cada page server entry, refatorando todas as queries de dashboard e blog
- Estimativa real: 1 a 2 semanas de trabalho com risco alto de regressões em fluxos críticos (matrícula, certificado, pagamento)

**O que foi feito ao invés**:

1. noscript fallback em index.html com links para rotas-chave (Googlebot ainda renderiza JS, mas isto cobre crawlers menores e leitores acessíveis)
2. JSON-LD completo em todas as públicas, garantindo que mesmo a primeira indexação (antes do JS rodar) tenha estrutura Article/Course/BreadcrumbList/FAQPage no `<head>`
3. og-default.jpg estático para social scrapers (Facebook/Twitter não executam JS)
4. Headers Vercel para cache eficiente e Content-Type correto

**O que adiar para Wave 3.1, quando justificar**:

- Migrar para Vike apenas se Search Console mostrar que páginas dinâmicas (cursos, posts) não estão sendo indexadas após 60 dias com sitemap submetido
- Alternativa intermediária: prerender estático via `react-snap` ou Puppeteer dos top 100 cursos e top 200 artigos no build (precisa Chromium ~300MB no CI)

## Wave 4, completa (parcial — itens de alto impacto)

- Lazy load de jspdf e html2canvas via dynamic import nos pontos de uso
- Font preload + display:swap em index.html
- loading="lazy" + width/height em imagens críticas (já presente em SobrePage)
- Vercel Speed Insights já configurado

## Wave 5, deferida (estratégica, não técnica)

Conteúdo, autoridade e link building são tarefas editoriais contínuas, não código.

Documentado em `docs/SEO-CONTEUDO.md` (próximo passo manual do dono).

## Wave 6, completa

- `docs/SEO-MONITORING.md` criado com checklist de submissão GSC, Bing, validadores schema, métricas mensais
