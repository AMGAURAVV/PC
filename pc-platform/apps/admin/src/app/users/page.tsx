'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Shield, UserCheck, Trash2, Edit2, Key } from 'lucide-react';
import { Button, Badge, Modal, Input, Label } from '@pc-platform/ui';
import { getAdminUsers, updateAdminUser, deleteAdminUser } from '../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';

export default function AdminUsersPage() {
  const queryClient = useQueryClient();

  const [editRoleUser, setEditRoleUser] = React.useState<any | null>(null);
  const [selectedRole, setSelectedRole] = React.useState<string>('customer');
  const [deleteTarget, setDeleteTarget] = React.useState<any | null>(null);

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => getAdminUsers({ limit: 100 }),
  });

  const users = usersData?.data || [];

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, roles }: { id: string; roles: string[] }) =>
      updateAdminUser(id, { roles }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setEditRoleUser(null);
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setDeleteTarget(null);
    },
  });

  const openRoleModal = (u: any) => {
    setEditRoleUser(u);
    setSelectedRole(u.roles?.[0] || 'customer');
  };

  const columns: ColumnDef<any>[] = [
    {
      key: 'name',
      header: 'User Identity',
      sortable: true,
      cell: (u) => (
        <div>
          <div className="font-mono font-bold text-white">
            {u.firstName} {u.lastName}
          </div>
          <div className="text-[10px] font-mono text-cyber-500">{u.email}</div>
        </div>
      ),
    },
    {
      key: 'roles',
      header: 'Access Role',
      sortable: true,
      cell: (u) => {
        const role = u.roles?.[0] || 'customer';
        let badgeStyle = 'border-cyber-700 text-cyber-400 bg-cyber-800/40';
        if (role === 'super_admin') badgeStyle = 'border-purple-500/30 text-purple-400 bg-purple-500/10';
        else if (role === 'admin') badgeStyle = 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10';
        else if (role === 'staff') badgeStyle = 'border-amber-500/30 text-amber-400 bg-amber-500/10';

        return (
          <Badge variant="tech" className={`font-mono text-[10px] uppercase ${badgeStyle}`}>
            {role.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      sortable: true,
      cell: (u) => (
        <span className="font-mono text-xs text-cyber-400">
          {new Date(u.createdAt || Date.now()).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Security Actions',
      className: 'text-right',
      cell: (u) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => openRoleModal(u)}
            className="h-7 text-xs font-mono gap-1 text-cyan-400 hover:text-white"
          >
            <Key className="w-3 h-3" />
            <span>Roles</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteTarget(u)}
            className="h-7 w-7 p-0 text-cyber-400 hover:text-rose-400"
            title="Delete User"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Users & Permissions' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
            USER ACCESS & ROLE MANAGEMENT
          </h1>
          <p className="text-xs text-cyber-400 mt-1">
            Manage customer profiles, staff privileges, and RBAC permissions.
          </p>
        </div>
      </div>

      <AdminDataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Filter users by name or email address..."
        searchFilter={(u, q) =>
          u.email.toLowerCase().includes(q) ||
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q)
        }
      />

      {/* Role Switcher Modal */}
      <Modal
        open={Boolean(editRoleUser)}
        onClose={() => setEditRoleUser(null)}
        title="Modify Access Role"
        className="max-w-md bg-[#0c101d] border-cyber-800"
      >
        {editRoleUser && (
          <div className="space-y-4 pt-2 font-mono text-xs">
            <div className="p-3 bg-cyber-900/60 rounded border border-cyber-800">
              <div className="font-bold text-white">
                {editRoleUser.firstName} {editRoleUser.lastName}
              </div>
              <div className="text-[10px] text-cyber-400">{editRoleUser.email}</div>
            </div>

            <div>
              <Label className="text-xs text-cyber-300">Assign RBAC Security Role</Label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="mt-1 w-full h-8 px-2.5 bg-cyber-900 border border-cyber-700 rounded text-xs text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="customer">Customer (Standard User)</option>
                <option value="editor">Editor (Catalog & Content)</option>
                <option value="staff">Staff (Fulfillment & Inventory)</option>
                <option value="admin">Administrator (Full Access)</option>
                <option value="super_admin">Super Administrator (Platform Owner)</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-cyber-800">
              <Button variant="ghost" size="sm" onClick={() => setEditRoleUser(null)} className="text-xs">
                Cancel
              </Button>
              <Button
                variant="gaming"
                size="sm"
                onClick={() =>
                  updateRoleMutation.mutate({
                    id: editRoleUser.id,
                    roles: [selectedRole],
                  })
                }
                disabled={updateRoleMutation.isPending}
                className="text-xs"
              >
                {updateRoleMutation.isPending ? 'Updating...' : 'Save Role'}
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Confirmation */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteUserMutation.mutate(deleteTarget.id);
        }}
        title="Delete User Account?"
        description={`Are you sure you want to delete user account "${deleteTarget?.email}"? All saved builds and active cart items will be removed.`}
        confirmText="Delete Account"
        confirmationWord="DELETE"
        isDestructive={true}
      />
    </div>
  );
}
