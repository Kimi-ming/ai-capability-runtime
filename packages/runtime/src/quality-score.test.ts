import { describe, expect, it } from "vitest";
import { calculateCapabilityQualityScore } from "./index.js";

describe("capability quality score rubric", () => {
  it("calculates a transparent quality score and band without policy authority", () => {
    const score = calculateCapabilityQualityScore({
      dimensions: {
        manifest: 15,
        docs: 12,
        tests: 18,
        security: 17,
        maintenance: 8,
        compatibility: 6,
        evidence: 6,
      },
      generatedAt: "2026-05-14",
    });

    expect(score).toEqual({
      rubricVersion: "opencap.quality_score.v1",
      total: 82,
      band: "tested",
      dimensions: {
        manifest: 15,
        docs: 12,
        tests: 18,
        security: 17,
        maintenance: 8,
        compatibility: 6,
        evidence: 6,
      },
      generatedAt: "2026-05-14",
      policyEffect: "none",
    });
  });

  it("clamps dimension scores to rubric weights before assigning a band", () => {
    const score = calculateCapabilityQualityScore({
      dimensions: {
        manifest: 99,
        docs: -5,
        tests: 20,
        security: 20,
        maintenance: 10,
        compatibility: 10,
        evidence: 10,
      },
      generatedAt: "2026-05-14",
    });

    expect(score.total).toBe(85);
    expect(score.band).toBe("tested");
    expect(score.dimensions).toMatchObject({
      manifest: 15,
      docs: 0,
    });
  });
});
