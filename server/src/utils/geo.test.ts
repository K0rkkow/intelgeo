import { describe, it, expect } from "vitest";
import { haversineKm, calculateScore } from "./geo.js";

describe("haversineKm", () => {
  it("zero distance", () => {
    expect(haversineKm(48.8566, 2.3522, 48.8566, 2.3522)).toBeCloseTo(0);
  });
  it("Paris to London ~344km", () => {
    const d = haversineKm(48.8566, 2.3522, 51.5074, -0.1278);
    expect(d).toBeGreaterThan(330);
    expect(d).toBeLessThan(360);
  });
});

describe("calculateScore", () => {
  it("perfect guess max score", () => {
    const s = calculateScore(0, 120, 120);
    expect(s).toBe(5300);
  });
  it("far distance low score", () => {
    const s = calculateScore(10000, 0, 120);
    expect(s).toBeLessThan(100);
  });
  it("decreases with distance", () => {
    const a = calculateScore(10, 60, 120);
    const b = calculateScore(1000, 60, 120);
    expect(a).toBeGreaterThan(b);
  });
});
