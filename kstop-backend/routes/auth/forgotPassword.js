// ─────────────────────────────────────────────
//  routes/auth/forgotPassword.js
//  POST /api/auth/forgot-password
//
//  Accepts an email, generates a secure reset token, stores it
//  with a 15-minute expiry, and emails the reset link via Resend.
//  Always responds with 200 so we don't leak which emails exist.
//
//  Request body:
//    email
//
//  Returns:
//    200 — generic success message (always, even if email not found)
//    400 — missing email
//    500 — unexpected server error
// ─────────────────────────────────────────────

const crypto = require("crypto");
const { Resend } = require("resend");
const prisma = require("../../lib/prismaClient");

const resend = new Resend(process.env.RESEND_API_KEY);

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const genericResponse = {
      success: true,
      message: "If that email is registered, a password reset link has been sent.",
    };

    // ── Look up user (silently ignore if not found) ────────
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      return res.status(200).json(genericResponse);
    }

    // ── Generate secure token ───────────────────────────────
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Schema allows multiple tokens per user (userId is not unique),
    // so clean up any old ones first, then create a fresh one.
    await prisma.passwordResetToken.deleteMany({
      where: { userId: user.id },
    });

    await prisma.passwordResetToken.create({
      data: { userId: user.id, token: resetToken, expiresAt },
    });

    // ── Build reset URL ─────────────────────────────────────
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:5173";
    const resetUrl = `${frontendBase}/reset-password?token=${resetToken}`;

    // ── Send email via Resend ───────────────────────────────
    const { error: resendError } = await resend.emails.send({
      from: "K-STOP <onboarding@resend.dev>", // swap for verified domain later
      to: normalizedEmail,
      subject: "Reset Your K-STOP Password",
      html: `
        <!DOCTYPE html>
        <html>
          <body style="margin:0;padding:0;background:#0f0f0f;font-family:'Segoe UI',Arial,sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f0f;padding:40px 0;">
              <tr>
                <td align="center">
                  <table width="520" cellpadding="0" cellspacing="0"
                         style="background:#1a1a1a;border-radius:12px;border:1px solid #2a2a2a;overflow:hidden;">
                    <tr>
                      <td style="background:#EB5E28;padding:28px 40px;">
                        <p style="margin:0;font-size:22px;font-weight:700;color:#FFFCF2;letter-spacing:1px;">K-STOP</p>
                        <p style="margin:4px 0 0;font-size:13px;color:#FFFCF2;opacity:0.8;">KIIT Hostel Management</p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:36px 40px;">
                        <p style="margin:0 0 16px;font-size:16px;color:#CCC5B9;">Hi ${user.name},</p>
                        <p style="margin:0 0 28px;font-size:15px;color:#CCC5B9;line-height:1.6;">
                          We received a request to reset your K-STOP password.
                          Click the button below — this link expires in
                          <strong style="color:#EB5E28;">15 minutes</strong>.
                        </p>
                        <div style="text-align:center;margin-bottom:32px;">
                          <a href="${resetUrl}"
                             style="display:inline-block;background:#EB5E28;color:#FFFCF2;text-decoration:none;
                                    padding:14px 36px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:0.5px;">
                            Reset My Password
                          </a>
                        </div>
                        <p style="margin:0 0 8px;font-size:12px;color:#403D39;">
                          If the button doesn't work, copy and paste this link:
                        </p>
                        <p style="margin:0 0 28px;font-size:12px;color:#EB5E28;word-break:break-all;">
                          ${resetUrl}
                        </p>
                        <p style="margin:0;font-size:13px;color:#403D39;line-height:1.6;">
                          If you didn't request a password reset, ignore this email —
                          your password will not change.
                        </p>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:20px 40px;border-top:1px solid #2a2a2a;">
                        <p style="margin:0;font-size:12px;color:#403D39;text-align:center;">
                          © ${new Date().getFullYear()} K-STOP · KIIT University
                        </p>
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

    if (resendError) {
      console.error("[forgot-password] Resend error:", resendError);
      // Don't expose the internal failure — still return generic success
    }

    return res.status(200).json(genericResponse);

  } catch (error) {
    console.error("[forgot-password] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
}

module.exports = { forgotPassword };