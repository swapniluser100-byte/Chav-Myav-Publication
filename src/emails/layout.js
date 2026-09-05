// src/emails/layout.js
// Shared branded shell for every outgoing email. Table-based layout + inline
// styles because most email clients strip <style> blocks and flexbox/grid.

const BRAND = {
  ink: '#1E2A28',
  paper: '#F3ECDD',
  maroon: '#8C1F28',
  turmeric: '#C98A2B',
  muted: '#6B6357',
};

const FONT_STACK =
  "'Noto Sans Devanagari','Mangal','Nirmala UI',-apple-system,Segoe UI,Roboto,sans-serif";

/**
 * @param {string} preheader - short hidden preview text
 * @param {string} bodyHtml  - inner HTML (already built by the caller)
 * @param {string} [ctaLabel]
 * @param {string} [ctaUrl]
 */
export function emailLayout({ preheader = '', bodyHtml, ctaLabel, ctaUrl }) {
  return `<!DOCTYPE html>
<html lang="mr">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Chav Myav Publication</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND.paper};font-family:${FONT_STACK};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.paper};padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:560px;background-color:#ffffff;border-radius:6px;overflow:hidden;border:1px solid #E5DCC7;">
          <!-- Header -->
          <tr>
            <td style="background-color:${BRAND.ink};padding:28px 32px;">
              <table role="presentation" width="100%">
                <tr>
                  <td>
                    <span style="font-size:20px;font-weight:700;color:${BRAND.paper};letter-spacing:0.5px;">
                      चव म्याव प्रकाशन
                    </span>
                    <br/>
                    <span style="font-size:11px;color:${BRAND.turmeric};letter-spacing:1px;">CHAV MYAV PUBLICATION</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;color:${BRAND.ink};font-size:15px;line-height:1.7;">
              ${bodyHtml}
              ${
                ctaLabel && ctaUrl
                  ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:24px;">
                      <tr>
                        <td style="border-radius:4px;background-color:${BRAND.maroon};">
                          <a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;">
                            ${ctaLabel}
                          </a>
                        </td>
                      </tr>
                    </table>`
                  : ''
              }
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#FAF6EC;padding:20px 32px;border-top:1px solid #E5DCC7;">
              <p style="margin:0;font-size:12px;color:${BRAND.muted};">
                चव म्याव प्रकाशन · मराठी पुस्तकांचे अस्सल घर<br/>
                या ईमेलला उत्तर देऊ नका असे वाटल्यास आमच्याशी
                <a href="mailto:support@chavmayav.com" style="color:${BRAND.maroon};">support@chavmayav.com</a>
                वर संपर्क साधा.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export const brandColors = BRAND;
