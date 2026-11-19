import { describe, expect, it, vi } from "vitest";
import { canFinish, formatMonthKey, paymentStatus } from "./jobs";

// The hooks need the app's providers. These tests only cover the plain functions.
vi.mock("../auth/AuthContext", () => ({ useAuth: () => ({ state: {} }) }));

const { earningsPath } = await import("./earnings");

describe("earningsPath", () => {
  it("leaves out the default filter", () => {
    expect(earningsPath({})).toBe("/work/earnings");
    expect(earningsPath({ status: "all", cursor: null })).toBe("/work/earnings");
  });

  it("encodes the filter and page", () => {
    expect(earningsPath({ status: "waiting", cursor: "abc", limit: 5 })).toBe("/work/earnings?status=waiting&cursor=abc&limit=5");
  });
});

describe("paymentStatus", () => {
  const done = { status: "COMPLETED" as const, paidAt: null, paymentConfirmedAt: null, paymentDisputedAt: null };
  const paidAt = "2026-11-19T10:00:00Z";

  it("is null until the job is done", () => {
    expect(paymentStatus({ ...done, status: "ASSIGNED" })).toBeNull();
  });

  it("follows the payment record, with the worker's confirmation winning", () => {
    expect(paymentStatus(done)).toBe("UNPAID");
    expect(paymentStatus({ ...done, paidAt })).toBe("TO_CONFIRM");
    expect(paymentStatus({ ...done, paidAt, paymentDisputedAt: "2026-11-19T11:00:00Z" })).toBe("DISPUTED");
    expect(paymentStatus({ ...done, paidAt, paymentConfirmedAt: "2026-11-19T12:00:00Z" })).toBe("RECEIVED");
  });
});

describe("canFinish", () => {
  const now = new Date("2026-11-19T12:00:00Z");

  it("needs a hired job whose start time has passed", () => {
    expect(canFinish({ status: "ASSIGNED", startsAt: "2026-11-19T11:00:00Z" }, now)).toBe(true);
    expect(canFinish({ status: "IN_PROGRESS", startsAt: "2026-11-19T11:00:00Z" }, now)).toBe(true);
    expect(canFinish({ status: "ASSIGNED", startsAt: "2026-11-19T13:00:00Z" }, now)).toBe(false);
    expect(canFinish({ status: "OPEN", startsAt: "2026-11-19T11:00:00Z" }, now)).toBe(false);
    expect(canFinish({ status: "COMPLETED", startsAt: "2026-11-19T11:00:00Z" }, now)).toBe(false);
  });
});

describe("formatMonthKey", () => {
  it("reads the key as a calendar month in any time zone", () => {
    expect(formatMonthKey("2026-11")).toBe("Nov");
    expect(formatMonthKey("2026-01", "long")).toBe("January 2026");
  });
});

describe("paymentsPath", async () => {
  const { paymentsPath } = await import("./payments");

  it("leaves out the default filter and encodes the rest", () => {
    expect(paymentsPath({ status: "all" })).toBe("/payments");
    expect(paymentsPath({ status: "to-pay", cursor: "abc", limit: 5 })).toBe("/payments?status=to-pay&cursor=abc&limit=5");
  });
});
