"use strict";
/**
 * Seed: 02-permissions.ts
 * Seeds granular RBAC permissions and assigns them to system roles.
 *
 * Permission format: "<module>:<action>"
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedPermissions = seedPermissions;
const PERMISSIONS = [
    // ── Products ──────────────────────────────────────────────────
    { action: 'products:read', module: 'products', description: 'View products' },
    { action: 'products:create', module: 'products', description: 'Create products' },
    { action: 'products:update', module: 'products', description: 'Update products' },
    { action: 'products:delete', module: 'products', description: 'Soft-delete products' },
    { action: 'products:restore', module: 'products', description: 'Restore deleted products' },
    { action: 'products:publish', module: 'products', description: 'Publish/unpublish products' },
    // ── Categories ────────────────────────────────────────────────
    { action: 'categories:read', module: 'categories', description: 'View categories' },
    { action: 'categories:manage', module: 'categories', description: 'Create/update/delete categories' },
    // ── Brands ────────────────────────────────────────────────────
    { action: 'brands:read', module: 'brands', description: 'View brands' },
    { action: 'brands:manage', module: 'brands', description: 'Create/update/delete brands' },
    // ── Inventory ─────────────────────────────────────────────────
    { action: 'inventory:read', module: 'inventory', description: 'View inventory' },
    { action: 'inventory:update', module: 'inventory', description: 'Update stock levels' },
    // ── Pricing ───────────────────────────────────────────────────
    { action: 'prices:read', module: 'prices', description: 'View pricing' },
    { action: 'prices:manage', module: 'prices', description: 'Set/update prices' },
    // ── Orders ────────────────────────────────────────────────────
    { action: 'orders:read', module: 'orders', description: 'View all orders' },
    { action: 'orders:update', module: 'orders', description: 'Update order status' },
    { action: 'orders:cancel', module: 'orders', description: 'Cancel orders' },
    { action: 'orders:refund', module: 'orders', description: 'Issue refunds' },
    // ── Users ─────────────────────────────────────────────────────
    { action: 'users:read', module: 'users', description: 'View user profiles' },
    { action: 'users:update', module: 'users', description: 'Edit user data' },
    { action: 'users:suspend', module: 'users', description: 'Suspend/activate users' },
    { action: 'users:delete', module: 'users', description: 'Delete user accounts' },
    { action: 'users:assign_roles', module: 'users', description: 'Assign roles to users' },
    // ── Reviews ───────────────────────────────────────────────────
    { action: 'reviews:moderate', module: 'reviews', description: 'Approve/reject reviews' },
    { action: 'reviews:delete', module: 'reviews', description: 'Delete reviews' },
    // ── Coupons ───────────────────────────────────────────────────
    { action: 'coupons:manage', module: 'coupons', description: 'Create/update/delete coupons' },
    // ── Compatibility Rules ───────────────────────────────────────
    { action: 'compat_rules:read', module: 'compat', description: 'View compatibility rules' },
    { action: 'compat_rules:manage', module: 'compat', description: 'Create/update compatibility rules' },
    // ── Audit Logs ────────────────────────────────────────────────
    { action: 'audit_logs:read', module: 'audit', description: 'View audit logs' },
    // ── Admin ─────────────────────────────────────────────────────
    { action: 'admin:dashboard', module: 'admin', description: 'Access admin dashboard' },
    { action: 'admin:export', module: 'admin', description: 'Export data' },
];
// Which permissions each system role gets
const ROLE_PERMISSION_MAP = {
    super_admin: PERMISSIONS.map((p) => p.action), // all permissions
    admin: [
        'products:read', 'products:create', 'products:update', 'products:delete', 'products:publish',
        'categories:read', 'categories:manage',
        'brands:read', 'brands:manage',
        'inventory:read', 'inventory:update',
        'prices:read', 'prices:manage',
        'orders:read', 'orders:update', 'orders:cancel', 'orders:refund',
        'users:read', 'users:update', 'users:suspend',
        'reviews:moderate', 'reviews:delete',
        'coupons:manage',
        'compat_rules:read', 'compat_rules:manage',
        'audit_logs:read',
        'admin:dashboard', 'admin:export',
    ],
    customer: [], // customers have no admin permissions
    supplier: [
        'products:read',
        'inventory:read', 'inventory:update',
        'prices:read',
        'orders:read',
    ],
};
async function seedPermissions(prisma) {
    // Upsert all permissions
    for (const perm of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { action: perm.action },
            update: { description: perm.description, module: perm.module },
            create: perm,
        });
    }
    // Assign permissions to roles
    for (const [roleName, actions] of Object.entries(ROLE_PERMISSION_MAP)) {
        const role = await prisma.role.findUnique({ where: { name: roleName } });
        if (!role)
            continue;
        for (const action of actions) {
            const perm = await prisma.permission.findUnique({ where: { action } });
            if (!perm)
                continue;
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
                update: {},
                create: { roleId: role.id, permissionId: perm.id },
            });
        }
    }
    console.log(`  ✔  Permissions: ${PERMISSIONS.length} seeded, roles assigned`);
}
//# sourceMappingURL=02-permissions.js.map