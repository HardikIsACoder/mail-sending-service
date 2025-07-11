class MockProviderB {
  constructor() {
    this.name = "MockProviderB";
  }
  async send(email) {
    if (Math.random() > 0.5) throw new Error("MockProviderB failed"); // Random fails
    return true;
  }
}

module.exports = MockProviderB;
