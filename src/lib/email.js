import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendMatchAlert(matches, appUrl) {
  if (!matches.length) return;

  const matchRows = matches
    .map((m) => {
      const keywords = m.matched_keywords.join(', ');
      const snippet = m.selftext_snippet
        ? `<p style="color:#94a3b8;font-size:13px;margin:4px 0 0 0;">${escapeHtml(m.selftext_snippet.substring(0, 200))}${m.selftext_snippet.length > 200 ? '...' : ''}</p>`
        : '';
      return `
        <div style="border:1px solid #1e293b;border-radius:8px;padding:16px;margin-bottom:12px;background:#0f172a;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px;">
            <span style="background:#1e1b4b;color:#a78bfa;padding:2px 10px;border-radius:4px;font-size:12px;font-weight:600;">r/${escapeHtml(m.subreddit)}</span>
            <span style="color:#64748b;font-size:12px;">${m.num_comments} comments · score ${m.score}</span>
          </div>
          <a href="${escapeHtml(m.url)}" style="color:#e2e8f0;font-size:15px;font-weight:600;text-decoration:none;line-height:1.4;">${escapeHtml(m.title)}</a>
          ${snippet}
          <div style="margin-top:10px;">
            <span style="color:#64748b;font-size:11px;">Matched: </span>
            <span style="color:#a78bfa;font-size:11px;">${escapeHtml(keywords)}</span>
          </div>
          <div style="margin-top:12px;display:flex;gap:8px;">
            <a href="${escapeHtml(m.url)}" style="background:#7c3aed;color:white;padding:6px 14px;border-radius:6px;font-size:12px;text-decoration:none;font-weight:500;">Open in Reddit</a>
            <a href="${appUrl}?highlight=${m.id}" style="background:#1e293b;color:#cbd5e1;padding:6px 14px;border-radius:6px;font-size:12px;text-decoration:none;font-weight:500;">View in Dashboard</a>
          </div>
        </div>`;
    })
    .join('');

  const html = `
    <div style="background:#020617;padding:32px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
      <div style="max-width:600px;margin:0 auto;">
        <div style="margin-bottom:24px;">
          <span style="color:#a78bfa;font-size:20px;font-weight:700;">WorkCentral</span>
          <span style="color:#475569;font-size:20px;font-weight:300;"> Monitor</span>
        </div>
        <p style="color:#cbd5e1;font-size:15px;margin-bottom:20px;">
          Found <strong style="color:#a78bfa;">${matches.length}</strong> new Reddit ${matches.length === 1 ? 'match' : 'matches'} for your keywords.
        </p>
        ${matchRows}
        <div style="margin-top:24px;padding-top:16px;border-top:1px solid #1e293b;">
          <a href="${appUrl}" style="color:#7c3aed;font-size:13px;text-decoration:none;">Open Dashboard →</a>
        </div>
      </div>
    </div>`;

  try {
    await resend.emails.send({
      from: 'Reddit Monitor <onboarding@resend.dev>',
      to: process.env.ALERT_EMAIL_TO,
      subject: `🔍 ${matches.length} new Reddit ${matches.length === 1 ? 'match' : 'matches'} — ${matches.map((m) => 'r/' + m.subreddit).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`,
      html,
    });
    return true;
  } catch (error) {
    console.error('Email send failed:', error);
    return false;
  }
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
