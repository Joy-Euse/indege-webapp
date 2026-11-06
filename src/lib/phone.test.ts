import { describe, expect, it } from "vitest";
import { formatPhone, isValidPhone, normalizePhone } from "./phone";

describe("phone", () => {
  it.each(["0788123456", "788123456", "250788123456", "+250788123456", "+250 788-123-456", "78 812 3456"])(
    "normalizes %s",
    (input) => {
      expect(normalizePhone(input)).toBe("+250788123456");
    },
  );

  it.each(["0722123456", "0732123456", "0782123456", "0792123456"])("accepts %s", (input) => {
    expect(isValidPhone(input)).toBe(true);
  });

  it.each(["", "0712123456", "0252123456", "078812345", "+254788123456", "letters"])("rejects %s", (input) => {
    expect(isValidPhone(input)).toBe(false);
  });

  it("formats for display", () => {
    expect(formatPhone("+250788123456")).toBe("+250 788 123 456");
  });
});
