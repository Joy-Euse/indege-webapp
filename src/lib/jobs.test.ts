import { describe, expect, it } from "vitest";
import { DISTRICTS, formatRwf, hasMissedStart, KIGALI_SECTORS, toLocalInput } from "./jobs";
import { jobSchema } from "./validation";

const HOUR_MS = 60 * 60 * 1000;
const inHours = (hours: number) => toLocalInput(new Date(Date.now() + hours * HOUR_MS));

const validJob = {
  category: "CLEANING",
  description: "Clean a three-bedroom house",
  district: "Gasabo",
  sector: "Kimironko",
  landmark: "Near the market",
  startsAt: inHours(24),
  durationHours: 4,
  wageRwf: 15000,
};

describe("jobSchema", () => {
  it("accepts a valid job", () => {
    expect(jobSchema.safeParse(validJob).success).toBe(true);
  });

  it.each([
    ["no category", { category: undefined }, "category", "errCategory"],
    ["a short description", { description: "Too short" }, "description", "errDescription"],
    ["no district", { district: "" }, "district", "errDistrict"],
    ["no sector", { sector: "" }, "sector", "errSector"],
    ["a sector from another district", { district: "Kicukiro" }, "sector", "errSector"],
    ["a blank landmark", { landmark: "  " }, "landmark", "errLandmark"],
    ["a past start time", { startsAt: inHours(-1) }, "startsAt", "errStartsAt"],
    ["a start time too far ahead", { startsAt: inHours(24 * 91) }, "startsAt", "errStartsAt"],
    ["an empty start time", { startsAt: "" }, "startsAt", "errStartsAt"],
    ["no duration", { durationHours: Number.NaN }, "durationHours", "errDuration"],
    ["too many hours", { durationHours: 13 }, "durationHours", "errDuration"],
    ["no wage", { wageRwf: Number.NaN }, "wageRwf", "errWage"],
    ["a low wage", { wageRwf: 999 }, "wageRwf", "errWage"],
    ["a wage with decimals", { wageRwf: 1000.5 }, "wageRwf", "errWage"],
  ])("rejects %s", (_label, overrides, field, message) => {
    const result = jobSchema.safeParse({ ...validJob, ...overrides });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((issue) => issue.path[0] === field)?.message).toBe(message);
  });
});

describe("job helpers", () => {
  it("lists all of Kigali's 35 sectors", () => {
    expect(DISTRICTS).toEqual(["Gasabo", "Kicukiro", "Nyarugenge"]);
    expect(Object.values(KIGALI_SECTORS).flat()).toHaveLength(35);
  });

  it("formats wages", () => {
    expect(formatRwf(15000)).toBe("15,000 RWF");
  });

  it("round-trips a datetime-local value to the minute", () => {
    const date = new Date(2026, 10, 7, 8, 5);
    expect(toLocalInput(date)).toBe("2026-11-07T08:05");
    expect(new Date(toLocalInput(date)).getTime()).toBe(date.getTime());
  });

  it("flags only open jobs whose start time has passed", () => {
    const now = new Date("2026-11-07T10:00:00Z");
    expect(hasMissedStart({ status: "OPEN", startsAt: "2026-11-07T09:00:00Z" }, now)).toBe(true);
    expect(hasMissedStart({ status: "OPEN", startsAt: "2026-11-07T11:00:00Z" }, now)).toBe(false);
    expect(hasMissedStart({ status: "CANCELLED", startsAt: "2026-11-07T09:00:00Z" }, now)).toBe(false);
  });
});
