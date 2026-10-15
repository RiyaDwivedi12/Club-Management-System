import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield, Clock, User, Filter, Search, CheckCircle, AlertTriangle, RefreshCw, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

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
      {/* Audit Stats Banner */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm">
            <p className="text-xs uppercase font-bold text-slate-400">Total Audited Events</p>
            <h3 className="text-3xl font-black mt-1 text-white">{stats.totalLogs}</h3>
            <p className="text-xs text-slate-400 mt-2 font-medium">Immutable security trail</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm md:col-span-3">
            <p className="text-xs uppercase font-bold text-gray-500 mb-2">Most Frequent Admin Operations</p>
            <div className="flex flex-wrap gap-2">
              {stats.actionsBreakdown?.slice(0, 6).map((a) => (
                <span key={a._id} className="px-3 py-1 bg-gray-50 border border-gray-200 text-gray-800 rounded-lg text-xs font-bold">
                  {a._id}: <span className="text-primary-600 font-black">{a.count}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search by admin name or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none"
            />
          </div>
          <button type="submit" className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedAction}
            onChange={(e) => { setSelectedAction(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
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
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Security & Administrative Audit Stream ({totalCount})</h3>
          <span className="text-xs text-gray-400 font-medium">Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-400 text-xs font-medium">Loading audit trail...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Shield size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="font-bold text-gray-700 text-sm">No audit logs matching criteria</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-black">
                  <th className="py-3 px-6">Timestamp</th>
                  <th className="py-3 px-6">Action</th>
                  <th className="py-3 px-6">Operator</th>
                  <th className="py-3 px-6">Role</th>
                  <th className="py-3 px-6">Target Model</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Operational Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {logs.map((log) => (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="py-3 px-6 text-gray-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-6 font-mono font-bold text-primary-700">
                      {log.action}
                    </td>
                    <td className="py-3 px-6 font-bold text-gray-900">
                      {log.performedByName || 'System'}
                    </td>
                    <td className="py-3 px-6 capitalize">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md font-semibold text-[10px]">
                        {log.performedByRole || 'admin'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-gray-600 font-semibold">{log.targetType || 'System'}</td>
                    <td className="py-3 px-6">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-gray-600 font-mono text-[11px] max-w-xs truncate">
                      {log.details ? JSON.stringify(log.details) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 rounded-lg disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogsView;
