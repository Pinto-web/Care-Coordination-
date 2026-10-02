import type { Role } from "@care/shared";

export interface AuthUser {
  id: string;
  role: Role;
  fullName: string;
  email?: string;
}
