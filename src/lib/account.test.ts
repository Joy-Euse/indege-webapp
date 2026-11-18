import { describe, expect, it } from "vitest";
import { describeDevice, initialsOf } from "./account";
import { jobListPath } from "./useJobs";
import { changePasswordSchema, emailSchema, profileSchema } from "./validation";

describe("describeDevice", () => {
  it.each([
    ["Mozilla/5.0 (Linux; Android 14; SM-A145F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Mobile Safari/537.36", "Chrome on Android"],
    ["Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/26.0 Chrome/122.0 Mobile Safari/537.36", "Samsung Internet on Android"],
    ["Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1", "Safari on iPhone"],
    ["Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36 Edg/131.0", "Edge on Windows"],
  ])("names %s", (userAgent, expected) => {
    expect(describeDevice(userAgent)).toBe(expected);
  });

  it("returns null when there is nothing to go on", () => {
    expect(describeDevice(null)).toBeNull();
    expect(describeDevice("curl/8.0")).toBeNull();
  });
});

describe("initialsOf", () => {
  it("uses the first and last names", () => {
    expect(initialsOf("aline mukamana uwase")).toBe("AU");
    expect(initialsOf("  Jean  ")).toBe("J");
  });
});

describe("jobListPath", () => {
  it("leaves out empty filters and the 'all' status", () => {
    expect(jobListPath({ status: "all" })).toBe("/jobs/mine");
    expect(jobListPath({ q: "garden & lawn", status: "open", cursor: "abc", limit: 5 })).toBe(
      "/jobs/mine?q=garden+%26+lawn&status=open&cursor=abc&limit=5",
    );
  });
});

describe("profileSchema", () => {
  const valid = { fullName: "Aline Uwase", bio: "", district: "Gasabo" as const, sector: "Remera" };

  it("accepts a home area, or none at all", () => {
    expect(profileSchema.safeParse(valid).success).toBe(true);
    expect(profileSchema.safeParse({ ...valid, district: "", sector: "" }).success).toBe(true);
  });

  it("rejects a sector outside the district, or without one", () => {
    expect(profileSchema.safeParse({ ...valid, sector: "Gikondo" }).success).toBe(false);
    expect(profileSchema.safeParse({ ...valid, district: "", sector: "Remera" }).success).toBe(false);
  });

  it("limits the bio to 300 characters", () => {
    expect(profileSchema.safeParse({ ...valid, bio: "x".repeat(301) }).success).toBe(false);
  });
});

describe("emailSchema", () => {
  it("tidies and checks the address", () => {
    expect(emailSchema.parse({ email: "  Aline@Example.COM " })).toEqual({ email: "aline@example.com" });
    expect(emailSchema.safeParse({ email: "aline@" }).success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("requires the new password twice", () => {
    const base = { currentPassword: "old-password", newPassword: "new-password-1" };
    expect(changePasswordSchema.safeParse({ ...base, confirmPassword: "new-password-1" }).success).toBe(true);
    expect(changePasswordSchema.safeParse({ ...base, confirmPassword: "new-password-2" }).success).toBe(false);
  });
});
