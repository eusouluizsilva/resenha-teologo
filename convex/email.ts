// Infraestrutura de envio de email via Resend. Graceful fallback: sem a env
// RESEND_API_KEY a função registra no log e retorna success=false em vez de
// quebrar o fluxo que chamou. Todos os templates herdam a mesma base HTML
// (Source Serif 4 no título, Inter no corpo, botão laranja da marca).
//
// Env necessárias em produção:
//   RESEND_API_KEY   → api.resend.com Bearer
//   RESEND_FROM      → ex. "Resenha do Teólogo <hello@resenhadoteologo.com>"

'use node'

import { v } from 'convex/values'
import { internalAction } from './_generated/server'

declare const process: { env: Record<string, string | undefined> }

type SendResult = { success: boolean; skipped?: boolean; error?: string }

const DEFAULT_FROM = 'Resenha do Teólogo <hello@resenhadoteologo.com>'

async function sendViaResend(params: {
  to: string
  subject: string
  html: string
  from?: string
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log('[email] RESEND_API_KEY ausente. Email não enviado:', params.subject, '→', params.to)
    return { success: false, skipped: true }
  }

  const from = params.from ?? process.env.RESEND_FROM ?? DEFAULT_FROM

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      console.error('[email] Resend retornou', res.status, text)
      return { success: false, error: `http_${res.status}` }
    }

    return { success: true }
  } catch (err) {
    console.error('[email] Falha ao enviar via Resend:', err)
    return { success: false, error: String(err) }
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Template base. Renderiza um container centralizado com a marca no topo,
// título editorial em Source Serif 4 e corpo em Inter. Inline styles porque
// muitos clientes de email não aceitam <style> externo.

function baseHtml(params: { title: string; intro: string; cta?: { label: string; url: string }; footer?: string }): string {
  const { title, intro, cta, footer } = params
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#0F141A;font-family:Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;color:#111827;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0F141A;padding:48px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 30px 80px rgba(0,0,0,0.35);">
          <tr>
            <td style="padding:32px 40px 16px 40px;background:#0F141A;text-align:center;">
              <div style="font-family:'Source Serif 4', Georgia, serif;color:#ffffff;font-size:20px;font-weight:700;letter-spacing:0.04em;">
                Resenha do Teólogo
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:40px 40px 32px 40px;">
              <h1 style="margin:0 0 16px 0;font-family:'Source Serif 4', Georgia, serif;font-size:26px;line-height:1.25;color:#111827;font-weight:700;">
                ${escapeHtml(title)}
              </h1>
              <div style="font-size:15px;line-height:1.7;color:#334155;">
                ${intro}
              </div>
              ${cta ? `
              <div style="margin:28px 0 8px 0;">
                <a href="${escapeAttr(cta.url)}" style="display:inline-block;background:#F37E20;color:#ffffff;font-size:14px;font-weight:600;padding:12px 22px;border-radius:12px;text-decoration:none;">
                  ${escapeHtml(cta.label)}
                </a>
              </div>
              ` : ''}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px 28px 40px;border-top:1px solid #F1F1EE;font-size:12px;line-height:1.6;color:#6B7280;text-align:center;">
              ${footer ?? 'Você recebeu este email porque criou uma conta em resenhadoteologo.com'}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch] as string))
}

function escapeAttr(s: string): string {
  return escapeHtml(s)
}

// ──────────────────────────────────────────────────────────────────────────────
// Actions expostas para fluxos internos. Todas retornam SendResult; nenhum
// lançamento de erro interrompe o fluxo que chamou.

export const sendWelcome = internalAction({
  args: { to: v.string(), name: v.string() },
  handler: async (_ctx, { to, name }): Promise<SendResult> => {
    return await sendViaResend({
      to,
      subject: 'Bem-vindo à Resenha do Teólogo',
      html: baseHtml({
        title: `Olá, ${name}`,
        intro: `
          <p>Estamos felizes em ter você aqui. Na Resenha do Teólogo, todo o conteúdo é gratuito, o ritmo é seu e o objetivo é o mesmo: formar com profundidade.</p>
          <p>Ative sua função (Aluno, Criador ou Instituição) no painel e comece pelo catálogo de cursos.</p>
        `,
        cta: { label: 'Abrir meu painel', url: 'https://resenhadoteologo.com/dashboard' },
      }),
    })
  },
})

export const sendCertificateIssued = internalAction({
  args: { to: v.string(), name: v.string(), courseTitle: v.string() },
  handler: async (_ctx, { to, name, courseTitle }): Promise<SendResult> => {
    return await sendViaResend({
      to,
      subject: `Seu certificado em "${courseTitle}" está pronto`,
      html: baseHtml({
        title: 'Certificado emitido',
        intro: `
          <p>Parabéns, ${escapeHtml(name)}. Você concluiu <strong>${escapeHtml(courseTitle)}</strong> com aproveitamento suficiente para receber seu certificado.</p>
          <p>Você pode visualizar e baixar o PDF diretamente no seu painel.</p>
        `,
        cta: { label: 'Ver meus certificados', url: 'https://resenhadoteologo.com/dashboard/certificados' },
      }),
    })
  },
})

export const sendInstitutionInvite = internalAction({
  args: {
    to: v.string(),
    institutionName: v.string(),
    inviteUrl: v.string(),
  },
  handler: async (_ctx, { to, institutionName, inviteUrl }): Promise<SendResult> => {
    return await sendViaResend({
      to,
      subject: `Convite para ${institutionName} na Resenha do Teólogo`,
      html: baseHtml({
        title: `Você foi convidado para ${institutionName}`,
        intro: `
          <p>A instituição <strong>${escapeHtml(institutionName)}</strong> convidou você para fazer parte da equipe na plataforma Resenha do Teólogo.</p>
          <p>O link abaixo é pessoal e expira em 7 dias.</p>
        `,
        cta: { label: 'Aceitar convite', url: inviteUrl },
      }),
    })
  },
})
