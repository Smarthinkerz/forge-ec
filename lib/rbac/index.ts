// Role-based access control. Roles are per-organization (membership.role).
export type Role = "owner" | "admin" | "editor" | "analyst" | "viewer";

const RANK: Record<Role, number> = { owner: 5, admin: 4, editor: 3, analyst: 2, viewer: 1 };

export type Permission =
  | "org.manage" | "billing.manage" | "members.manage"
  | "store.connect" | "campaign.edit" | "campaign.launch"
  | "creative.edit" | "agent.configure" | "analytics.view";

// Minimum role required for each permission.
const REQUIRED: Record<Permission, Role> = {
  "org.manage": "owner",
  "billing.manage": "owner",
  "members.manage": "admin",
  "store.connect": "admin",
  "campaign.edit": "editor",
  "campaign.launch": "editor",
  "creative.edit": "editor",
  "agent.configure": "admin",
  "analytics.view": "viewer",
};

export function can(role: Role, perm: Permission): boolean {
  return RANK[role] >= RANK[REQUIRED[perm]];
}
