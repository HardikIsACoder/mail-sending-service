class MockProviderA {
  constructor() {
    this.name = "MockProviderA";
  }
  async send(email) {
    if (Math.random() > 0.5) throw new Error("MockProviderA failed"); // Random fails
    return true;
  }
}

module.exports = MockProviderA;
