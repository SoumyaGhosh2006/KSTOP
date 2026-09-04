const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

async function sendWithBrevo({ to, subject, html, text }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.EMAIL_FROM;
  const senderName = process.env.EMAIL_FROM_NAME || "K-STOP";

  if (!apiKey) {
    throw new Error("BREVO_API_KEY is not configured.");
  }

  if (!senderEmail) {
    throw new Error("EMAIL_FROM is not configured.");
  }

  const response = await fetch(BREVO_API_URL, {
    method: "POST",
    headers: {
      accept: "application/json",
      "api-key": apiKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: senderEmail,
        name: senderName,
      },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      ...(text ? { textContent: text } : {}),
    }),
  });

  if (!response.ok) {
    let details = "Brevo email request failed.";

    try {
      const body = await response.json();
      if (body?.message) {
        details = body.message;
      }
    } catch {
      // Keep the generic provider error if Brevo did not return JSON.
    }

    const error = new Error(details);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

module.exports = { sendWithBrevo };
