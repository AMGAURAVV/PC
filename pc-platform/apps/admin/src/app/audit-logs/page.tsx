'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScrollText, Shield, Eye, Clock, Terminal } from 'lucide-react';
import { Button, Badge, Modal } from '@pc-platform/ui';
import { getAdminAuditLogs } from '../../lib/api/admin-api';
import { AdminBreadcrumbs } from '../../components/shell/admin-breadcrumbs';
import { AdminDataTable, ColumnDef } from '../../components/ui/admin-data-table';

const MOCK_AUDIT_LOGS = [
  {
    id: 'log-1',
    actorEmail: 'admin@nexusrigs.com',
    action: 'UPDATE_PRICE',
    entityType: 'ProductPrice',
    entityId: 'prod-rtx-4080s',
    ipAddress: '192.168.1.42',
    createdAt: new Date().toISOString(),
    details: { previousPrice: 104999, newPrice: 99999, currency: 'INR', reason: 'Competitor price match' },
  },
  {
    id: 'log-2',
    actorEmail: 'warehouse@nexusrigs.com',
    action: 'RESTOCK_INVENTORY',
    entityType: 'Inventory',
    entityId: 'inv-7800x3d',
    ipAddress: '192.168.1.18',
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    details: { unitsAdded: 25, previousQuantity: 4, newQuantity: 29, bay: 'WH-BLR-01' },
  },
  {
    id: 'log-3',
    actorEmail: 'admin@nexusrigs.com',
    action: 'TOGGLE_RULE',
    entityType: 'CompatibilityRule',
    entityId: 'psu-headroom-buffer',
    ipAddress: '192.168.1.42',
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    details: { ruleId: 'psu-headroom-buffer', previousState: 'enabled', newState: 'enabled', buffer: '20%' },
  },
  {
    id: 'log-4',
    actorEmail: 'system@nexusrigs.com',
    action: 'ORDER_STATUS_TRANSITION',
    entityType: 'Order',
    entityId: 'PCP-2026-00042',
    ipAddress: '127.0.0.1',
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    details: { from: 'PENDING', to: 'CONFIRMED', committedStockUnits: 8, paymentMethod: 'MOCK_GATEWAY' },
  },
];

export default function AdminAuditLogsPage() {
  const [selectedLog, setSelectedLog] = React.useState<any | null>(null);

  const { data: logsResp, isLoading } = useQuery({
    queryKey: ['admin-audit-logs'],
    queryFn: () => getAdminAuditLogs({ limit: 100 }),
  });

  const logs = logsResp?.data || MOCK_AUDIT_LOGS;

  const columns: ColumnDef<any>[] = [
    {
      key: 'action',
      header: 'Audit Action',
      sortable: true,
      cell: (l) => {
        let badgeColor = 'border-cyan-500/30 text-cyan-400 bg-cyan-500/10';
        if (l.action.includes('DELETE') || l.action.includes('CANCEL')) {
          badgeColor = 'border-rose-500/30 text-rose-400 bg-rose-500/10';
        } else if (l.action.includes('RESTOCK') || l.action.includes('CONFIRM')) {
          badgeColor = 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10';
        }

        return (
          <Badge variant="tech" className={`font-mono text-[10px] ${badgeColor}`}>
            {l.action}
          </Badge>
        );
      },
    },
    {
      key: 'actor',
      header: 'Administrator / Actor',
      sortable: true,
      cell: (l) => (
        <span className="font-mono text-xs text-white font-medium">
          {l.actorEmail || l.actor?.email || 'admin@nexusrigs.com'}
        </span>
      ),
    },
    {
      key: 'entity',
      header: 'Target Entity',
      sortable: true,
      cell: (l) => (
        <div className="font-mono text-xs">
          <span className="text-cyber-300">{l.entityType}</span>
          <span className="text-cyber-500 text-[10px] block">#{l.entityId}</span>
        </div>
      ),
    },
    {
      key: 'ip',
      header: 'Origin IP',
      cell: (l) => (
        <span className="font-mono text-xs text-cyber-500">
          {l.ipAddress || '127.0.0.1'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Timestamp',
      sortable: true,
      cell: (l) => (
        <span className="font-mono text-xs text-cyber-400">
          {new Date(l.createdAt || Date.now()).toLocaleString('en-IN', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Details',
      className: 'text-right',
      cell: (l) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSelectedLog(l)}
          className="h-7 text-xs font-mono gap-1 text-cyan-400 hover:text-white"
        >
          <Eye className="w-3 h-3" />
          <span>JSON</span>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminBreadcrumbs items={[{ label: 'Security Audit Logs' }]} />

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-cyber-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold font-mono text-white">
              PLATFORM AUDIT TRAIL & COMPLIANCE
            </h1>
            <Badge variant="tech">IMMUTABLE LOGS</Badge>
          </div>
          <p className="text-xs text-cyber-400 mt-1">
            Complete cryptographic audit trail of all staff logins, hardware price overrides, inventory stock commits, and rule toggles.
          </p>
        </div>
      </div>

      <AdminDataTable
        data={logs}
        columns={columns}
        isLoading={isLoading}
        searchPlaceholder="Filter audit logs by actor, action, or entity..."
        searchFilter={(l, q) =>
          l.action.toLowerCase().includes(q) ||
          (l.actorEmail && l.actorEmail.toLowerCase().includes(q)) ||
          l.entityType.toLowerCase().includes(q) ||
          l.entityId.toLowerCase().includes(q)
        }
      />

      {/* JSON Inspector Modal */}
      <Modal
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        title={`Audit Event: ${selectedLog?.action}`}
        className="max-w-xl bg-[#0c101d] border-cyber-800"
      >
        {selectedLog && (
          <div className="space-y-4 pt-2 font-mono text-xs">
            <div className="grid grid-cols-2 gap-3 p-3 bg-cyber-900/60 rounded border border-cyber-800 text-[11px]">
              <div>
                <span className="text-cyber-500">Actor:</span>
                <div className="text-white font-bold">{selectedLog.actorEmail || selectedLog.actor?.email}</div>
              </div>
              <div>
                <span className="text-cyber-500">Target Entity:</span>
                <div className="text-cyan-400 font-bold">{selectedLog.entityType} ({selectedLog.entityId})</div>
              </div>
              <div>
                <span className="text-cyber-500">IP Address:</span>
                <div className="text-cyber-300">{selectedLog.ipAddress || '127.0.0.1'}</div>
              </div>
              <div>
                <span className="text-cyber-500">Timestamp:</span>
                <div className="text-cyber-300">{new Date(selectedLog.createdAt).toISOString()}</div>
              </div>
            </div>

            <div>
              <span className="text-cyber-400 text-xs font-bold block mb-1">Payload Metadata:</span>
              <pre className="p-3 rounded bg-[#060910] border border-cyber-800 overflow-x-auto text-cyan-300 text-[11px]">
                {JSON.stringify(selectedLog.details || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
