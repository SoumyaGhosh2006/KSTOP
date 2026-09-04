const { sendWithBrevo } = require("./brevoProvider");

const providers = {
  brevo: sendWithBrevo,
};

async function sendEmail({ to, subject, html, text }) {
  const providerName = (process.env.EMAIL_PROVIDER || "brevo").trim().toLowerCase();
  const provider = providers[providerName];

  if (!provider) {
    throw new Error(`Unsupported email provider: ${providerName}`);
  }

  return provider({ to, subject, html, text });
}

module.exports = { sendEmail };
