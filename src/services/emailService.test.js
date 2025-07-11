const EmailService = require("./emailService");

class AlwaysSuccessProvider {
  constructor() {
    this.name = "AlwaysSuccess";
  }
  async send(email) {
    return true;
  }
}

class AlwaysFailProvider {
  constructor() {
    this.name = "AlwaysFail";
  }
  async send(email) {
    throw new Error("fail");
  }
}

describe("EmailService", () => {
  test("sends email successfully with first provider", async () => {
    const service = new EmailService([new AlwaysSuccessProvider()], {
      maxRetries: 2,
      rateLimit: 2,
    });
    const email = { id: "id-1", to: "a@b.com", subject: "s", body: "b" };
    const result = await service.sendEmail(email);
    expect(result.status).toBe("sent");
    expect(result.provider).toBe("AlwaysSuccess");
  });

  test("falls back to second provider on failure", async () => {
    const service = new EmailService(
      [new AlwaysFailProvider(), new AlwaysSuccessProvider()],
      { maxRetries: 1 }
    );
    const email = { id: "id-2", to: "a@b.com", subject: "s", body: "b" };
    const result = await service.sendEmail(email);
    expect(result.status).toBe("sent");
    expect(result.provider).toBe("AlwaysSuccess");
  });

  test("prevents duplicate sends (idempotency)", async () => {
    const service = new EmailService([new AlwaysSuccessProvider()], {});
    const email = { id: "id-3", to: "a@b.com", subject: "s", body: "b" };
    await service.sendEmail(email);
    const result = await service.sendEmail(email);
    expect(result.status).toBe("duplicate");
  });

  test("rate limiting works", async () => {
    const service = new EmailService([new AlwaysSuccessProvider()], {
      rateLimit: 1,
    });
    const email1 = { id: "id-4", to: "a@b.com", subject: "s", body: "b" };
    const email2 = { id: "id-5", to: "a@b.com", subject: "s", body: "b" };
    await service.sendEmail(email1);
    await expect(service.sendEmail(email2)).rejects.toThrow(
      "Rate limit exceeded"
    );
  });

  test("status tracking works", async () => {
    const service = new EmailService([new AlwaysSuccessProvider()], {});
    const email = { id: "id-6", to: "a@b.com", subject: "s", body: "b" };
    await service.sendEmail(email);
    const status = service.getStatus(email.id);
    expect(status.status).toBe("sent");
    expect(status.lastProvider).toBe("AlwaysSuccess");
  });
});
