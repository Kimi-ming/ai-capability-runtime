export const CAPABILITY_QUALITY_SCORE_RUBRIC_VERSION = "opencap.quality_score.v1" as const;

export type CapabilityQualityScoreRubricVersion = typeof CAPABILITY_QUALITY_SCORE_RUBRIC_VERSION;

export type CapabilityQualityScoreBand = "incomplete" | "experimental" | "listed" | "tested" | "verified";

export interface CapabilityQualityScoreDimensions {
  manifest: number;
  docs: number;
  tests: number;
  security: number;
  maintenance: number;
  compatibility: number;
  evidence: number;
}

export interface CapabilityQualityScoreInput {
  dimensions: CapabilityQualityScoreDimensions;
  generatedAt: string;
}

export interface CapabilityQualityScore {
  rubricVersion: CapabilityQualityScoreRubricVersion;
  total: number;
  band: CapabilityQualityScoreBand;
  dimensions: CapabilityQualityScoreDimensions;
  generatedAt: string;
  policyEffect: "none";
}

const DIMENSION_WEIGHTS: CapabilityQualityScoreDimensions = {
  manifest: 15,
  docs: 15,
  tests: 20,
  security: 20,
  maintenance: 10,
  compatibility: 10,
  evidence: 10,
};

function clampDimensionScore(score: number, max: number): number {
  if (!Number.isFinite(score)) {
    return 0;
  }
  return Math.min(Math.max(Math.round(score), 0), max);
}

function qualityScoreBand(total: number): CapabilityQualityScoreBand {
  if (total >= 90) {
    return "verified";
  }
  if (total >= 75) {
    return "tested";
  }
  if (total >= 60) {
    return "listed";
  }
  if (total >= 40) {
    return "experimental";
  }
  return "incomplete";
}

export function calculateCapabilityQualityScore(input: CapabilityQualityScoreInput): CapabilityQualityScore {
  const dimensions: CapabilityQualityScoreDimensions = {
    manifest: clampDimensionScore(input.dimensions.manifest, DIMENSION_WEIGHTS.manifest),
    docs: clampDimensionScore(input.dimensions.docs, DIMENSION_WEIGHTS.docs),
    tests: clampDimensionScore(input.dimensions.tests, DIMENSION_WEIGHTS.tests),
    security: clampDimensionScore(input.dimensions.security, DIMENSION_WEIGHTS.security),
    maintenance: clampDimensionScore(input.dimensions.maintenance, DIMENSION_WEIGHTS.maintenance),
    compatibility: clampDimensionScore(input.dimensions.compatibility, DIMENSION_WEIGHTS.compatibility),
    evidence: clampDimensionScore(input.dimensions.evidence, DIMENSION_WEIGHTS.evidence),
  };
  const total = Object.values(dimensions).reduce((sum, score) => sum + score, 0);

  return {
    rubricVersion: CAPABILITY_QUALITY_SCORE_RUBRIC_VERSION,
    total,
    band: qualityScoreBand(total),
    dimensions,
    generatedAt: input.generatedAt,
    policyEffect: "none",
  };
}
