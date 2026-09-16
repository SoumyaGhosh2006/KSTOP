// ─────────────────────────────────────────────
//  routes/auth/sendOtp.js
//  POST /api/auth/send-otp
//
//  Call this BEFORE register. Generates a 6-digit OTP,
//  stores a keyed hash with a 10-minute expiry, and emails it.
// ─────────────────────────────────────────────

const crypto = require("crypto");
const prisma = require("../../lib/prismaClient");
const { sendEmail } = require("../../services/email");

const OTP_TTL_MS = 10 * 60 * 1000;
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;

function hashOtp(otp) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required for OTP protection.");
  }

  return crypto
    .createHmac("sha256", secret)
    .update(String(otp).trim())
    .digest("hex");
}

async function sendOtp(req, res) {
  try {
    const { email, role, phone, rollNumber } = req.body || {};

    if (!email || typeof email !== "string") {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Parent registration is allowed only when the supplied
    // email + phone + child roll number match an official registry record.
    // Keep the response generic so this endpoint cannot be used to
    // discover which parent records exist.
    if (role === "parent") {
      if (
        typeof phone !== "string" ||
        typeof rollNumber !== "string" ||
        !phone.trim() ||
        !rollNumber.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Parent email, phone number, and child roll number are required.",
        });
      }

      const parentRecord = await prisma.parentRegistry.findFirst({
        where: {
          email: normalizedEmail,
          phone: phone.trim(),
          childRollNumber: rollNumber.trim(),
        },
      });

      if (!parentRecord) {
        return res.status(400).json({
          success: false,
          message: "Parent details do not match our records.",
        });
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "This email is already registered.",
      });
    }

    const existingOtp = await prisma.otp.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingOtp) {
      const elapsed = Date.now() - new Date(existingOtp.createdAt).getTime();

      if (elapsed < OTP_RESEND_COOLDOWN_MS) {
        return res.status(429).json({
          success: false,
          message: "Please wait before requesting another verification code.",
        });
      }
    }

    const otp = crypto.randomInt(100000, 1000000).toString();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS);
    const hashedOtp = hashOtp(otp);

    await prisma.otp.upsert({
      where: { email: normalizedEmail },
      update: {
        otp: hashedOtp,
        expiresAt,
        verified: false,
        createdAt: new Date(),
      },
      create: {
        email: normalizedEmail,
        otp: hashedOtp,
        expiresAt,
        verified: false,
      },
    });

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "Your K-STOP Verification Code",
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
                          <p style="margin:0 0 16px;font-size:16px;color:#CCC5B9;">Hey there,</p>
                          <p style="margin:0 0 28px;font-size:15px;color:#CCC5B9;line-height:1.6;">
                            Use the verification code below to complete your K-STOP registration.
                            This code expires in <strong style="color:#EB5E28;">10 minutes</strong>.
                          </p>
                          <div style="background:#252422;border-radius:10px;padding:28px;text-align:center;
                                      border:1px solid #403D39;margin-bottom:28px;">
                            <p style="margin:0 0 8px;font-size:12px;color:#CCC5B9;letter-spacing:2px;text-transform:uppercase;">
                              Verification Code
                            </p>
                            <p style="margin:0;font-size:42px;font-weight:700;letter-spacing:12px;color:#EB5E28;">
                              ${otp}
                            </p>
                          </div>
                          <p style="margin:0;font-size:13px;color:#403D39;line-height:1.6;">
                            If you didn't request this, you can safely ignore this email.
                            Do not share this code with anyone.
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
    } catch (emailError) {
      console.error("[send-otp] Email provider error:", emailError.message);

      // Do not leave an OTP active when delivery failed.
      await prisma.otp.deleteMany({
        where: { email: normalizedEmail },
      });

      return res.status(500).json({
        success: false,
        message: "Failed to send OTP email. Try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully. Check your email.",
    });
  } catch (error) {
    console.error("[send-otp] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
}

module.exports = { sendOtp };
