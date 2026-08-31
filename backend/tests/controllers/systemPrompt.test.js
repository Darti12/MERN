// The chatbot's system prompt states Filip's age. It used to be hardcoded and
// had silently drifted three years out of date — the bot confidently told
// visitors the wrong number. It is now derived from a birthdate, and these
// tests pin the boundary behaviour so a future refactor cannot reintroduce an
// off-by-one that nobody would notice until someone read a transcript.

const { currentAge, buildSystemPrompt } = require("../../controllers/chatController");

const on = (iso) => new Date(iso); // Filip's birthday: 16 August 1997.

describe("currentAge", () => {
  it("has not counted the birthday the day before it", () => {
    expect(currentAge(on("2026-08-15T23:59:59Z"))).toBe(28);
  });

  it("counts the birthday on the day itself", () => {
    expect(currentAge(on("2026-08-16T00:00:00Z"))).toBe(29);
  });

  it("keeps the new age the day after", () => {
    expect(currentAge(on("2026-08-17T12:00:00Z"))).toBe(29);
  });

  it("is still the previous age early in the following year", () => {
    expect(currentAge(on("2027-01-01T00:00:00Z"))).toBe(29);
  });

  it("rolls over on the next birthday", () => {
    expect(currentAge(on("2027-08-16T00:00:00Z"))).toBe(30);
  });
});

describe("buildSystemPrompt", () => {
  it("states the computed age rather than a hardcoded one", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain(`${currentAge()} years old`);
    expect(prompt).not.toContain("27 years old"); // the value that went stale
  });

  it("includes Autodesk among the customers and its experience", () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain("Autodesk");
    expect(prompt).toContain("A/B testing");
    expect(prompt).toContain("Mixpanel");
    expect(prompt).toContain("event tracking");
    expect(prompt).toContain("collecting user feedback");
    expect(prompt).toContain("product growth");
  });

  it("keeps the personal detail that makes the bot sound like Filip", () => {
    // Not decoration: visitors ask what he is like, and these are the only
    // non-professional facts the bot has. Easy to lose in a careless edit.
    const prompt = buildSystemPrompt();
    for (const hobby of [
      "board games",
      "bouldering",
      "read books",
      "3D-printing",
      "flying drones",
      "Mocca",
    ]) {
      expect(prompt).toContain(hobby);
    }
  });
});
