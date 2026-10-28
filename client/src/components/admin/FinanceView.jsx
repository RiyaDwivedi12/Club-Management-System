import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DollarSign, Receipt, CreditCard, CheckCircle, XCircle, Download, Search, ShieldAlert, Award, FileText, Building2, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import ClassFeeManagementView from './ClassFeeManagementView';
import PageHeader from '../ui/PageHeader';
import StatTile from '../ui/StatTile';

const FinanceView = ({ clubs = [] }) => {
  const [subTab, setSubTab] = useState('transactions'); // transactions, budgets, waivers
  const [analytics, setAnalytics] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  // Fee waiver form state
  const [waiverForm, setWaiverForm] = useState({
    rollNoOrEmail: '',
    clubId: '',
    reason: '',
    discountPercent: 100
  });
  const [waiverSubmitting, setWaiverSubmitting] = useState(false);

  // Budget review state
  const [budgetReviewModal, setBudgetReviewModal] = useState(null);
  const [reviewData, setReviewData] = useState({ status: 'Approved', amountApproved: 0, reviewNotes: '' });

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, transRes, budgetsRes] = await Promise.all([
        axios.get('/api/finance/analytics', { withCredentials: true }),
        axios.get('/api/finance/transactions', {
          params: { status: statusFilter !== 'all' ? statusFilter : undefined, search: search.trim() || undefined },
          withCredentials: true
        }),
        axios.get('/api/finance/budgets', { withCredentials: true })
      ]);

      setAnalytics(analyticsRes.data);
      setTransactions(transRes.data.transactions || []);
      setBudgets(budgetsRes.data || []);
    } catch (err) {
      toast.error('Failed to load financial ledger data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialData();
  }, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFinancialData();
  };

  const handleExportLedger = () => {
    window.open('/api/finance/export', '_blank');
  };

  const handleRefund = async (paymentId) => {
    const reason = prompt('Please enter reason for issuing this refund:');
    if (!reason) return;

    try {
      await axios.post(`/api/finance/transactions/${paymentId}/refund`, { refundReason: reason }, { withCredentials: true });
      toast.success('Refund registered successfully');
      fetchFinancialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Refund failed');
    }
  };

  const handleGrantWaiver = async (e) => {
    e.preventDefault();
    setWaiverSubmitting(true);
    try {
      // Find student by roll number or email
      const userRes = await axios.get('/api/auth/users', { withCredentials: true });
      const found = userRes.data.find(u => 
        (u.roll_no && u.roll_no.toLowerCase() === waiverForm.rollNoOrEmail.trim().toLowerCase()) ||
        (u.email && u.email.toLowerCase() === waiverForm.rollNoOrEmail.trim().toLowerCase())
      );

      if (!found) {
        toast.error('Student not found with this Roll Number or Email.');
        setWaiverSubmitting(false);
        return;
      }

      await axios.post('/api/finance/fee-waiver', {
        studentId: found._id,
        clubId: waiverForm.clubId,
        reason: waiverForm.reason,
        discountPercent: Number(waiverForm.discountPercent)
      }, { withCredentials: true });

      toast.success(`Fee waiver approved! Student ${found.name} enrolled in club.`);
      setWaiverForm({ rollNoOrEmail: '', clubId: '', reason: '', discountPercent: 100 });
      fetchFinancialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to grant fee waiver');
    } finally {
      setWaiverSubmitting(false);
    }
  };

  const handleReviewBudgetSubmit = async () => {
    if (!budgetReviewModal) return;
    try {
      await axios.put(`/api/finance/budgets/${budgetReviewModal._id}/review`, reviewData, { withCredentials: true });
      toast.success(`Budget proposal ${reviewData.status.toLowerCase()} successfully`);
      setBudgetReviewModal(null);
      fetchFinancialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update budget status');
    }
  };

  const pendingBudgetCount = budgets.filter(b => b.status === 'Pending').length;

  const tabs = [
    { key: 'classes', label: 'Department & Class Fee Cards', icon: Building2, isNew: true },
    { key: 'transactions', label: 'Transaction History & Receipts', icon: Receipt },
    { key: 'budgets', label: `Club Budgets & Expense Approvals (${pendingBudgetCount} pending)`, icon: FileText },
    { key: 'waivers', label: 'Fee Waivers & Financial Aid', icon: Award },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        variant="plain"
        icon={Wallet}
        eyebrow="Finance"
        title="Finance & Payments"
        description="Track collections, review club budgets and grant fee waivers."
        actions={analytics && (
          <button onClick={handleExportLedger} className="btn-primary w-full sm:w-auto">
            <Download size={16} /> Export Financial Ledger (.XLSX)
          </button>
        )}
      />

      {/* Financial KPI tiles */}
      {analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatTile
            icon={DollarSign}
            tint="blue"
            label="Total Net Revenue"
            value={`₹${analytics.totalRevenue?.toLocaleString('en-IN')}`}
            hint="Reconciled Razorpay collections"
          />
          <StatTile
            icon={CheckCircle}
            tint="emerald"
            label="Successful Payments"
            value={analytics.successfulCount}
            hint={`${analytics.refundedCount} transactions refunded`}
          />
          <StatTile
            icon={ShieldAlert}
            tint="rose"
            label="Failed / Drop-offs"
            value={analytics.failedCount}
          />
          <StatTile
            icon={CreditCard}
            tint="indigo"
            label="Club Budgets Disbursed"
            value={`₹${analytics.totalBudgetApproved?.toLocaleString('en-IN')}`}
          />
        </div>
      )}

      {/* Sub Tabs */}
      <div className="card p-1.5 flex gap-1 overflow-x-auto hide-scrollbar">
        {tabs.map(({ key, label, icon: TabIcon, isNew }) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            className={`tab inline-flex items-center gap-2 shrink-0 ${subTab === key ? 'tab-active' : ''}`}
          >
            <TabIcon size={16} />
            <span>{label}</span>
            {isNew && (
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${subTab === key ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'}`}>
                New
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 0. Department & Class Fee Cards Tab */}
      {subTab === 'classes' && (
        <ClassFeeManagementView clubs={clubs} />
      )}

      {/* 1. Transactions Tab */}
      {subTab === 'transactions' && (
        <div className="space-y-4">
          <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:max-w-md">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search receipt, student roll no..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="input input-icon"
                />
              </div>
              <button type="submit" className="btn-primary shrink-0">
                Search
              </button>
            </form>

            <div className="w-full md:w-56">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="input"
              >
                <option value="all">All Payment Statuses</option>
                <option value="success">Successful</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Receipt No</th>
                    <th>Student</th>
                    <th>Roll Number</th>
                    <th>Club / Scope</th>
                    <th>Fee Type</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((tx) => (
                    <tr key={tx._id}>
                      <td className="font-mono font-semibold text-blue-700 whitespace-nowrap">
                        {tx.receiptNumber || `RCP-${tx._id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="font-semibold text-dark-900 whitespace-nowrap">{tx.userId?.name || 'N/A'}</td>
                      <td className="font-mono text-slate-600 whitespace-nowrap">{tx.userId?.roll_no || 'N/A'}</td>
                      <td className="whitespace-nowrap">{tx.clubId?.name || 'Campus Wide'}</td>
                      <td className="whitespace-nowrap">
                        <span className="capitalize">{tx.paymentType?.replace('_', ' ') || 'Membership'}</span>
                      </td>
                      <td className="font-bold text-dark-900 whitespace-nowrap">₹{tx.amount}</td>
                      <td>
                        {tx.status === 'refunded' ? (
                          <span className="badge-red">Refunded</span>
                        ) : tx.status === 'success' || tx.status === 'Paid' ? (
                          <span className="badge-green">Paid</span>
                        ) : (
                          <span className="badge-slate capitalize">{tx.status}</span>
                        )}
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => setSelectedReceipt(tx)}
                            className="btn-secondary btn-sm"
                          >
                            <Receipt size={13} /> Receipt
                          </button>
                          {tx.status === 'success' && (
                            <button
                              onClick={() => handleRefund(tx._id)}
                              className="btn btn-sm bg-red-50 text-red-700 hover:bg-red-100"
                            >
                              Refund
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Budgets Tab */}
      {subTab === 'budgets' && (
        <div className="card overflow-hidden">
          <div className="card-header">
            <div>
              <h3 className="card-title">Club Budget Proposals & Expense Audits</h3>
              <p className="card-subtitle">{pendingBudgetCount} pending review</p>
            </div>
          </div>
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Club</th>
                  <th>Proposal Title</th>
                  <th>Category</th>
                  <th>Requested</th>
                  <th>Approved</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => (
                  <tr key={b._id}>
                    <td className="font-semibold text-dark-900 whitespace-nowrap">{b.clubId?.name || 'Club'}</td>
                    <td className="font-medium">{b.title}</td>
                    <td>
                      <span className="badge-blue">{b.category}</span>
                    </td>
                    <td className="font-bold text-dark-900 whitespace-nowrap">₹{b.amountRequested?.toLocaleString('en-IN')}</td>
                    <td className="font-bold text-emerald-700 whitespace-nowrap">₹{b.amountApproved?.toLocaleString('en-IN') || 0}</td>
                    <td>
                      <span className={
                        b.status === 'Approved' ? 'badge-green' :
                        b.status === 'Rejected' ? 'badge-red' : 'badge-amber'
                      }>
                        {b.status}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          setBudgetReviewModal(b);
                          setReviewData({ status: 'Approved', amountApproved: b.amountRequested, reviewNotes: '' });
                        }}
                        className="btn-primary btn-sm"
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. Fee Waivers Tab */}
      {subTab === 'waivers' && (
        <div className="card p-5 sm:p-6 max-w-2xl">
          <div className="flex items-start gap-3 mb-6">
            <div className="icon-tile bg-violet-50 text-violet-600">
              <Award size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="section-title">Grant Student Fee Waiver</h3>
              <p className="text-sm text-slate-600 mt-1">
                Authorize a merit, economically-disadvantaged, or executive club fee waiver. This admits the student to the club without requiring an online payment transaction.
              </p>
            </div>
          </div>

          <form onSubmit={handleGrantWaiver} className="space-y-4">
            <div>
              <label className="label">Student Roll Number or College Email</label>
              <input
                required
                type="text"
                placeholder="e.g. 2023CS104 or student@campus.edu"
                value={waiverForm.rollNoOrEmail}
                onChange={(e) => setWaiverForm({ ...waiverForm, rollNoOrEmail: e.target.value })}
                className="input"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Select Club</label>
                <select
                  required
                  value={waiverForm.clubId}
                  onChange={(e) => setWaiverForm({ ...waiverForm, clubId: e.target.value })}
                  className="input"
                >
                  <option value="">-- Choose Club --</option>
                  {clubs.map(c => (
                    <option key={c._id} value={c._id}>{c.name} (Fee: ₹{c.joinFee || 500})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Discount Percentage</label>
                <select
                  value={waiverForm.discountPercent}
                  onChange={(e) => setWaiverForm({ ...waiverForm, discountPercent: e.target.value })}
                  className="input"
                >
                  <option value={100}>100% Full Fee Waiver (₹0)</option>
                  <option value={75}>75% Partial Waiver</option>
                  <option value={50}>50% Half Fee Waiver</option>
                </select>
              </div>
            </div>

            <div>
              <label className="label">Waiver Justification / Reason</label>
              <textarea
                required
                rows={3}
                placeholder="Specify scholarship, merit achievement, or faculty recommendation note..."
                value={waiverForm.reason}
                onChange={(e) => setWaiverForm({ ...waiverForm, reason: e.target.value })}
                className="input"
              />
            </div>

            <button
              type="submit"
              disabled={waiverSubmitting}
              className="btn-primary w-full"
            >
              {waiverSubmitting ? 'Granting Waiver...' : 'Approve Waiver & Enroll Student'}
            </button>
          </form>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="modal-overlay">
          <div className="modal-panel sm:max-w-md p-6">
            <div className="border-b border-slate-100 pb-4 text-center">
              <div className="icon-tile bg-emerald-50 text-emerald-600 mx-auto mb-3">
                <Receipt size={22} />
              </div>
              <h3 className="text-xl font-bold tracking-tight text-dark-900">CampusHub Official Receipt</h3>
              <p className="text-xs font-mono text-slate-400 mt-1 break-all">{selectedReceipt.receiptNumber}</p>
            </div>

            <div className="py-4 space-y-1 text-sm">
              <div className="flex justify-between gap-4 py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Student Name</span>
                <span className="font-semibold text-dark-900 text-right break-words">{selectedReceipt.userId?.name}</span>
              </div>
              <div className="flex justify-between gap-4 py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Roll Number</span>
                <span className="font-mono font-semibold text-blue-700 text-right">{selectedReceipt.userId?.roll_no || 'N/A'}</span>
              </div>
              <div className="flex justify-between gap-4 py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Club / Purpose</span>
                <span className="font-semibold text-dark-900 text-right break-words">{selectedReceipt.clubId?.name || 'Campus Wide'}</span>
              </div>
              <div className="flex justify-between gap-4 py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Payment Method</span>
                <span className="font-semibold text-dark-900 text-right">{selectedReceipt.paymentMethod || 'Razorpay'}</span>
              </div>
              <div className="flex justify-between gap-4 py-2 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Amount Paid</span>
                <span className="text-base font-extrabold text-emerald-600">₹{selectedReceipt.amount}</span>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <span className="text-slate-500 font-medium">Date & Time</span>
                <span className="text-slate-700 text-right">{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row gap-2">
              <button
                onClick={() => window.print()}
                className="btn-secondary flex-1"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="btn-primary flex-1"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Review Modal */}
      {budgetReviewModal && (
        <div className="modal-overlay">
          <div className="modal-panel p-6">
            <h3 className="text-lg font-bold tracking-tight text-dark-900 mb-1">Review Club Budget Request</h3>
            <p className="text-sm text-slate-500 mb-5 break-words">{budgetReviewModal.title} - {budgetReviewModal.clubId?.name}</p>

            <div className="space-y-4">
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Requested Amount</p>
                <p className="text-xl font-extrabold tracking-tight text-dark-900 mt-0.5">₹{budgetReviewModal.amountRequested?.toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="label">Decision</label>
                <div className="flex gap-2">
                  {['Approved', 'Rejected'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, status: s })}
                      className={`flex-1 sm:flex-none ${reviewData.status === s ? (s === 'Rejected' ? 'btn-danger' : 'btn-primary') : 'btn-secondary'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {reviewData.status === 'Approved' && (
                <div>
                  <label className="label">Approved Amount (₹)</label>
                  <input
                    type="number"
                    value={reviewData.amountApproved}
                    onChange={(e) => setReviewData({ ...reviewData, amountApproved: Number(e.target.value) })}
                    className="input font-semibold"
                  />
                </div>
              )}

              <div>
                <label className="label">Administrative Remarks</label>
                <textarea
                  rows={3}
                  value={reviewData.reviewNotes}
                  onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
                  placeholder="Notes regarding fund allocation..."
                  className="input"
                />
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
              <button
                onClick={() => setBudgetReviewModal(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewBudgetSubmit}
                className="btn-primary"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceView;
