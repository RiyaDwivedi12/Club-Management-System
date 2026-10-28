import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Users, Mail, Image as ImageIcon, Check, X, 
  CreditCard, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Receipt, Building2, Calendar
} from 'lucide-react';
import useClubStore from '../store/clubStore';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';
import PaymentReceiptModal from '../components/PaymentReceiptModal';
import LoadingState from '../components/ui/LoadingState';

const ClubDetails = () => {
  const { id } = useParams();
  const { currentClub: club, fetchClubById, leaveClub, approveMember, isLoading, error } = useClubStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('about');
  const [galleryUrl, setGalleryUrl] = useState('');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [mockOrderData, setMockOrderData] = useState(null);
  const [userPayment, setUserPayment] = useState(null);
  const [selectedReceipt, setSelectedReceipt] = useState(null);

  const fetchPaymentStatus = async () => {
    if (!user) return;
    try {
      const res = await axios.get('/api/payments/my-payments', { withCredentials: true });
      const payments = res.data || [];
      const match = payments.find(
        p => (p.clubId?._id === id || p.clubId === id) && (p.status === 'success' || p.status === 'Paid')
      );
      if (match) {
        setUserPayment(match);
      } else if (payments.length > 0 && club?.members?.some(m => (m._id || m) === user._id)) {
        setUserPayment(payments[0]);
      }
    } catch (err) {
      console.error('Failed to load user payments:', err);
    }
  };

  const handleAddPhoto = async (e) => {
    e.preventDefault();
    if (!galleryUrl.trim()) return toast.error('Please enter an image URL');
    setIsAddingPhoto(true);
    try {
      await axios.post(`/api/clubs/${club._id}/gallery`, { imageUrl: galleryUrl.trim() }, { withCredentials: true });
      toast.success('Photo added to gallery!');
      setGalleryUrl('');
      fetchClubById(id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add photo');
    } finally {
      setIsAddingPhoto(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      return toast.error('Please log in to join this club.');
    }

    setIsProcessingPayment(true);
    try {
      const { data: order } = await axios.post(
        '/api/payments/order',
        { clubId: club?._id },
        { withCredentials: true }
      );

      // Handle direct free club admission
      if (order.free) {
        toast.success(order.message || 'Joined club successfully!');
        await fetchClubById(id);
        setIsProcessingPayment(false);
        return;
      }

      // If in Mock / Test fallback mode (Razorpay real keys not provided in .env yet)
      if (order.isMock) {
        setIsProcessingPayment(false);
        setMockOrderData(order);
        return;
      }

      // Check if Razorpay SDK script is loaded
      if (typeof window.Razorpay === 'undefined') {
        toast.error('Razorpay Checkout SDK is still loading. Please refresh the page.');
        setIsProcessingPayment(false);
        return;
      }

      const options = {
        key: order.keyId,
        amount: order.amount,
        currency: order.currency || 'INR',
        name: 'ClubSphere — Campus Portal',
        description: `Membership dues for ${club?.name}`,
        order_id: order.id,
        handler: async function (response) {
          try {
            const verifyRes = await axios.post(
              '/api/payments/verify',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: club.joinFee || 500,
                clubId: club?._id
              },
              { withCredentials: true }
            );

            if (verifyRes.data.success) {
              toast.success('🎉 Payment verified! Welcome to the club.');
              await fetchClubById(id);
              await fetchPaymentStatus();
            }
          } catch (err) {
            toast.error(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setIsProcessingPayment(false);
          }
        },
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || user?.roll_no || ''
        },
        theme: { color: '#2563eb' },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
            toast('Payment window closed', { icon: 'ℹ️' });
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response) {
        setIsProcessingPayment(false);
        toast.error(response.error?.description || 'Payment failed or cancelled.');
      });

      rzp.open();
    } catch (error) {
      setIsProcessingPayment(false);
      toast.error(error.response?.data?.message || 'Could not initiate payment.');
    }
  };

  const handleSimulatePayment = async () => {
    if (!mockOrderData) return;
    setIsProcessingPayment(true);
    try {
      const verifyRes = await axios.post(
        '/api/payments/verify',
        {
          razorpay_order_id: mockOrderData.id,
          razorpay_payment_id: `pay_mock_${Date.now()}`,
          razorpay_signature: 'mock_signature',
          amount: club.joinFee || 500,
          clubId: club?._id
        },
        { withCredentials: true }
      );

      if (verifyRes.data.success) {
        toast.success('🎉 Test payment simulated successfully! You are now a member.');
        setMockOrderData(null);
        await fetchClubById(id);
        await fetchPaymentStatus();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Simulation verification failed');
    } finally {
      setIsProcessingPayment(false);
    }
  };


  useEffect(() => {
    fetchClubById(id);
    fetchPaymentStatus();
  }, [fetchClubById, id, user]);

  if (isLoading || !club) {
    return <LoadingState label="Loading club..." />;
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="bg-red-50 text-red-700 border border-red-200 p-4 rounded-xl text-sm font-semibold text-center">{error}</div>
      </div>
    );
  }

  const isMember = club.members?.some(m => (m._id || m) === user?._id) || (user?.clubMemberships && user.clubMemberships.includes(club._id)) || false;
  const isPending = club.pendingRequests?.some(m => (m._id || m) === user?._id) || false;
  const isLeadership = club.presidentId?._id === user?._id || club.facultyId?._id === user?._id || user?.role === 'admin';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-5xl mx-auto space-y-5 pb-12"
    >
      <Link to="/clubs" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-blue-600 transition-colors">
        <ArrowLeft size={16} /> Back to Clubs
      </Link>

      <div className="card overflow-hidden">
        <div className="h-52 sm:h-64 md:h-80 w-full relative bg-brand-gradient">
          {club.logo ? (
            <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-blue-400/20 blur-3xl pointer-events-none" />
              <span className="text-6xl md:text-7xl font-extrabold text-white/15 tracking-tight select-none">
                {club.name ? club.name.substring(0, 2).toUpperCase() : 'CL'}
              </span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900/90 via-dark-900/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-5 md:p-8 w-full">
            <div className="min-w-0">
              {club.category && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-blue-50 text-xs font-semibold mb-3 backdrop-blur">
                  {club.category}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2 break-words">{club.name}</h1>
              <div className="flex flex-wrap gap-4 text-sm text-white/85 font-medium">
                <span className="flex items-center"><Users size={16} className="mr-2" /> {club.members?.length || 0} Members</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for Leadership */}
        {isLeadership && (
          <div className="border-b border-slate-100 flex gap-1.5 px-4 sm:px-6 py-3 overflow-x-auto hide-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`tab ${activeTab === 'about' ? 'tab-active' : ''}`}
            >
              Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('members')}
              className={`tab flex items-center gap-2 ${activeTab === 'members' ? 'tab-active' : ''}`}
            >
              Manage Members
              {club.pendingRequests?.length > 0 && (
                <span className="bg-red-500 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full">{club.pendingRequests.length}</span>
              )}
            </button>
          </div>
        )}

        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {activeTab === 'about' ? (
            <>
              <div className="md:col-span-2 space-y-8 min-w-0">
                <div>
                  <h2 className="section-title mb-2">About Us</h2>
                  <p className="text-slate-600 leading-relaxed break-words">{club.description}</p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="section-title flex items-center">
                      <ImageIcon size={20} className="mr-2 text-blue-600" /> Club Gallery ({club.gallery?.length || 0})
                    </h2>
                  </div>

                  {isLeadership && (
                    <form onSubmit={handleAddPhoto} className="mb-5 p-3 sm:p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row gap-3">
                      <input
                        type="url"
                        required
                        placeholder="Paste image URL (e.g. https://...)..."
                        value={galleryUrl}
                        onChange={(e) => setGalleryUrl(e.target.value)}
                        className="input flex-1 min-w-0"
                      />
                      <button
                        type="submit"
                        disabled={isAddingPhoto}
                        className="btn-primary"
                      >
                        {isAddingPhoto ? 'Adding...' : 'Add to Gallery'}
                      </button>
                    </form>
                  )}

                  {club.gallery && club.gallery.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                      {club.gallery.map((img, i) => (
                        <div key={i} className="rounded-xl overflow-hidden h-32 sm:h-36 border border-slate-200 group relative">
                          <img src={img} alt={`Gallery ${i}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-slate-200 rounded-2xl text-center text-slate-500 text-sm">
                      No gallery photos uploaded yet.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5 min-w-0">
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                  <h3 className="font-bold text-dark-900 mb-4 flex items-center gap-2">
                    <span className="icon-tile w-8 h-8 rounded-lg bg-blue-50 text-blue-600"><Building2 size={16} /></span>
                    Leadership
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">President</p>
                      <p className="font-semibold text-dark-900 break-words">{club.presidentId?.name || 'N/A'}</p>
                      {club.presidentId?.email && (
                        <a href={`mailto:${club.presidentId.email}`} className="text-sm text-blue-600 inline-flex items-center mt-1 font-semibold hover:underline">
                          <Mail size={14} className="mr-1" /> Contact
                        </a>
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Faculty Advisor</p>
                      <p className="font-semibold text-dark-900 break-words">{club.facultyId?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Join/Leave & Membership Fee Record Logic */}
                {user && user.role === 'student' && !isLeadership && (
                  <>
                    {(isMember || userPayment) ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                              <ShieldCheck size={18} />
                            </div>
                            <div className="min-w-0">
                              <span className="text-[11px] font-semibold text-emerald-700 block">
                                Membership Status
                              </span>
                              <h4 className="font-bold text-dark-900 text-sm">Official Active Member</h4>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold px-2.5 py-1 bg-emerald-600 text-white rounded-full shrink-0">
                            Fee Paid
                          </span>
                        </div>

                        {userPayment ? (
                          <div className="bg-white p-3.5 rounded-xl border border-emerald-200 text-xs space-y-2">
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-500">Receipt No:</span>
                              <span className="font-mono font-semibold text-dark-900 break-all text-right">
                                {userPayment.receiptNumber || `RCP-${(userPayment._id || '').slice(-6).toUpperCase()}`}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-500">Amount Paid:</span>
                              <span className="font-bold text-emerald-700 text-sm">
                                ₹{Number(userPayment.amount || club.joinFee || 500).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-500">Payment Mode:</span>
                              <span className="font-semibold text-slate-700 text-right">
                                {userPayment.paymentMethod || 'Razorpay / UPI'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center gap-2">
                              <span className="text-slate-500">Paid Date:</span>
                              <span className="text-slate-600">
                                {new Date(userPayment.createdAt || userPayment.date || Date.now()).toLocaleDateString(undefined, {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white p-3 rounded-xl border border-emerald-100 text-xs text-slate-600">
                            <p className="font-semibold text-slate-800">Membership verified & fee settled.</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">You have full access to club events, matches, and elections.</p>
                          </div>
                        )}

                        <div className="pt-1 flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedReceipt(userPayment || {
                              _id: `MEM-${club._id.slice(-6)}`,
                              receiptNumber: `RCP-${club._id.slice(-6).toUpperCase()}`,
                              amount: club.joinFee || 500,
                              paymentMethod: 'Membership Verified',
                              clubId: club,
                              userId: user,
                              createdAt: new Date()
                            })}
                            className="btn w-full bg-dark-900 hover:bg-dark-800 text-white"
                          >
                            <Receipt size={15} className="text-blue-300" />
                            <span>View & Print Official Receipt</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => leaveClub(club._id)}
                            className="btn w-full text-slate-500 hover:text-red-600 hover:bg-red-50"
                          >
                            Leave Club
                          </button>
                        </div>
                      </div>
                    ) : isPending ? (
                      <button
                        type="button"
                        disabled
                        className="btn w-full py-3 bg-amber-50 text-amber-700 border border-amber-200"
                      >
                        Request Pending...
                      </button>
                    ) : club.isAcceptingMembers ? (
                      <button
                        type="button"
                        onClick={handlePayment}
                        disabled={isProcessingPayment}
                        className="btn-primary w-full py-3.5 flex-col gap-0.5"
                      >
                        {isProcessingPayment ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Loader2 size={18} className="animate-spin" />
                            <span>Processing Payment...</span>
                          </div>
                        ) : (
                          <>
                            <span className="text-sm">
                              {club.joinFee === 0 ? 'Join Club (Free)' : `Pay ₹${club.joinFee || 500} & Join Club`}
                            </span>
                            <span className="text-xs text-blue-100 font-medium flex items-center gap-1">
                              <ShieldCheck size={12} />
                              {club.joinFee === 0 ? 'Instant Admission' : 'Secured by Razorpay'}
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="btn w-full py-3 bg-slate-100 text-slate-500"
                      >
                        Recruitment Closed
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="col-span-full min-w-0">
               <h2 className="section-title mb-4">Pending Requests</h2>
               {club.pendingRequests?.length === 0 ? (
                 <p className="text-slate-500 text-sm bg-slate-50 border border-slate-200 p-6 rounded-2xl text-center">No pending requests at the moment.</p>
               ) : (
                 <div className="space-y-3">
                   {club.pendingRequests?.map(req => (
                     <div key={req._id} className="flex items-center justify-between gap-3 p-3 sm:p-4 border border-slate-200 rounded-2xl bg-white">
                       <div className="flex items-center gap-3 min-w-0">
                         <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold shrink-0">
                           {req.name?.charAt(0)}
                         </div>
                         <div className="min-w-0">
                           <p className="font-semibold text-dark-900 truncate">{req.name}</p>
                           <p className="text-sm text-slate-500 truncate">{req.email}</p>
                         </div>
                       </div>
                       <div className="flex gap-2 shrink-0">
                         <button type="button" onClick={() => approveMember(club._id, req._id, 'reject')} className="w-10 h-10 inline-flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors" aria-label="Reject">
                           <X size={20} />
                         </button>
                         <button type="button" onClick={() => approveMember(club._id, req._id, 'approve')} className="w-10 h-10 inline-flex items-center justify-center text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors" aria-label="Approve">
                           <Check size={20} />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}

               <h2 className="section-title mb-4 mt-10">Current Members</h2>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                 {club.members?.map(member => (
                   <div key={member._id} className="flex items-center gap-3 p-3 sm:p-4 bg-slate-50 border border-slate-100 rounded-2xl min-w-0">
                     <div className="w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-full flex items-center justify-center font-bold shrink-0">
                       {member.name?.charAt(0)}
                     </div>
                     <div className="min-w-0">
                       <p className="font-semibold text-dark-900 truncate">{member.name}</p>
                       <p className="text-xs text-slate-500 truncate">{member.email}</p>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Razorpay Test Simulation Modal (when keys are mock/unconfigured) */}
      {mockOrderData && (
        <div className="modal-overlay">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="modal-panel sm:max-w-md p-5 sm:p-6 relative"
          >
            <div className="flex items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="icon-tile w-10 h-10 bg-blue-50 text-blue-600">
                  <CreditCard size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-dark-900 text-base">Razorpay Test Simulator</h3>
                  <p className="text-xs text-slate-500">Club Fee Payment Sandbox</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMockOrderData(null)}
                className="btn-icon"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 mb-4 space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Club:</span>
                <span className="font-semibold text-dark-900 text-right break-words min-w-0">{club.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Student:</span>
                <span className="font-semibold text-dark-900 text-right break-words min-w-0">{user?.name}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-slate-500">Order Ref:</span>
                <span className="font-mono text-xs text-slate-600 break-all text-right">{mockOrderData.id}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-blue-200/60">
                <span className="font-semibold text-slate-700">Total Dues:</span>
                <span className="font-extrabold text-blue-700 text-base">₹{club.joinFee || 500}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-5 flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <p>
                Real Razorpay keys are not yet added to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-semibold">server/.env</code>. You can simulate this test payment now to verify instant club admission, membership records, and official receipt generation!
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setMockOrderData(null)}
                className="btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessingPayment}
                className="btn-primary flex-1"
              >
                {isProcessingPayment ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={16} />
                )}
                <span>Simulate Success</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Official Payment Receipt Modal */}
      {selectedReceipt && (
        <PaymentReceiptModal
          receipt={selectedReceipt}
          student={user}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </motion.div>
  );
};

export default ClubDetails;
