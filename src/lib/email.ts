import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
const FROM = process.env.RESEND_FROM_EMAIL || 'CreatorPost <noreply@creatorpost.app>';

/**
 * Sends a "post published" confirmation email to the user.
 */
export async function sendPostPublishedEmail({
  to,
  userName,
  platforms,
  postContent,
}: {
  to: string;
  userName: string;
  platforms: string[];
  postContent: string;
}) {
  const platformList = platforms
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(', ');

  const preview = postContent.length > 120
    ? postContent.slice(0, 120) + '...'
    : postContent;

  await resend.emails.send({
    from: FROM,
    to,
    subject: `✅ Your post is live on ${platformList}!`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        </head>
        <body style="margin:0;padding:0;background:#09090b;font-family:'Inter',system-ui,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#09090b;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="560" cellpadding="0" cellspacing="0" style="background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;max-width:100%;">
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#7F77DD,#5a52bb);padding:32px;text-align:center;">
                      <div style="font-size:28px;font-weight:800;color:#fff;letter-spacing:-0.5px;">CreatorPost</div>
                      <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:4px;">AI Social Media Scheduler</div>
                    </td>
                  </tr>
                  <!-- Body -->
                  <tr>
                    <td style="padding:32px;">
                      <div style="font-size:22px;font-weight:700;color:#fff;margin-bottom:8px;">
                        🎉 Your post is live!
                      </div>
                      <div style="font-size:14px;color:#a1a1aa;margin-bottom:24px;">
                        Hi ${userName}, your scheduled post has been published successfully.
                      </div>

                      <!-- Post preview -->
                      <div style="background:#27272a;border-radius:12px;padding:16px;margin-bottom:24px;border-left:3px solid #7F77DD;">
                        <div style="font-size:12px;color:#a1a1aa;margin-bottom:8px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Post Preview</div>
                        <div style="font-size:14px;color:#e4e4e7;line-height:1.6;">${preview}</div>
                      </div>

                      <!-- Platforms -->
                      <div style="margin-bottom:28px;">
                        <div style="font-size:12px;color:#a1a1aa;margin-bottom:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.5px;">Published to</div>
                        <div style="display:flex;flex-wrap:wrap;gap:8px;">
                          ${platforms.map(p => `
                            <span style="background:#3f3f46;color:#e4e4e7;padding:4px 12px;border-radius:20px;font-size:12px;font-weight:500;">
                              ${p.charAt(0).toUpperCase() + p.slice(1)}
                            </span>
                          `).join('')}
                        </div>
                      </div>

                      <!-- CTA -->
                      <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/analytics" 
                         style="display:inline-block;background:#7F77DD;color:#fff;padding:12px 28px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;">
                        View Analytics →
                      </a>
                    </td>
                  </tr>
                  <!-- Footer -->
                  <tr>
                    <td style="background:#0c0c0e;padding:20px 32px;border-top:1px solid #27272a;">
                      <div style="font-size:12px;color:#52525b;text-align:center;">
                        You're receiving this because you scheduled a post on CreatorPost.<br/>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/settings" style="color:#7F77DD;text-decoration:none;">Manage notifications</a>
                      </div>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}

/**
 * Sends a "post failed" alert email.
 */
export async function sendPostFailedEmail({
  to,
  userName,
  platforms,
  errorMessage,
}: {
  to: string;
  userName: string;
  platforms: string[];
  errorMessage: string;
}) {
  await resend.emails.send({
    from: FROM,
    to,
    subject: `⚠️ Post failed to publish`,
    html: `
      <!DOCTYPE html>
      <html>
        <body style="margin:0;padding:40px 20px;background:#09090b;font-family:'Inter',system-ui,sans-serif;">
          <div style="max-width:560px;margin:0 auto;background:#18181b;border-radius:16px;border:1px solid #27272a;overflow:hidden;">
            <div style="background:#ef4444;padding:24px 32px;">
              <div style="font-size:20px;font-weight:700;color:#fff;">⚠️ Post Failed to Publish</div>
            </div>
            <div style="padding:32px;">
              <p style="color:#a1a1aa;font-size:14px;margin:0 0 16px;">Hi ${userName}, we were unable to publish your post to ${platforms.join(', ')}.</p>
              <div style="background:#27272a;border-radius:10px;padding:14px;margin-bottom:24px;border-left:3px solid #ef4444;">
                <div style="font-size:12px;color:#f87171;">${errorMessage}</div>
              </div>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/compose" 
                 style="background:#7F77DD;color:#fff;padding:12px 24px;border-radius:10px;font-weight:600;font-size:14px;text-decoration:none;display:inline-block;">
                Try Again →
              </a>
            </div>
          </div>
        </body>
      </html>
    `,
  });
}
