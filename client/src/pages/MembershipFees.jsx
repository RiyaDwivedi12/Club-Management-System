import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CreditCard, CheckCircle2, Clock, XCircle, Search, RefreshCw,
  Receipt, ShieldCheck, ChevronRight, Download, Filter, Building2,
  Sparkles, ExternalLink, AlertCircle, Info, ArrowUpRight, Lock
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import PageHeader from '../components/ui/PageHeader';
import StatTile from '../components/ui/StatTile';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/EmptyState';
import PaymentReceiptModal from '../components/PaymentReceiptModal';

const CATEGORIES = ['All', 'Sports', 'Cultural', 'Literary', 'Technical', 'Social'];

const MembershipFees = () => {
  const { user } = useAuthStore();
  const [clubs, setClubs] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingClubId, setProcessingClubId] = useState(null);

  // Tabs: 'pay' (Active clubs & payment) or 'history' (Payment records & receipts)
  const [activeTab, setActiveTab] = useState('pay');

  // Filters & search
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all');

  // Modals
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [mockOrderData, setMockOrderData] = useState(null);
  const [lastVerifiedPayment, setLastVerifiedPayment] = useState(null);

  // Fetch student clubs status & payment history
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clubsRes, paymentsRes] = await Promise.all([
        axios.get('/api/payments/clubs-status', { withCredentials: true }),
        axios.get('/api/payments/my-payments', { withCredentials: true })
      ]);
      setClubs(clubsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (err) {
      console.error('Error loading membership fees data:', err);
      toast.error(err.response?.data?.message || 'Failed to load membership fees data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dynamically load Razorpay SDK if not already present
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle Pay Membership Fee via Razorpay
  const handleInitiatePayment = async (club) => {
    if (!club?._id) return;

    if (club.paymentStatus === 'Paid') {
      toast('You have already paid the membership fee for this club.', { icon: 'ℹ️' });
      return;
    }

    setIsProcessing(true);
    setProcessingClubId(club._id);

    try {
      // 1. Create order on backend (fee is strictly validated from DB, prevents client manipulation)
      const orderRes = await axios.post(
        '/api/payments/order',
        { clubId: club._id },
        { withCredentials: true }
      );

      const orderData = orderRes.data;

      // Direct admission for free clubs (0 fee)
      if (orderData.free) {
        toast.success(orderData.message || '🎉 Joined club successfully! Zero fee required.');
        await fetchData();
        setIsProcessing(false);
        setProcessingClubId(null);
        return;
      }

      // If keys are in mock simulation mode
      if (orderData.isMock) {
        setMockOrderData({
          ...orderData,
          club
        });
        setIsProcessing(false);
        setProcessingClubId(null);
        return;
      }

      // 2. Load SDK & initialize Razorpay Checkout
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded || !window.Razorpay) {
        toast.error('Unable to load Razorpay payment gateway. Please check your internet connection.');
        setIsProcessing(false);
        setProcessingClubId(null);
        return;
      }

      const options = {
        key: orderData.keyId,
        amount: orderData.amount, // in paise
        currency: orderData.currency || 'INR',
        name: 'CampusHub Student Portal',
        description: `Membership Fee for ${club.name}`,
        order_id: orderData.id,
        handler: async function (response) {
          try {
            // 3. Server-side payment verification
            const verifyRes = await axios.post(
              '/api/payments/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                clubId: club._id
              },
              { withCredentials: true }
            );

            if (verifyRes.data.success) {
              toast.success(`🎉 Payment verified! Welcome to ${club.name}. Membership status is now Paid.`);
              setLastVerifiedPayment(verifyRes.data.payment);
              await fetchData();
            } else {
              toast.error(verifyRes.data.message || 'Payment verification failed');
            }
          } catch (verifyErr) {
            console.error('Verification error:', verifyErr);
            toast.error(verifyErr.response?.data?.message || 'Payment verification failed.');
          } finally {
            setIsProcessing(false);
            setProcessingClubId(null);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || user?.roll_no || ''
        },
        notes: {
          clubId: club._id,
          clubName: club.name,
          studentName: user?.name,
          rollNo: user?.roll_no
        },
        theme: {
          color: '#2563eb'
        },
        modal: {
          ondismiss: function () {
            setIsProcessing(false);
            setProcessingClubId(null);
            toast('Payment checkout closed', { icon: 'ℹ️' });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setIsProcessing(false);
        setProcessingClubId(null);
        toast.error(resp.error?.description || 'Payment failed or declined by bank.');
      });

      rzp.open();
    } catch (err) {
      console.error('Error initiating payment:', err);
      toast.error(err.response?.data?.message || 'Failed to initiate fee payment');
      setIsProcessing(false);
      setProcessingClubId(null);
    }
  };

  // Test simulation handler for development / mock environments
  const handleSimulatePayment = async () => {
    if (!mockOrderData) return;
    setIsProcessing(true);
    try {
      const verifyRes = await axios.post(
        '/api/payments/verify',
        {
          razorpay_order_id: mockOrderData.id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          clubId: mockOrderData.club._id
        },
        { withCredentials: true }
      );

      if (verifyRes.data.success) {
        toast.success(`🎉 Payment simulated successfully! You are now an active member of ${mockOrderData.club.name}.`);
        setLastVerifiedPayment(verifyRes.data.payment);
        setMockOrderData(null);
        await fetchData();
      } else {
        toast.error(verifyRes.data.message || 'Simulation verification failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Payment simulation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filtered clubs
  const filteredClubs = clubs.filter((c) => {
    const matchesSearch =
      c.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase()) ||
      c.category?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || c.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Filtered payments
  const filteredPayments = payments.filter((p) => {
    const matchesStatus =
      historyStatusFilter === 'all' ||
      (historyStatusFilter === 'success' && (p.status === 'success' || p.status === 'Paid')) ||
      (historyStatusFilter === 'pending' && (p.status === 'pending' || p.status === 'Pending')) ||
      (historyStatusFilter === 'failed' && p.status === 'failed');

    const clubName = p.clubId?.name || '';
    const receiptNo = p.receiptNumber || '';
    const payId = p.razorpayPaymentId || '';

    const matchesSearch =
      !search ||
      clubName.toLowerCase().includes(search.toLowerCase()) ||
      receiptNo.toLowerCase().includes(search.toLowerCase()) ||
      payId.toLowerCase().includes(search.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  // KPI calculations
  const totalPaid = payments
    .filter((p) => p.status === 'success' || p.status === 'Paid')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const activePaidClubs = clubs.filter((c) => c.paymentStatus === 'Paid').length;
  const pendingClubs = clubs.filter((c) => c.paymentStatus === 'Pending').length;
  const availableClubs = clubs.filter((c) => c.paymentStatus === 'Unpaid').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14">
      {/* Page Header */}
      <PageHeader
        variant="hero"
        icon={CreditCard}
        eyebrow="Financial Services"
        title="Club Membership Fee Payment"
        description="Select your campus club, pay annual membership fees securely via Razorpay, and instantly unlock member privileges, event registrations, and official collegiate receipts."
        actions={
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="btn-secondary text-sm inline-flex items-center gap-2"
          >
            <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* Overview Stat Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          icon={CreditCard}
          tint="blue"
          label="Total Fees Paid"
          value={`₹${totalPaid.toLocaleString('en-IN')}`}
          hint="Reconciled collegiate dues"
        />
        <StatTile
          icon={CheckCircle2}
          tint="emerald"
          label="Paid Club Memberships"
          value={activePaidClubs}
          hint="Active voting memberships"
        />
        <StatTile
          icon={Clock}
          tint="amber"
          label="Pending Payments"
          value={pendingClubs}
          hint="Awaiting verification"
        />
        <StatTile
          icon={Building2}
          tint="indigo"
          label="Available Clubs"
          value={availableClubs}
          hint="Open for enrollment"
        />
      </div>

      {/* Navigation Tabs */}
      <div className="card p-1.5 flex gap-1 bg-slate-100/80 max-w-md">
        <button
          onClick={() => setActiveTab('pay')}
          className={`tab flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'pay' ? 'tab-active bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard size={16} />
          Pay Membership Fee
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`tab flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold rounded-lg transition-all ${
            activeTab === 'history' ? 'tab-active bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Receipt size={16} />
          Payment History ({payments.length})
        </button>
      </div>

      {/* TAB 1: PAY MEMBERSHIP FEE */}
      {activeTab === 'pay' && (
        <div className="space-y-6">
          {/* Search & Category Filter Bar */}
          <div className="card p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1 min-w-0">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`tab text-xs sm:text-sm px-3 py-1.5 rounded-lg ${
                    categoryFilter === cat ? 'tab-active font-semibold' : ''
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-80 shrink-0">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search club name or keyword..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-icon text-sm"
              />
            </div>
          </div>

          {/* Clubs Grid */}
          {isLoading ? (
            <div className="py-12">
              <LoadingState label="Loading club fee directories..." />
            </div>
          ) : filteredClubs.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No Clubs Matching Filter"
              description="No clubs found matching your search criteria. Try a different search term or category."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClubs.map((club) => {
                const isPaid = club.paymentStatus === 'Paid';
                const isPending = club.paymentStatus === 'Pending';
                const isCurrentProcessing = isProcessing && processingClubId === club._id;

                return (
                  <motion.div
                    key={club._id}
                    layout
                    className={`card p-5 flex flex-col justify-between border transition-all ${
                      isPaid
                        ? 'border-emerald-200 bg-emerald-50/20 shadow-sm'
                        : isPending
                        ? 'border-amber-200 bg-amber-50/20'
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-md'
                    }`}
                  >
                    <div>
                      {/* Top Header & Badges */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {club.logo ? (
                            <img
                              src={club.logo}
                              alt={club.name}
                              className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-xs"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-lg border border-blue-200 shadow-xs">
                              {club.name?.charAt(0) || 'C'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                              {club.category}
                            </span>
                            <h3 className="font-bold text-dark-900 text-base leading-snug truncate">
                              {club.name}
                            </h3>
                          </div>
                        </div>

                        {/* Status Badge */}
                        {isPaid ? (
                          <span className="badge-green text-xs font-semibold shrink-0 inline-flex items-center gap-1 px-2.5 py-1">
                            <CheckCircle2 size={12} />
                            Paid
                          </span>
                        ) : isPending ? (
                          <span className="badge-amber text-xs font-semibold shrink-0 inline-flex items-center gap-1 px-2.5 py-1">
                            <Clock size={12} />
                            Pending
                          </span>
                        ) : (
                          <span className="badge-blue text-xs font-semibold shrink-0 px-2.5 py-1">
                            Unpaid
                          </span>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-slate-600 text-xs line-clamp-2 mb-4 leading-relaxed">
                        {club.description || 'No description provided for this campus organization.'}
                      </p>

                      {/* Fee Box */}
                      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-4 flex items-center justify-between">
                        <div>
                          <p className="text-[11px] text-slate-500 font-medium">Annual Membership Fee</p>
                          <p className="text-lg font-black text-dark-900">
                            {club.joinFee === 0 ? (
                              <span className="text-emerald-600 font-bold">FREE</span>
                            ) : (
                              `₹${club.joinFee.toLocaleString('en-IN')}`
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-medium">Gateway</p>
                          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block">
                            Razorpay Secured
                          </span>
                        </div>
                      </div>

                      {/* Payment Details if available */}
                      {club.paymentDetails && (
                        <div className="text-[11px] text-slate-500 bg-white border border-slate-200 rounded-lg p-2.5 mb-4 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-slate-400">Receipt No:</span>
                            <span className="font-mono font-medium text-dark-900">
                              {club.paymentDetails.receiptNumber || 'N/A'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">Paid Date:</span>
                            <span>
                              {club.paymentDetails.date
                                ? new Date(club.paymentDetails.date).toLocaleDateString()
                                : 'Recent'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-2">
                      {isPaid ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(club.paymentDetails)}
                            className="btn-secondary w-full text-xs font-semibold py-2 inline-flex items-center justify-center gap-1.5"
                          >
                            <Receipt size={14} className="text-blue-600" />
                            View Receipt
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleInitiatePayment(club)}
                          disabled={isProcessing}
                          className="btn-primary w-full text-xs font-semibold py-2.5 inline-flex items-center justify-center gap-1.5 shadow-sm"
                        >
                          {isCurrentProcessing ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              Connecting Gateway...
                            </>
                          ) : (
                            <>
                              <Lock size={13} />
                              Pay {club.joinFee === 0 ? '₹0 (Join Now)' : `₹${club.joinFee} via Razorpay`}
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PAYMENT HISTORY & RECEIPTS */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Search & Filter Header */}
          <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 min-w-0 md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search by receipt no, club name or payment ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-icon text-sm"
              />
            </div>

            <div className="w-full md:w-56">
              <select
                value={historyStatusFilter}
                onChange={(e) => setHistoryStatusFilter(e.target.value)}
                className="input text-sm"
              >
                <option value="all">All Payment Statuses</option>
                <option value="success">Paid / Successful</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
          </div>

          {/* Payments Table */}
          {isLoading ? (
            <div className="py-12">
              <LoadingState label="Loading payment history..." />
            </div>
          ) : filteredPayments.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="No Payment Records Found"
              description="You have not made any club membership fee payments yet, or no records match your filter."
              actionLabel="Pay Membership Fee"
              onAction={() => setActiveTab('pay')}
            />
          ) : (
            <div className="card overflow-hidden">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Receipt No</th>
                      <th>Club Name</th>
                      <th>Fee Amount</th>
                      <th>Payment Method</th>
                      <th>Gateway Ref (ID)</th>
                      <th>Transaction Date</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((p) => {
                      const isSuccess = p.status === 'success' || p.status === 'Paid';
                      const isFailed = p.status === 'failed';
                      const isPending = p.status === 'pending' || p.status === 'Pending';

                      return (
                        <tr key={p._id}>
                          <td className="font-mono font-bold text-blue-700 whitespace-nowrap">
                            {p.receiptNumber || `RCP-${p._id.slice(-6).toUpperCase()}`}
                          </td>
                          <td className="font-semibold text-dark-900 whitespace-nowrap">
                            {p.clubId?.name || 'Campus Wide Club'}
                          </td>
                          <td className="font-bold text-dark-900 whitespace-nowrap">
                            ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="whitespace-nowrap text-xs text-slate-600">
                            {p.paymentMethod || 'Razorpay Gateway'}
                          </td>
                          <td className="font-mono text-xs text-slate-500 whitespace-nowrap">
                            {p.razorpayPaymentId || '—'}
                          </td>
                          <td className="whitespace-nowrap text-xs text-slate-600">
                            {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="whitespace-nowrap">
                            {isSuccess ? (
                              <span className="badge-green inline-flex items-center gap-1">
                                <CheckCircle2 size={12} /> Paid
                              </span>
                            ) : isFailed ? (
                              <span className="badge-red inline-flex items-center gap-1">
                                <XCircle size={12} /> Failed
                              </span>
                            ) : (
                              <span className="badge-amber inline-flex items-center gap-1">
                                <Clock size={12} /> Pending
                              </span>
                            )}
                          </td>
                          <td className="text-right whitespace-nowrap">
                            {isSuccess && (
                              <button
                                type="button"
                                onClick={() => setSelectedReceipt(p)}
                                className="btn-secondary btn-sm inline-flex items-center gap-1 text-xs"
                              >
                                <Receipt size={13} />
                                View Receipt
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* RAZORPAY TEST SIMULATOR MODAL (when mock / test credentials are used) */}
      <AnimatePresence>
        {mockOrderData && (
          <div className="modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-panel sm:max-w-md p-6"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-blue-600">
                  <ShieldCheck size={24} />
                  <h3 className="font-bold text-dark-900 text-lg">Razorpay Simulator</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setMockOrderData(null)}
                  className="btn-ghost p-1 text-slate-400 hover:text-slate-700"
                >
                  <XCircle size={20} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 space-y-1">
                  <p className="font-semibold flex items-center gap-1.5 text-blue-800">
                    <Info size={14} /> Development & Sandbox Mode
                  </p>
                  <p className="text-slate-600">
                    Razorpay order <code>{mockOrderData.id}</code> generated successfully. Click Confirm to verify the cryptographic HMAC signature and activate your membership status.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Club:</span>
                    <span className="font-bold text-dark-900">{mockOrderData.club?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Student:</span>
                    <span className="font-medium text-dark-900">{user?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Membership Fee:</span>
                    <span className="font-bold text-emerald-600">
                      ₹{mockOrderData.feeAmount || mockOrderData.amount / 100}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Payment Channel:</span>
                    <span className="font-medium text-blue-700">UPI / Card / NetBanking</span>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setMockOrderData(null)}
                    className="btn-secondary flex-1 py-2.5 text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulatePayment}
                    disabled={isProcessing}
                    className="btn-primary flex-1 py-2.5 text-sm inline-flex items-center justify-center gap-2"
                  >
                    {isProcessing ? (
                      <RefreshCw size={15} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={15} />
                    )}
                    Confirm & Activate
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* SUCCESS CONFIRMATION MODAL */}
      <AnimatePresence>
        {lastVerifiedPayment && (
          <div className="modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-panel sm:max-w-md p-6 text-center"
            >
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-xl font-black text-dark-900 mb-2">
                Membership Fee Paid Successfully!
              </h3>
              <p className="text-sm text-slate-600 mb-6 leading-relaxed">
                Your payment of <strong className="text-dark-900">₹{lastVerifiedPayment.amount}</strong> has been confirmed by Razorpay. Your club membership status is now <strong className="text-emerald-600">Paid & Active</strong>.
              </p>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-6 text-xs text-left space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-500">Receipt No:</span>
                  <span className="font-bold text-blue-700">{lastVerifiedPayment.receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment ID:</span>
                  <span className="text-slate-800">{lastVerifiedPayment.razorpayPaymentId || 'N/A'}</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => setLastVerifiedPayment(null)}
                  className="btn-secondary flex-1 py-2.5 text-sm"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedReceipt(lastVerifiedPayment);
                    setLastVerifiedPayment(null);
                  }}
                  className="btn-primary flex-1 py-2.5 text-sm inline-flex items-center justify-center gap-1.5"
                >
                  <Receipt size={15} />
                  Print Receipt
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OFFICIAL RECEIPT MODAL */}
      {selectedReceipt && (
        <PaymentReceiptModal
          receipt={selectedReceipt}
          student={user}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
};

export default MembershipFees;

