import { describe, expect, it, vi } from "vitest";

vi.mock("../auth/AuthContext", () => ({ useAuth: () => ({ state: {} }) }));

const { formatMessageTime } = await import("./messages");

describe("formatMessageTime", () => {
  const now = new Date(2026, 10, 18, 15, 0);

  it("shows only the time for today", () => {
    expect(formatMessageTime(new Date(2026, 10, 18, 9, 5).toISOString(), now)).toBe("09:05");
  });

  it("adds the weekday within the week", () => {
    expect(formatMessageTime(new Date(2026, 10, 16, 9, 5).toISOString(), now)).toBe("Mon 09:05");
  });

  it("shows the date for older messages", () => {
    expect(formatMessageTime(new Date(2026, 10, 3, 9, 5).toISOString(), now)).toBe("3 Nov");
  });
});
