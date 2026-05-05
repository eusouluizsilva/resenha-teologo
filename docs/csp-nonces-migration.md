# Migracao CSP, item 23 da auditoria 2026-05-04

Estado atual: a politica enforcada (`Content-Security-Policy`) ainda usa
`'unsafe-inline'` e `'unsafe-eval'` no `script-src`. O risco e XSS injetado
em qualquer ponto da plataforma rodar livremente porque a CSP nao bloqueia
script inline.

Estrategia: migrar pra hashes + `'strict-dynamic'`, com janela de
report-only em producao antes de promover.

## Onde estamos hoje

1. `vercel.json` carrega a politica enforcada que mantem o app funcionando
   exatamente como antes.
2. Tambem carrega uma `Content-Security-Policy-Report-Only` com a politica
   alvo: SEM `'unsafe-inline'` em script-src, com hashes pra os 3 inline
   scripts conhecidos em `index.html` (consent stub + 2 JSON-LD), com
   `'strict-dynamic'` pra herdar confianca em scripts spawnados pelo
   bundle do Vite, e o mesmo allowlist atual de terceiros como fallback
   pra browsers sem strict-dynamic.
3. Browser envia violacoes pra `/api/csp-report.ts` via `report-uri` e
   `report-to` (Reporting-Endpoints header). O endpoint loga em
   `console.log('[csp-violation]', ...)` e os logs aparecem no painel do
   Vercel.

## O que falta pra promover

1. **Deploy e janela de monitoramento:** depois deste commit, abrir os logs
   do Vercel e filtrar por `[csp-violation]`. Recomendado deixar 7 dias
   passarem em trafego real (alunos, criadores, AdSense, Stripe checkout,
   Clerk SSO Google/Facebook, YouTube embed, FB pixel).
2. **Triagem das violacoes:**
   - **Inline script novo, esperado** (alguma feature mudou): adicionar
     hash na lista `'sha256-...'` do report-only.
   - **Inline injetado por terceiro confiavel** (provavelmente coberto
     por `'strict-dynamic'`): nada a fazer, ja passa.
   - **Inline suspeito** (XSS real): isolar e remover do codigo.
3. **Style-src:** continua com `'unsafe-inline'` porque ha 81 lugares com
   `style={...}` em JSX. Remover exigiria mover tudo pra classes Tailwind
   ou setar via JS depois do mount. Fica fora do escopo deste item.
4. **`'unsafe-eval'`:** continua na nova politica porque algumas libs
   (clerk, framer-motion em dev, ad scripts) usam `eval`/`Function`.
   Remover exige confirmar via report-only que nada quebra. Ja vai testar
   junto.
5. **Promocao:** quando os logs zerarem por 3-4 dias, copiar o valor de
   `Content-Security-Policy-Report-Only` pro header `Content-Security-Policy`
   (substituindo o atual com `'unsafe-inline'`) e remover o report-only.

## Quando algum hash mudar

Toda vez que `index.html` mudar um inline script, recomputar:

```bash
node -e "
const fs = require('fs');
const crypto = require('crypto');
const html = fs.readFileSync('index.html', 'utf8');
const re = /<script(?![^>]*\\bsrc=)[^>]*>([\\s\\S]*?)<\\/script>/g;
let m;
while ((m = re.exec(html)) !== null) {
  const hash = crypto.createHash('sha256').update(m[1]).digest('base64');
  console.log('sha256-' + hash);
}
"
```

E atualizar a lista no `vercel.json` (header `Content-Security-Policy-Report-Only`).

## Por que nao migrar pra nonces de verdade

Nonces exigem rendering server-side que injeta um nonce diferente por request
em todas as tags `<script>` e `<style>` e no proprio header CSP. Isso significa:

- Tirar o `index.html` do CDN (cada request precisa ser unico) ou usar uma
  rota Vercel function dedicada que rebuild o HTML.
- Toda invalidacao de cache do Vercel e do Cloudflare passa a custar mais.
- Nao da pra setar nonce em atributo `style="..."` (browsers nao suportam),
  entao mesmo com nonces o `style-src` ainda precisa de `'unsafe-inline'`.

Hashes + strict-dynamic atinge o mesmo nivel de seguranca pra script-src
sem precisar tirar o site do CDN. E a estrategia que o Google recomenda
pra SPAs servidas estaticamente.
