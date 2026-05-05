// Endpoint que recebe violacoes de CSP enviadas pelo browser via report-uri
// (formato CSP2) e report-to (formato Reporting API). Hoje so loga, isso ja
// basta pra olhar nos logs do Vercel durante a janela de migracao pra nonces
// (item 23 da auditoria 2026-05-04). Quando o policy enforced subir e
// report-only sair, o endpoint pode ser desativado.
//
// Body do CSP2 vem como application/csp-report ({ "csp-report": {...} }) e o
// Reporting API manda application/reports+json (array de eventos com type:
// "csp-violation"). Aceitamos os dois formatos pra cobrir browsers atuais.

// `req` aqui e um IncomingMessage do Node, e Vercel SO parseia body
// automaticamente pra application/json e form. Para application/csp-report e
// application/reports+json (que e o que browsers usam), precisamos ler o
// stream cru. Usamos os tipos puros do Node pra nao depender de @vercel/node.
import type { IncomingMessage, ServerResponse } from 'node:http'

type CspReport = {
  'document-uri'?: string
  'violated-directive'?: string
  'effective-directive'?: string
  'blocked-uri'?: string
  'source-file'?: string
  'line-number'?: number
  'column-number'?: number
  'original-policy'?: string
  disposition?: string
}

type ReportingApiEvent = {
  type?: string
  age?: number
  url?: string
  user_agent?: string
  body?: CspReport & { documentURL?: string; effectiveDirective?: string; blockedURL?: string }
}

function pick(report: CspReport | undefined): Record<string, unknown> {
  if (!report) return {}
  return {
    documentUri: report['document-uri'],
    directive: report['effective-directive'] ?? report['violated-directive'],
    blockedUri: report['blocked-uri'],
    sourceFile: report['source-file'],
    line: report['line-number'],
    col: report['column-number'],
    disposition: report.disposition,
  }
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.end()
    return
  }

  let parsed: unknown
  try {
    const raw = await readBody(req)
    parsed = raw ? JSON.parse(raw) : null
  } catch {
    res.statusCode = 204
    res.end()
    return
  }

  try {
    if (Array.isArray(parsed)) {
      const events = parsed as ReportingApiEvent[]
      events
        .filter((e) => e?.type === 'csp-violation' && e.body)
        .forEach((e) => {
          console.log('[csp-violation]', JSON.stringify({
            source: 'reporting-api',
            url: e.url,
            ua: e.user_agent,
            age: e.age,
            ...pick(e.body as CspReport),
          }))
        })
    } else if (parsed && typeof parsed === 'object' && 'csp-report' in parsed) {
      const report = (parsed as { 'csp-report'?: CspReport })['csp-report']
      console.log('[csp-violation]', JSON.stringify({
        source: 'csp2',
        ...pick(report),
      }))
    }
  } catch {
    // Reports invalidos sao silenciados, nao queremos derrubar o endpoint
  }

  res.statusCode = 204
  res.end()
}
