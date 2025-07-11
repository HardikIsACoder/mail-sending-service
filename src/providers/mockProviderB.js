class MockProviderB {
  constructor() {
    this.name = "MockProviderB";
  }
  async send(email) {
    if ((Math.random() * 10) % 2 == 0) throw new Error("MockProviderB failed"); // Random fails
    return true;
  }
}

module.exports = MockProviderB;
