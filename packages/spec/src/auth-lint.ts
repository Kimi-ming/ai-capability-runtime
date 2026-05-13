import type { CapabilityManifest, RiskLevel } from "./index.js";

export type LeastPrivilegeAuthLintRule =
  | "provider_permission_mismatch"
  | "read_only_permission_with_write_scope"
  | "elevated_permission_without_elevated_scope"
  | "overbroad_scope";

export type LeastPrivilegeAuthLintSeverity = "error";

export interface LeastPrivilegeAuthLintEvidence {
  provider?: string;
  resource?: string;
  permissionIndex?: number;
  risk?: RiskLevel;
  scope?: string;
  scopes?: string[];
}

export interface LeastPrivilegeAuthFinding {
  rule: LeastPrivilegeAuthLintRule;
  severity: LeastPrivilegeAuthLintSeverity;
  path: string;
  message: string;
  evidence: LeastPrivilegeAuthLintEvidence;
}

const ELEVATED_SCOPE_PATTERN = /(^|[:._-])(write|create|update|delete|admin|manage|send|deploy|execute|secret|financial|full)([:._-]|$)/i;
const OVERBROAD_SCOPE_PATTERN = /(^\*$)|(^\*:\*$)|(^admin([:._-]|$))|(^repo$)|(^all$)|(^full$)|(^full_access$)|(^root$)|(^owner$)|(^write$)/i;

function authRecord(manifest: CapabilityManifest): Record<string, unknown> {
  return manifest.auth;
}

function stringValue(value: unknown): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function authScopes(manifest: CapabilityManifest): string[] {
  const scopes = authRecord(manifest).scopes;
  return Array.isArray(scopes) ? scopes.filter((scope): scope is string => typeof scope === "string") : [];
}

function isApiKeyAuth(manifest: CapabilityManifest): boolean {
  return authRecord(manifest).type === "api_key";
}

function isElevatedRisk(risk: RiskLevel): boolean {
  return risk !== "read_only";
}

function scopeLooksElevated(scope: string): boolean {
  return ELEVATED_SCOPE_PATTERN.test(scope);
}

function scopeLooksOverbroad(scope: string): boolean {
  return OVERBROAD_SCOPE_PATTERN.test(scope);
}

function permissionProvider(resource: string): string | undefined {
  const [provider] = resource.split(".");
  return provider && provider !== resource ? provider : undefined;
}

export function lintLeastPrivilegeAuth(manifest: CapabilityManifest): LeastPrivilegeAuthFinding[] {
  if (!isApiKeyAuth(manifest)) {
    return [];
  }

  const findings: LeastPrivilegeAuthFinding[] = [];
  const provider = stringValue(authRecord(manifest).provider);
  const scopes = authScopes(manifest);
  const hasElevatedScope = scopes.some(scopeLooksElevated);
  const hasOnlyReadOnlyPermissions = manifest.permissions.every((permission) => permission.risk === "read_only");
  const elevatedPermission = manifest.permissions.find((permission) => isElevatedRisk(permission.risk));

  if (provider) {
    manifest.permissions.forEach((permission, index) => {
      const resourceProvider = permissionProvider(permission.resource);
      if (resourceProvider && resourceProvider !== provider) {
        findings.push({
          rule: "provider_permission_mismatch",
          severity: "error",
          path: `/permissions/${index}/resource`,
          message: "auth.provider must match the provider prefix used by permissions.resource.",
          evidence: {
            provider,
            resource: permission.resource,
            permissionIndex: index,
          },
        });
      }
    });
  }

  scopes.forEach((scope, index) => {
    if (scopeLooksOverbroad(scope)) {
      findings.push({
        rule: "overbroad_scope",
        severity: "error",
        path: `/auth/scopes/${index}`,
        message: "auth.scopes must not request wildcard, provider-wide, or admin-level credentials.",
        evidence: {
          provider,
          scope,
        },
      });
    }
  });

  const elevatedReadOnlyScopeIndex = hasOnlyReadOnlyPermissions ? scopes.findIndex(scopeLooksElevated) : -1;
  if (elevatedReadOnlyScopeIndex >= 0) {
    findings.push({
      rule: "read_only_permission_with_write_scope",
      severity: "error",
      path: `/auth/scopes/${elevatedReadOnlyScopeIndex}`,
      message: "read-only permissions must not request write, admin, delete, manage, or send scopes.",
      evidence: {
        provider,
        risk: "read_only",
        scope: scopes[elevatedReadOnlyScopeIndex],
      },
    });
  }

  if (elevatedPermission && !hasElevatedScope) {
    findings.push({
      rule: "elevated_permission_without_elevated_scope",
      severity: "error",
      path: "/auth/scopes",
      message: "write or higher-risk permissions must declare a matching non-read-only auth scope.",
      evidence: {
        provider,
        resource: elevatedPermission.resource,
        risk: elevatedPermission.risk,
        scopes,
      },
    });
  }

  return findings;
}
