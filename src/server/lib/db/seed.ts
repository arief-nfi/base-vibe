import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from ".";
import { permission, role, rolePermission, tenant, user, userRole, userTenant } from "./schema/system";
import crypto from 'crypto';

async function seed() {

  console.log("Clearing table")
  // Only clear tables if they exist
  try {
    await db.execute(`TRUNCATE TABLE "sys_user_tenant", "sys_user_role", "sys_role_permission", "sys_permission", "sys_role", "sys_user", "sys_option", "sys_tenant"  CASCADE`);
  } catch (e) {
    console.log("Tables don't exist yet, continuing with fresh seed...");
  }

  console.log("Seeding tenant");
  const sysTenantId = crypto.randomUUID();
  const pubTenantId = crypto.randomUUID();
  await db.insert(tenant).values([
    { id: sysTenantId, code: "SYSTEM", name: "System", description: "System Tenant" },
    { id: pubTenantId, code: "PUBLIC", name: "Public", description: "Public Tenant" }
  ]);

  console.log("Seeding user");
  const userId = crypto.randomUUID();
  const passwordHash = await bcrypt.hash("S3cr3T", 10);
  await db.insert(user).values([
    { id: userId, username: "sysadmin", passwordHash: passwordHash, fullname: "System Admin", status: "active", activeTenantId:sysTenantId }
  ]);

  console.log("Seeding role");
  const sysRoleId = crypto.randomUUID();
  const pubRoleId = crypto.randomUUID();
  const sysAdminRoleId = crypto.randomUUID();
  const pubAdminRoleId = crypto.randomUUID();
  await db.insert(role).values([
    { id: sysRoleId, code: "SYSADMIN", name: "System Admin", description: "Role System Admin", isSystem: true, tenantId: sysTenantId },
    { id: sysAdminRoleId, code: "ADMIN", name: "Admin", description: "Admin Role", isSystem: false, tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "USER", name: "Role User", description: "Regular user role", isSystem: false, tenantId: sysTenantId },
    { id: pubRoleId, code: "SYSADMIN", name: "System Admin", description: "Role System Admin", isSystem: true, tenantId: pubTenantId },
    { id: pubAdminRoleId, code: "ADMIN", name: "Admin", description: "Admin Role", isSystem: false, tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "USER", name: "Role User", description: "Regular user role", isSystem: false, tenantId: pubTenantId }
  ]);

  console.log("seeding user tenant");
  await db.insert(userTenant).values([
    { userId: userId, tenantId: sysTenantId },
    { userId: userId, tenantId: pubTenantId }
  ]);

  console.log("Seeding user role");
  await db.insert(userRole).values([
    { userId: userId, roleId: sysRoleId, tenantId: sysTenantId },
    { userId: userId, roleId: sysAdminRoleId, tenantId: sysTenantId },
    { userId: userId, roleId: pubRoleId, tenantId: pubTenantId },
    { userId: userId, roleId: pubAdminRoleId, tenantId: pubTenantId }
  ]);

  console.log("Seeding permission");
  await db.insert(permission).values([

    // system tenant permission
    { id: crypto.randomUUID(), code: "system.tenant.view", name: "View Tenant", description: "Permission to view tenant", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.tenant.add", name: "Create Tenant", description: "Permission to add tenant", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.tenant.edit", name: "Edit Tenant", description: "Permission to edit tenant", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.tenant.delete", name: "Delete Tenant", description: "Permission to delete tenant", tenantId: sysTenantId },

    { id: crypto.randomUUID(), code: "system.user.view", name: "View User", description: "Permission to view user", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.user.add", name: "Create User", description: "Permission to add user", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.user.edit", name: "Edit User", description: "Permission to edit user", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.user.delete", name: "Delete User", description: "Permission to delete user", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.user.reset_password", name: "Reset Password", description: "Permission to reset password user", tenantId: sysTenantId },

    { id: crypto.randomUUID(), code: "system.role.view", name: "View Role", description: "Permission to view role", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.role.add", name: "Create Role", description: "Permission to add role", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.role.edit", name: "Edit Role", description: "Permission to edit role", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.role.delete", name: "Delete Role", description: "Permission to delete role", tenantId: sysTenantId },

    { id: crypto.randomUUID(), code: "system.permission.view", name: "View Permission", description: "Permission to view permission", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.permission.add", name: "Create Permission", description: "Permission to add permission", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.permission.edit", name: "Edit Permission", description: "Permission to edit permission", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.permission.delete", name: "Delete Permission", description: "Permission to delete permission", tenantId: sysTenantId },  

    { id: crypto.randomUUID(), code: "system.option.view", name: "View Option", description: "Permission to view option", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.option.add", name: "Create Option", description: "Permission to add option", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.option.edit", name: "Edit Option", description: "Permission to edit option", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "system.option.delete", name: "Delete Option", description: "Permission to delete option", tenantId: sysTenantId },

    // master partner permissions - system tenant
    { id: crypto.randomUUID(), code: "master.partner.view", name: "View Partner", description: "Permission to view partners", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "master.partner.add", name: "Create Partner", description: "Permission to add partners", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "master.partner.edit", name: "Edit Partner", description: "Permission to edit partners", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "master.partner.delete", name: "Delete Partner", description: "Permission to delete partners", tenantId: sysTenantId },

    // master integration inbound permissions - system tenant
    { id: crypto.randomUUID(), code: "master.integrationInbound.view", name: "View Integration Inbound", description: "Permission to view integration inbound API keys", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "master.integrationInbound.add", name: "Create Integration Inbound", description: "Permission to add integration inbound API keys", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "master.integrationInbound.edit", name: "Edit Integration Inbound", description: "Permission to edit integration inbound API keys", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "master.integrationInbound.delete", name: "Delete Integration Inbound", description: "Permission to delete integration inbound API keys", tenantId: sysTenantId },

    // master webhook permissions - system tenant
    { id: crypto.randomUUID(), code: "master.webhook.view", name: "View Webhooks", description: "Permission to view webhook configurations", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "master.webhook.create", name: "Create Webhooks", description: "Permission to create webhook endpoints", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "master.webhook.edit", name: "Edit Webhooks", description: "Permission to edit webhook configurations", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "master.webhook.delete", name: "Delete Webhooks", description: "Permission to delete webhook endpoints", tenantId: sysTenantId },

    

    // public tenant permissions
    { id: crypto.randomUUID(), code: "system.tenant.view", name: "View Tenant", description: "Permission to view tenant", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.tenant.edit", name: "Edit Tenant", description: "Permission to edit tenant", tenantId: pubTenantId },

    { id: crypto.randomUUID(), code: "system.user.view", name: "View User", description: "Permission to view user", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.user.add", name: "Create User", description: "Permission to add user", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.user.edit", name: "Edit User", description: "Permission to edit user", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.user.delete", name: "Delete User", description: "Permission to delete user", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.user.reset_password", name: "Reset Password", description: "Permission to reset password user", tenantId: pubTenantId },

    { id: crypto.randomUUID(), code: "system.role.view", name: "View Role", description: "Permission to view role", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.role.add", name: "Create Role", description: "Permission to add role", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.role.edit", name: "Edit Role", description: "Permission to edit role", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.role.delete", name: "Delete Role", description: "Permission to delete role", tenantId: pubTenantId },

    { id: crypto.randomUUID(), code: "system.permission.view", name: "View Permission", description: "Permission to view permission", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.permission.add", name: "Create Permission", description: "Permission to add permission", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.permission.edit", name: "Edit Permission", description: "Permission to edit permission", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.permission.delete", name: "Delete Permission", description: "Permission to delete permission", tenantId: pubTenantId },  

    { id: crypto.randomUUID(), code: "system.option.view", name: "View Option", description: "Permission to view option", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.option.add", name: "Create Option", description: "Permission to add option", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.option.edit", name: "Edit Option", description: "Permission to edit option", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "system.option.delete", name: "Delete Option", description: "Permission to delete option", tenantId: pubTenantId },

    // master partner permissions - public tenant
    { id: crypto.randomUUID(), code: "master.partner.view", name: "View Partner", description: "Permission to view partners", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "master.partner.add", name: "Create Partner", description: "Permission to add partners", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "master.partner.edit", name: "Edit Partner", description: "Permission to edit partners", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "master.partner.delete", name: "Delete Partner", description: "Permission to delete partners", tenantId: pubTenantId },

    // master integration inbound permissions - public tenant
    { id: crypto.randomUUID(), code: "master.integrationInbound.view", name: "View Integration Inbound", description: "Permission to view integration inbound API keys", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "master.integrationInbound.add", name: "Create Integration Inbound", description: "Permission to add integration inbound API keys", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "master.integrationInbound.edit", name: "Edit Integration Inbound", description: "Permission to edit integration inbound API keys", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "master.integrationInbound.delete", name: "Delete Integration Inbound", description: "Permission to delete integration inbound API keys", tenantId: pubTenantId },

    // master webhook permissions - public tenant
    { id: crypto.randomUUID(), code: "master.webhook.view", name: "View Webhooks", description: "Permission to view webhook configurations", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "master.webhook.create", name: "Create Webhooks", description: "Permission to create webhook endpoints", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "master.webhook.edit", name: "Edit Webhooks", description: "Permission to edit webhook configurations", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "master.webhook.delete", name: "Delete Webhooks", description: "Permission to delete webhook endpoints", tenantId: pubTenantId },

    // WMS inventory permissions - system tenant
    { id: crypto.randomUUID(), code: "wms.inventory.view", name: "View Inventory", description: "Permission to view inventory items", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "wms.inventory.create", name: "Create Inventory", description: "Permission to create inventory items", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "wms.inventory.edit", name: "Edit Inventory", description: "Permission to edit inventory items", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "wms.inventory.delete", name: "Delete Inventory", description: "Permission to delete inventory items", tenantId: sysTenantId },
    { id: crypto.randomUUID(), code: "wms.inventory.adjust", name: "Adjust Inventory", description: "Permission to adjust inventory quantities", tenantId: sysTenantId },

    // WMS inventory permissions - public tenant
    { id: crypto.randomUUID(), code: "wms.inventory.view", name: "View Inventory", description: "Permission to view inventory items", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "wms.inventory.create", name: "Create Inventory", description: "Permission to create inventory items", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "wms.inventory.edit", name: "Edit Inventory", description: "Permission to edit inventory items", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "wms.inventory.delete", name: "Delete Inventory", description: "Permission to delete inventory items", tenantId: pubTenantId },
    { id: crypto.randomUUID(), code: "wms.inventory.adjust", name: "Adjust Inventory", description: "Permission to adjust inventory quantities", tenantId: pubTenantId }

  ]);

  console.log("Seeding role permission");
  // Get all permissions for system tenant
  const sysPermissions = await db.select().from(permission).where(eq(permission.tenantId, sysTenantId));
  // Get all permissions for public tenant
  const pubPermissions = await db.select().from(permission).where(eq(permission.tenantId, pubTenantId));
  
  // Link all permissions to ADMIN roles
  const sysAdminRolePermissions = sysPermissions.map(perm => ({
    roleId: sysAdminRoleId,
    permissionId: perm.id,
    tenantId: sysTenantId
  }));
  
  const pubAdminRolePermissions = pubPermissions.map(perm => ({
    roleId: pubAdminRoleId,
    permissionId: perm.id,
    tenantId: pubTenantId
  }));
  
  await db.insert(rolePermission).values([
    ...sysAdminRolePermissions,
    ...pubAdminRolePermissions
  ]);

}

async function main() {
  await seed();
  console.log("Seed completed");
  process.exit(0);
}

main();