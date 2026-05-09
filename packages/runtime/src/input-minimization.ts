import type { FieldLevelEgressMap } from "./egress-map.js";

export interface MinimizedInputResult {
  input: unknown;
  includedPaths: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unescapeJsonPointerSegment(segment: string): string {
  return segment.replace(/~1/g, "/").replace(/~0/g, "~");
}

function pathSegments(path: string): string[] {
  if (path === "" || path === "/") {
    return [];
  }

  return path.slice(1).split("/").map(unescapeJsonPointerSegment);
}

function valueAtPath(input: unknown, path: string): unknown {
  let current = input;
  for (const segment of pathSegments(path)) {
    if (!isRecord(current)) {
      return undefined;
    }
    current = current[segment];
  }
  return current;
}

function setValueAtPath(target: Record<string, unknown>, path: string, value: unknown): void {
  const segments = pathSegments(path);
  if (segments.length === 0) {
    return;
  }

  let current: Record<string, unknown> = target;
  for (const segment of segments.slice(0, -1)) {
    const next = current[segment];
    if (!isRecord(next)) {
      current[segment] = {};
    }
    current = current[segment] as Record<string, unknown>;
  }

  current[segments[segments.length - 1]] = value;
}

export function minimizeInputByEgressMap(input: unknown, map: FieldLevelEgressMap): MinimizedInputResult {
  const minimized: Record<string, unknown> = {};
  const includedPaths: string[] = [];

  for (const field of map.fields) {
    if (includedPaths.includes(field.path)) {
      continue;
    }

    const value = valueAtPath(input, field.path);
    if (value === undefined) {
      continue;
    }

    setValueAtPath(minimized, field.path, value);
    includedPaths.push(field.path);
  }

  return { input: minimized, includedPaths };
}
