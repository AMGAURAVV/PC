/**
 * Standard RBAC Roles for PC Platform
 */
export enum Role {
  CUSTOMER = 'CUSTOMER',
  ADMIN = 'ADMIN',
  STAFF = 'STAFF',
  EDITOR = 'EDITOR',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
}

export type RoleType = `${Role}`;
