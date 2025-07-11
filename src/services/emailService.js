class CircuitBreaker {
  constructor(failureThreshold = 3, cooldownTime = 60000) {
    // one min cooldown time
    this.failureThreshold = failureThreshold;
    this.cooldownTime = cooldownTime;
    this.failures = 0;
    this.state = "CLOSED";
    this.nextTry = Date.now();
  }

  canRequest() {
    if (this.state === "OPEN" && Date.now() > this.nextTry) {
      this.state = "HALF";
      return true;
    }
    return this.state !== "OPEN";
  }

  success() {
    this.failures = 0;
    this.state = "CLOSED";
  }

  failure() {
    this.failures++;
    if (this.failures >= this.failureThreshold) {
      this.state = "OPEN";
      this.nextTry = Date.now() + this.cooldownTime;
    }
  }
}

class EmailService {
  constructor(providers, options = {}) {
    this.providers = providers;
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 500; // ms
    this.sentEmails = new Set(); // For idempotency
    this.rateLimit = options.rateLimit || 5; // emails per minute
    this.sentTimestamps = [];
    this.status = {}; // { emailId: { status, attempts, lastProvider, error } }
    this.queue = [];
    this.processing = false;
    // Circuit breaker per provider
    this.circuitBreakers = providers.map(() => new CircuitBreaker(3, 10000));
  }

  async sendEmail(email) {
    // Add to queue and process
    return new Promise((resolve, reject) => {
      this.queue.push({ email, resolve, reject });
      this._processQueue();
    });
  }

  async _processQueue() {
    if (this.processing) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const { email, resolve, reject } = this.queue.shift();
      try {
        const result = await this._sendEmailInternal(email);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    }
    this.processing = false;
  }

  async _sendEmailInternal(email) {
    const emailId = email.id;
    if (!emailId)
      throw new Error("Email must have a unique id for idempotency.");

    // Idempotency
    if (this.sentEmails.has(emailId)) {
      this._log(`Duplicate send prevented for ${emailId}`);
      this._updateStatus(emailId, "duplicate", 0, null, null);
      return { status: "duplicate", message: "Email already sent." };
    }

    // Rate limiting
    const now = Date.now();
    this.sentTimestamps = this.sentTimestamps.filter((ts) => now - ts < 60000);
    if (this.sentTimestamps.length >= this.rateLimit) {
      this._log(`Rate limit exceeded for ${emailId}`);
      this._updateStatus(emailId, "rate_limited", 0, null, null);
      throw new Error("Rate limit exceeded");
    }

    let lastError = null;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      for (let i = 0; i < this.providers.length; i++) {
        const provider = this.providers[i];
        const cb = this.circuitBreakers[i];
        if (!cb.canRequest()) {
          this._log(
            `Provider ${provider.name} is in circuit breaker OPEN state`
          );
          continue;
        }
        try {
          this._log(`Attempt ${attempt} with ${provider.name} for ${emailId}`);
          await provider.send(email);
          cb.success();
          this.sentEmails.add(emailId);
          this.sentTimestamps.push(now);
          this._updateStatus(emailId, "sent", attempt, provider.name, null);
          this._log(`Email ${emailId} sent via ${provider.name}`);
          return { status: "sent", provider: provider.name, attempts: attempt };
        } catch (err) {
          cb.failure();
          lastError = err;
          this._updateStatus(
            emailId,
            "failed",
            attempt,
            provider.name,
            err.message
          );
          this._log(
            `Provider ${provider.name} failed for ${emailId}: ${err.message}`
          );
        }
      }
      // Exponential backoff
      await this._delay(this.baseDelay * Math.pow(2, attempt - 1));
    }
    this._updateStatus(
      emailId,
      "failed",
      this.maxRetries,
      null,
      lastError && lastError.message
    );
    this._log(`All providers failed for ${emailId}`);
    throw new Error(
      "All providers failed after retries: " + (lastError && lastError.message)
    );
  }

  getStatus(emailId) {
    return this.status[emailId] || null;
  }

  _updateStatus(emailId, status, attempts, provider, error) {
    this.status[emailId] = { status, attempts, lastProvider: provider, error };
  }

  _delay(ms) {
    return new Promise((res) => setTimeout(res, ms));
  }

  _log(msg) {
    console.log(`[EmailService] ${new Date().toISOString()} - ${msg}`);
  }
}

module.exports = EmailService;
