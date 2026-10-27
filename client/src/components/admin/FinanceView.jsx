import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DollarSign, Receipt, CreditCard, CheckCircle, XCircle, Download, Search, ShieldAlert, Award, FileText, Building2 } from 'lucide-react';
import { motion } from 'framer-motion';
import ClassFeeManagementView from './ClassFeeManagementView';

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

  return (
    <div className="space-y-6">
      {/* Financial KPI Dashboard Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-emerald-100">Total Net Revenue</p>
                <h3 className="text-3xl font-black mt-1">₹{analytics.totalRevenue?.toLocaleString('en-IN')}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold">
                <DollarSign size={24} />
              </div>
            </div>
            <p className="text-xs text-emerald-100 mt-3 font-medium">Reconciled Razorpay collections</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-gray-500">Successful Payments</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{analytics.successfulCount}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <CheckCircle size={24} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 font-medium">{analytics.refundedCount} transactions refunded</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-gray-500">Failed / Drop-offs</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{analytics.failedCount}</h3>
              </div>
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center font-bold">
                <ShieldAlert size={24} />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3 font-medium">No chargeback disputes pending</p>
          </div>

          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800 flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">Club Budgets Disbursed</p>
              <h3 className="text-2xl font-black mt-1 text-white">₹{analytics.totalBudgetApproved?.toLocaleString('en-IN')}</h3>
            </div>
            <button
              onClick={handleExportLedger}
              className="mt-4 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Download size={14} /> Export Financial Ledger (.XLSX)
            </button>
          </div>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex border-b border-gray-200 gap-6 overflow-x-auto">
        <button
          onClick={() => setSubTab('classes')}
          className={`pb-3 text-sm font-bold border-b-2 transition flex items-center gap-1.5 shrink-0 ${
            subTab === 'classes' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          <Building2 size={16} />
          <span>Department & Class Fee Cards</span>
          <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-full">NEW</span>
        </button>
        <button
          onClick={() => setSubTab('transactions')}
          className={`pb-3 text-sm font-bold border-b-2 transition shrink-0 ${
            subTab === 'transactions' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Transaction History & Receipts
        </button>
        <button
          onClick={() => setSubTab('budgets')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            subTab === 'budgets' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Club Budgets & Expense Approvals ({budgets.filter(b => b.status === 'Pending').length} pending)
        </button>
        <button
          onClick={() => setSubTab('waivers')}
          className={`pb-3 text-sm font-bold border-b-2 transition ${
            subTab === 'waivers' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Fee Waivers & Financial Aid
        </button>
      </div>

      {/* 0. Department & Class Fee Cards Tab */}
      {subTab === 'classes' && (
        <ClassFeeManagementView clubs={clubs} />
      )}

      {/* 1. Transactions Tab */}
      {subTab === 'transactions' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <form onSubmit={handleSearch} className="flex items-center gap-2 w-full md:w-96">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="Search receipt, student roll no..."
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
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
              >
                <option value="all">All Payment Statuses</option>
                <option value="success">Successful</option>
                <option value="refunded">Refunded</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-black">
                    <th className="py-3 px-6">Receipt No</th>
                    <th className="py-3 px-6">Student</th>
                    <th className="py-3 px-6">Roll Number</th>
                    <th className="py-3 px-6">Club / Scope</th>
                    <th className="py-3 px-6">Fee Type</th>
                    <th className="py-3 px-6">Amount</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {transactions.map((tx) => (
                    <tr key={tx._id} className="hover:bg-gray-50">
                      <td className="py-3 px-6 font-mono font-bold text-primary-700">
                        {tx.receiptNumber || `RCP-${tx._id.slice(-6).toUpperCase()}`}
                      </td>
                      <td className="py-3 px-6 font-bold text-gray-900">{tx.userId?.name || 'N/A'}</td>
                      <td className="py-3 px-6 font-mono text-gray-600">{tx.userId?.roll_no || 'N/A'}</td>
                      <td className="py-3 px-6">{tx.clubId?.name || 'Campus Wide'}</td>
                      <td className="py-3 px-6">
                        <span className="capitalize">{tx.paymentType?.replace('_', ' ') || 'Membership'}</span>
                      </td>
                      <td className="py-3 px-6 font-black text-gray-900">₹{tx.amount}</td>
                      <td className="py-3 px-6">
                        {tx.status === 'refunded' ? (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px]">
                            REFUNDED
                          </span>
                        ) : tx.status === 'success' || tx.status === 'Paid' ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                            PAID
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded font-bold text-[10px]">
                            {tx.status.toUpperCase()}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right space-x-2">
                        <button
                          onClick={() => setSelectedReceipt(tx)}
                          className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[11px] font-bold"
                        >
                          Receipt
                        </button>
                        {tx.status === 'success' && (
                          <button
                            onClick={() => handleRefund(tx._id)}
                            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[11px] font-bold"
                          >
                            Refund
                          </button>
                        )}
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
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Club Budget Proposals & Expense Audits</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-black">
                    <th className="py-3 px-6">Club</th>
                    <th className="py-3 px-6">Proposal Title</th>
                    <th className="py-3 px-6">Category</th>
                    <th className="py-3 px-6">Requested</th>
                    <th className="py-3 px-6">Approved</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {budgets.map((b) => (
                    <tr key={b._id} className="hover:bg-gray-50">
                      <td className="py-3 px-6 font-bold text-gray-900">{b.clubId?.name || 'Club'}</td>
                      <td className="py-3 px-6 font-semibold">{b.title}</td>
                      <td className="py-3 px-6">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-bold">{b.category}</span>
                      </td>
                      <td className="py-3 px-6 font-bold text-gray-900">₹{b.amountRequested?.toLocaleString('en-IN')}</td>
                      <td className="py-3 px-6 font-bold text-emerald-700">₹{b.amountApproved?.toLocaleString('en-IN') || 0}</td>
                      <td className="py-3 px-6">
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          b.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                          b.status === 'Rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {b.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => {
                            setBudgetReviewModal(b);
                            setReviewData({ status: 'Approved', amountApproved: b.amountRequested, reviewNotes: '' });
                          }}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-[11px] font-bold"
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
        </div>
      )}

      {/* 3. Fee Waivers Tab */}
      {subTab === 'waivers' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-2xl">
          <h3 className="font-black text-gray-900 text-lg mb-1 flex items-center gap-2">
            <Award className="text-primary-600" size={22} /> Grant Student Fee Waiver
          </h3>
          <p className="text-gray-500 text-xs mb-6">
            Authorize a merit, economically-disadvantaged, or executive club fee waiver. This admits the student to the club without requiring an online payment transaction.
          </p>

          <form onSubmit={handleGrantWaiver} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Student Roll Number or College Email</label>
              <input
                required
                type="text"
                placeholder="e.g. 2023CS104 or student@campus.edu"
                value={waiverForm.rollNoOrEmail}
                onChange={(e) => setWaiverForm({ ...waiverForm, rollNoOrEmail: e.target.value })}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Select Club</label>
                <select
                  required
                  value={waiverForm.clubId}
                  onChange={(e) => setWaiverForm({ ...waiverForm, clubId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value="">-- Choose Club --</option>
                  {clubs.map(c => (
                    <option key={c._id} value={c._id}>{c.name} (Fee: ₹{c.joinFee || 500})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Discount Percentage</label>
                <select
                  value={waiverForm.discountPercent}
                  onChange={(e) => setWaiverForm({ ...waiverForm, discountPercent: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none"
                >
                  <option value={100}>100% Full Fee Waiver (₹0)</option>
                  <option value={75}>75% Partial Waiver</option>
                  <option value={50}>50% Half Fee Waiver</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Waiver Justification / Reason</label>
              <textarea
                required
                rows={3}
                placeholder="Specify scholarship, merit achievement, or faculty recommendation note..."
                value={waiverForm.reason}
                onChange={(e) => setWaiverForm({ ...waiverForm, reason: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={waiverSubmitting}
              className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
            >
              {waiverSubmitting ? 'Granting Waiver...' : 'Approve Waiver & Enroll Student'}
            </button>
          </form>
        </div>
      )}

      {/* Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100">
            <div className="border-b border-gray-100 pb-4 text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Receipt size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-900">CampusHub Official Receipt</h3>
              <p className="text-xs font-mono text-gray-400 mt-1">{selectedReceipt.receiptNumber}</p>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-bold">Student Name:</span>
                <span className="font-bold text-gray-900">{selectedReceipt.userId?.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-bold">Roll Number:</span>
                <span className="font-mono font-bold text-primary-700">{selectedReceipt.userId?.roll_no || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-bold">Club / Purpose:</span>
                <span className="font-bold text-gray-800">{selectedReceipt.clubId?.name || 'Campus Wide'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-bold">Payment Method:</span>
                <span className="font-bold text-gray-800">{selectedReceipt.paymentMethod || 'Razorpay'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500 font-bold">Amount Paid:</span>
                <span className="text-base font-black text-emerald-600">₹{selectedReceipt.amount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500 font-bold">Date & Time:</span>
                <span className="text-gray-700">{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition"
              >
                Print Receipt
              </button>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Budget Review Modal */}
      {budgetReviewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100">
            <h3 className="text-lg font-black text-gray-900 mb-1">Review Club Budget Request</h3>
            <p className="text-xs text-gray-500 mb-4">{budgetReviewModal.title} - {budgetReviewModal.clubId?.name}</p>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Requested Amount</label>
                <p className="text-base font-black text-gray-900">₹{budgetReviewModal.amountRequested?.toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Decision</label>
                <div className="flex gap-3">
                  {['Approved', 'Rejected'].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewData({ ...reviewData, status: s })}
                      className={`px-4 py-2 rounded-xl font-bold border transition ${
                        reviewData.status === s ? 'bg-primary-600 text-white border-primary-600' : 'bg-gray-50 text-gray-700 border-gray-200'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {reviewData.status === 'Approved' && (
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Approved Amount (₹)</label>
                  <input
                    type="number"
                    value={reviewData.amountApproved}
                    onChange={(e) => setReviewData({ ...reviewData, amountApproved: Number(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Administrative Remarks</label>
                <textarea
                  rows={3}
                  value={reviewData.reviewNotes}
                  onChange={(e) => setReviewData({ ...reviewData, reviewNotes: e.target.value })}
                  placeholder="Notes regarding fund allocation..."
                  className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setBudgetReviewModal(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewBudgetSubmit}
                className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md"
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
