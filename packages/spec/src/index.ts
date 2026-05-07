export type RiskLevel =
  | "read_only"
  | "write"
  | "external_send"
  | "destructive"
  | "financial"
  | "code_execution"
  | "secret_access";

export type CapabilityType = "http";

export interface CapabilityPermission {
  resource: string;
  action: string;
  risk: RiskLevel;
  confirmation: "allow" | "ask" | "deny";
}

export interface CapabilityManifest {
  id: string;
  name: string;
  description: string;
  version: string;
  type: CapabilityType;
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  auth: Record<string, unknown>;
  permissions: CapabilityPermission[];
  execution: Record<string, unknown>;
  metadata: Record<string, unknown>;
}
