class MockProviderA {
  constructor() {
    this.name = "MockProviderA";
  }
  async send(email) {
    if ((Math.random() * 10) % 2 == 0) throw new Error("MockProviderA failed"); // Random fails
    return true;
  }
}

module.exports = MockProviderA;
