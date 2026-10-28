import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield, Search, RefreshCw, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import PageHeader from '../ui/PageHeader';
import StatTile from '../ui/StatTile';

const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAuditData = async () => {
    setLoading(true);
    try {
      const [logsRes, statsRes] = await Promise.all([
        axios.get('/api/audit-logs', {
          params: {
            page,
            limit: 30,
            action: selectedAction !== 'all' ? selectedAction : undefined,
            search: search.trim() || undefined
          },
          withCredentials: true
        }),
        axios.get('/api/audit-logs/stats', { withCredentials: true })
      ]);

      setLogs(logsRes.data.logs || []);
      setTotalPages(logsRes.data.totalPages || 1);
      setTotalCount(logsRes.data.total || 0);
      setStats(statsRes.data);
    } catch (err) {
      toast.error('Failed to load audit trail logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [page, selectedAction]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchAuditData();
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Shield}
        eyebrow="Security"
        title="Audit Logs"
        description="Immutable trail of administrative and security operations."
      />

      {/* Audit Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatTile icon={Shield} label="Total audited events" value={stats.totalLogs} hint="Immutable security trail" tint="blue" />

          <div className="card p-4 sm:p-5 md:col-span-3 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Most frequent admin operations</p>
            <div className="flex flex-wrap gap-2">
              {stats.actionsBreakdown?.slice(0, 6).map((a) => (
                <span key={a._id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold break-all">
                  {a._id}: <span className="text-blue-600 font-bold">{a.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:max-w-md">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search by admin name or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-icon"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedAction}
            onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
            className="input md:w-56"
          >
            <option value="all">All Action Types</option>
            <option value="STUDENT_BULK_IMPORT">Student Bulk Import</option>
            <option value="PAYMENT_REFUNDED">Payment Refunded</option>
            <option value="FEE_WAIVER_GRANTED">Fee Waiver Granted</option>
            <option value="QR_CHECKIN_SUCCESS">QR Check-in</option>
            <option value="ELECTION_CREATED">Election Created</option>
            <option value="BALLOT_CAST">Ballot Cast</option>
            <option value="VENUE_CREATED">Venue Created</option>
            <option value="BOOKING_APPROVED">Booking Approved</option>
          </select>

          <button
            onClick={() => { setSearch(''); setSelectedAction('all'); setPage(1); fetchAuditData(); }}
            className="btn-icon-outline shrink-0"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="card-title flex items-center gap-2">
            <Activity size={16} className="text-blue-600" />
            Audit stream <span className="text-slate-400 font-semibold">({totalCount})</span>
          </h3>
          <span className="text-xs text-slate-400 font-medium">Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="p-10 flex flex-col items-center gap-3 text-slate-400 text-sm">
            <div className="spinner" />
            Loading audit trail...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center">
            <div className="icon-tile bg-slate-100 text-slate-400 mx-auto mb-3">
              <Shield size={20} />
            </div>
            <p className="font-bold text-dark-900 text-sm">No audit logs matching criteria</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Operator</th>
                  <th>Role</th>
                  <th>Target Model</th>
                  <th>Status</th>
                  <th>Operational Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log._id}>
                    <td className="text-slate-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {log.action}
                    </td>
                    <td className="font-semibold text-dark-900 whitespace-nowrap">
                      {log.performedByName || 'System'}
                    </td>
                    <td className="capitalize">
                      <span className="badge-slate">
                        {log.performedByRole || 'admin'}
                      </span>
                    </td>
                    <td className="text-slate-600 font-medium">{log.targetType || 'System'}</td>
                    <td>
                      <span className="badge-green">
                        {log.status}
                      </span>
                    </td>
                    <td className="text-slate-500 font-mono text-[11px] max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs font-semibold text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsView;
