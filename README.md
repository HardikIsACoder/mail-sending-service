# Email Sending Service

A resilient Node.js email sending service featuring:

- Retry mechanism with exponential backoff
- Fallback between multiple providers
- Idempotency (prevents duplicate sends)
- Basic rate limiting
- Status tracking for each email
- Circuit breaker pattern for providers
- Simple logging
- Basic FIFO queue system

---

## **Project Structure**

```
src/
  index.js
  services/
    emailService.js
  providers/
    mockProviderA.js
    mockProviderB.js
package.json
README.md
```

---

## **Setup**

1. **Clone the repository**

   ```
   git clone <your-repo-url>
   cd email-sending-service
   ```

2. **Install dependencies**
   ```
   npm install
   ```

---

## **Running the Service**

To send a test email using the mock providers:

```
npm start
```

You should see logs and the result in your terminal.

---

## **Running Tests**

This project uses [Jest](https://jestjs.io/) for testing.

To run all tests:

```
npm test
```

Tests cover:

- Successful email sending
- Fallback between providers
- Idempotency (duplicate prevention)
- Rate limiting
- Status tracking

---

## **Customization**

- Add real providers in `src/providers/`.
- Adjust retry, rate limit, and other options in `src/index.js`.
- Extend the `EmailService` for more advanced features.

---

## **License**

MIT
