const EmailService = require("./services/emailService");
const MockProviderA = require("./providers/mockProviderA");
const MockProviderB = require("./providers/mockProviderB");

const providers = [new MockProviderA(), new MockProviderB()];
const emailService = new EmailService(providers, {
  maxRetries: 8,
  baseDelay: 500,
  rateLimit: 10,
});

async function main() {
  const email = {
    id: "unique-email-id-1",
    to: "recipient@example.com",
    subject: "Test Email",
    body: "This is a test email.",
  };

  try {
    const result = await emailService.sendEmail(email);
    console.log("Email send result:", result);
  } catch (err) {
    console.error("Can't send email:", err.message);
  }

  console.log("Status:", emailService.getStatus(email.id)); // Status tracking
}

main();
