// STIKDEAD :: motor de emails — SendGrid via REST, layouts da casa
// ENV: SENDGRID_API_KEY, EMAIL_FROM (remetente verificado no SendGrid)
import { q } from './db.js';

const KEY = process.env.SENDGRID_API_KEY || '';
const FROM = process.env.EMAIL_FROM || 'stikdead@stikdead.com';
const SITE = process.env.PUBLIC_URL || 'https://game.stikdead.com';

export const emailEnabled = () => !!KEY;

// ===== layout base: topo com logo, corpo escuro, rodapé pronto =====
export function baseLayout({ title, bodyHtml, ctaText, ctaUrl }) {
  const cta = ctaText
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto 8px;">
        <tr><td style="border-radius:10px;background:linear-gradient(180deg,#e3163e,#a80a26);box-shadow:0 4px 18px rgba(217,4,41,.45);">
          <a href="${ctaUrl || SITE}" style="display:inline-block;padding:14px 38px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;letter-spacing:.08em;color:#ffffff;text-decoration:none;text-transform:uppercase;">${ctaText}</a>
        </td></tr></table>`
    : '';
  return `<!DOCTYPE html>
<html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;padding:0;background:#0b0709;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0b0709;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
  <!-- topo -->
  <tr><td align="center" style="padding:10px 0 18px;">
    <a href="${SITE}"><img src="${SITE}/logo.webp" alt="STIKDEAD" width="190" style="display:block;border:0;"></a>
  </td></tr>
  <tr><td style="height:3px;background:linear-gradient(90deg,transparent,#d90429,transparent);"></td></tr>
  <!-- corpo -->
  <tr><td style="background:linear-gradient(180deg,#171114,#100b0e);border:1px solid #2b1a20;border-top:none;border-radius:0 0 14px 14px;padding:34px 34px 30px;">
    <h1 style="margin:0 0 16px;font-family:Arial Black,Arial,sans-serif;font-size:24px;letter-spacing:.04em;color:#f2efe9;text-transform:uppercase;">${title}</h1>
    <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#cfc8c0;">
      ${bodyHtml}
    </div>
    ${cta}
  </td></tr>
  <!-- rodapé -->
  <tr><td align="center" style="padding:22px 10px 8px;">
    <p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#6e675e;">
      ⚔️ <a href="${SITE}" style="color:#d90429;text-decoration:none;font-weight:bold;">game.stikdead.com</a> — entre na arena
    </p>
    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#544e47;">
      Você recebe este email porque tem uma conta no STIKDEAD.<br>© ${new Date().getFullYear()} STIKDEAD. Todos os direitos reservados.
    </p>
  </td></tr>
</table>
</td></tr></table>
</body></html>`;
}

// ===== envio (SendGrid REST; personalizations em lotes de 900) =====
export async function sendEmail({ to, subject, html }) {
  if (!KEY) return { ok: false, error: 'SENDGRID_API_KEY ausente' };
  const list = Array.isArray(to) ? to : [to];
  const chunks = [];
  for (let i = 0; i < list.length; i += 900) chunks.push(list.slice(i, i + 900));
  let sent = 0;
  for (const chunk of chunks) {
    const r = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({
        personalizations: chunk.map((email) => ({ to: [{ email }] })),
        from: { email: FROM, name: 'STIKDEAD' },
        subject,
        content: [{ type: 'text/html', value: html }],
        tracking_settings: {
          click_tracking: { enable: false, enable_text: false },
          open_tracking: { enable: false },
        },
      }),
    });
    if (r.status === 202) sent += chunk.length;
    else console.error('SendGrid:', r.status, (await r.text()).slice(0, 300));
  }
  return { ok: sent > 0, sent };
}

// ===== transacionais =====
export async function sendWelcome(email, fighterName) {
  const html = baseLayout({
    title: 'Conta criada com sucesso',
    bodyHtml: `
      <p>Olá, <strong style="color:#f2efe9;">${fighterName || 'lutador'}</strong>.</p>
      <p>Confirmamos a criação da sua conta no STIKDEAD com o email <strong style="color:#f2efe9;">${email}</strong>.</p>
      <p>Você já pode fazer login e começar a jogar. Se não foi você quem criou esta conta, pode ignorar esta mensagem.</p>`,
    ctaText: 'Acessar minha conta',
    ctaUrl: SITE,
  });
  return sendEmail({ to: email, subject: 'Sua conta no STIKDEAD foi criada', html });
}

export async function sendPurchaseConfirmed(email, { fighterName, diamonds, amountCents, mpPaymentId }) {
  const html = baseLayout({
    title: 'Compra confirmada!',
    bodyHtml: `
      <p>Salve, <strong style="color:#f2efe9;">${fighterName || 'lutador'}</strong>!</p>
      <p>Seu pagamento foi aprovado e os diamantes já estão na sua conta:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;border:1px solid rgba(127,217,255,.35);border-radius:12px;background:rgba(18,40,64,.35);">
        <tr><td style="padding:18px 22px;font-family:Arial,Helvetica,sans-serif;">
          <div style="font-size:26px;font-weight:bold;color:#bfefff;">💎 ${Number(diamonds).toLocaleString('pt-BR')} diamantes</div>
          <div style="font-size:14px;color:#9fc4ff;margin-top:4px;">R$ ${(amountCents / 100).toFixed(2).replace('.', ',')} · via Mercado Pago</div>
          <div style="font-size:12px;color:#6e8db0;margin-top:8px;">Nº da transação: MP #${mpPaymentId}</div>
        </td></tr>
      </table>
      <p>Corre para a loja — a Série Diamante te espera. ✨</p>`,
    ctaText: 'Abrir a loja 💎',
    ctaUrl: `${SITE}/loja`,
  });
  return sendEmail({ to: email, subject: '💎 Seus diamantes chegaram — STIKDEAD', html });
}

export async function sendPasswordReset(email, resetUrl) {
  const html = baseLayout({
    title: 'Redefinir sua senha',
    bodyHtml: `
      <p>Recebemos um pedido para redefinir a senha da sua conta no <strong>STIKDEAD</strong>.</p>
      <p>Se foi você, o botão abaixo abre a tela de nova senha. <strong style="color:#f2efe9;">O link vale por 1 hora</strong> e só funciona uma vez.</p>
      <p style="margin-top:14px;padding-left:6px;border-left:3px solid #d90429;color:#a89f96;font-size:13px;">
        Não pediu? Pode ignorar este email — sua senha continua a mesma e ninguém acessou sua conta.
      </p>`,
    ctaText: 'Criar nova senha',
    ctaUrl: resetUrl,
  });
  return sendEmail({ to: email, subject: '🔑 Redefinir senha — STIKDEAD', html });
}

// ===== broadcast (o miolo vem do admin; topo/rodapé prontos) =====
export function broadcastHtml(message) {
  const safe = String(message)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
  return baseLayout({
    title: 'Chamado da arena',
    bodyHtml: `<p style="white-space:normal;">${safe}</p>`,
    ctaText: 'Jogar agora',
    ctaUrl: SITE,
  });
}

export async function sendBroadcast(subject, message, onlyTo = null) {
  const html = broadcastHtml(message);
  let emails;
  if (onlyTo) emails = [onlyTo];
  else {
    const { rows } = await q('SELECT email FROM users WHERE email IS NOT NULL');
    emails = rows.map((r) => r.email);
  }
  const r = await sendEmail({ to: emails, subject, html });
  return { ...r, total: emails.length };
}
