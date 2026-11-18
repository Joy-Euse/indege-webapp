import { describe, expect, it, vi } from "vitest";

// The hooks need the app's providers. These tests only cover the plain functions.
vi.mock("../auth/AuthContext", () => ({ useAuth: () => ({ state: {} }) }));

const { applicationsPath, findWorkPath } = await import("./work");

describe("findWorkPath", () => {
  it("leaves out empty filters", () => {
    expect(findWorkPath({})).toBe("/work/jobs");
    expect(findWorkPath({ q: "", cursor: null })).toBe("/work/jobs");
  });

  it("encodes every filter", () => {
    expect(findWorkPath({ q: "clean & tidy", category: "CLEANING", district: "Gasabo", cursor: "abc", limit: 5 })).toBe(
      "/work/jobs?q=clean+%26+tidy&category=CLEANING&district=Gasabo&cursor=abc&limit=5",
    );
  });
});

describe("applicationsPath", () => {
  it("treats 'all' as no filter", () => {
    expect(applicationsPath({ status: "all" })).toBe("/work/applications");
  });

  it("passes a status, cursor and limit", () => {
    expect(applicationsPath({ status: "hired", cursor: "xyz", limit: 4 })).toBe("/work/applications?status=hired&cursor=xyz&limit=4");
  });
});
