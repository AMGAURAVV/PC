"use strict";
/**
 * Seed: 09-users.ts
 *
 * Seeds demo user accounts.
 *
 * ⚠️  IMPORTANT: These passwords are demo-only seed values.
 *     Production authentication uses bcrypt in the API service.
 *     The seed uses SHA-256 as a stand-in ONLY because bcrypt
 *     is not a dependency of the database package.
 *     CHANGE ALL PASSWORDS before any real deployment.
 *
 * Accounts seeded:
 *   admin@pcplatform.in   / [DEMO] Admin@Demo2024!   → super_admin role
 *   ops@pcplatform.in     / [DEMO] Ops@Demo2024!     → admin role
 *   demo@example.com      / [DEMO] Demo@Demo2024!    → customer role
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedUsers = seedUsers;
const crypto = __importStar(require("crypto"));
const generated_1 = require("../src/generated");
// ⚠️  For seed only. Production uses bcrypt in the API.
function demoHash(password) {
    return 'sha256:' + crypto.createHash('sha256').update(password).digest('hex');
}
const DEMO_USERS = [
    {
        email: 'admin@pcplatform.in',
        password: 'Admin@Demo2024!',
        firstName: 'Platform',
        lastName: 'Admin',
        status: generated_1.UserStatus.ACTIVE,
        isVerified: true,
        roleName: 'super_admin',
    },
    {
        email: 'ops@pcplatform.in',
        password: 'Ops@Demo2024!',
        firstName: 'Operations',
        lastName: 'Manager',
        status: generated_1.UserStatus.ACTIVE,
        isVerified: true,
        roleName: 'admin',
    },
    {
        email: 'demo@example.com',
        password: 'Demo@Demo2024!',
        firstName: 'Demo',
        lastName: 'Customer',
        status: generated_1.UserStatus.ACTIVE,
        isVerified: true,
        roleName: 'customer',
    },
];
async function seedUsers(prisma) {
    for (const u of DEMO_USERS) {
        const user = await prisma.user.upsert({
            where: { email: u.email },
            update: {},
            create: {
                email: u.email,
                passwordHash: demoHash(u.password),
                firstName: u.firstName,
                lastName: u.lastName,
                status: u.status,
                isVerified: u.isVerified,
                verifiedAt: new Date(),
            },
        });
        // Assign role
        const role = await prisma.role.findUnique({ where: { name: u.roleName } });
        if (role) {
            await prisma.userRole.upsert({
                where: { userId_roleId: { userId: user.id, roleId: role.id } },
                update: {},
                create: { userId: user.id, roleId: role.id },
            });
        }
    }
    console.log(`  ✔  Users: ${DEMO_USERS.length} demo accounts seeded`);
    console.log(`     admin@pcplatform.in   → super_admin  [DEMO password — change before production!]`);
    console.log(`     ops@pcplatform.in     → admin        [DEMO password — change before production!]`);
    console.log(`     demo@example.com      → customer     [DEMO password — change before production!]`);
}
//# sourceMappingURL=09-users.js.map