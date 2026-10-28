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
        theme: { color: '#0d9488' },
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
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  }

  const isMember = club.members?.some(m => (m._id || m) === user?._id) || (user?.clubMemberships && user.clubMemberships.includes(club._id)) || false;
  const isPending = club.pendingRequests?.some(m => (m._id || m) === user?._id) || false;
  const isLeadership = club.presidentId?._id === user?._id || club.facultyId?._id === user?._id || user?.role === 'admin';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-5xl mx-auto"
    >
      <Link to="/clubs" className="inline-flex items-center text-teal-600 hover:text-teal-800 font-bold mb-6">
        <ArrowLeft size={16} className="mr-2" /> Back to Clubs
      </Link>
      
      <div className="soft-card overflow-hidden mb-8">
        <div className="h-64 md:h-80 w-full relative">
          <img src={club.logo || 'https://via.placeholder.com/1000x400?text=Club+Logo'} alt={club.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-5 md:p-8 w-full flex justify-between items-end">
            <div>
              <h1 className="text-3xl md:text-5xl font-black text-white mb-2">{club.name}</h1>
              <div className="flex flex-wrap gap-4 text-white/80 font-medium">
                <span className="flex items-center"><Users size={18} className="mr-2" /> {club.members?.length || 0} Members</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tabs for Leadership */}
        {isLeadership && (
          <div className="border-b border-gray-100 flex gap-6 px-8 pt-4">
            <button 
              onClick={() => setActiveTab('about')}
              className={`pb-4 font-bold ${activeTab === 'about' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`pb-4 font-bold flex items-center gap-2 ${activeTab === 'members' ? 'text-teal-600 border-b-2 border-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Manage Members
              {club.pendingRequests?.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{club.pendingRequests.length}</span>
              )}
            </button>
          </div>
        )}

        <div className="p-5 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          {activeTab === 'about' ? (
            <>
              <div className="md:col-span-2 space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-gray-900 mb-3">About Us</h2>
                  <p className="text-gray-600 leading-relaxed font-medium">{club.description}</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-black text-gray-900 flex items-center">
                      <ImageIcon size={24} className="mr-2 text-teal-600" /> Club Gallery ({club.gallery?.length || 0})
                    </h2>
                  </div>

                  {isLeadership && (
                    <form onSubmit={handleAddPhoto} className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row gap-3">
                      <input
                        type="url"
                        required
                        placeholder="Paste image URL (e.g. https://...)..."
                        value={galleryUrl}
                        onChange={(e) => setGalleryUrl(e.target.value)}
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-sm text-gray-800 outline-none focus:ring-2 focus:ring-teal-500"
                      />
                      <button
                        type="submit"
                        disabled={isAddingPhoto}
                        className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-all whitespace-nowrap disabled:opacity-50 cursor-pointer"
                      >
                        {isAddingPhoto ? 'Adding...' : 'Add to Gallery'}
                      </button>
                    </form>
                  )}

                  {club.gallery && club.gallery.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {club.gallery.map((img, i) => (
                        <div key={i} className="rounded-2xl overflow-hidden h-36 border border-gray-100 shadow-sm group relative">
                          <img src={img} alt={`Gallery ${i}`} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border border-dashed border-gray-200 rounded-2xl text-center text-gray-400 font-medium text-sm">
                      No gallery photos uploaded yet.
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-primary-50 rounded-2xl p-6 border border-primary-100">
                  <h3 className="font-black text-gray-900 mb-4">Leadership</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-primary-600 uppercase font-black tracking-wider mb-1">President</p>
                      <p className="font-bold text-gray-900">{club.presidentId?.name || 'N/A'}</p>
                      {club.presidentId?.email && (
                        <a href={`mailto:${club.presidentId.email}`} className="text-sm text-primary-600 flex items-center mt-1 font-bold hover:underline">
                          <Mail size={14} className="mr-1" /> Contact
                        </a>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-primary-200/50">
                      <p className="text-xs text-primary-600 uppercase font-black tracking-wider mb-1">Faculty Advisor</p>
                      <p className="font-bold text-gray-900">{club.facultyId?.name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                {/* Join/Leave & Membership Fee Record Logic */}
                {user && user.role === 'student' && !isLeadership && (
                  <>
                    {(isMember || userPayment) ? (
                      <div className="bg-emerald-50 border border-emerald-200/90 rounded-2xl p-5 shadow-sm space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                              <ShieldCheck size={18} />
                            </div>
                            <div>
                              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                                Membership Status
                              </span>
                              <h4 className="font-black text-slate-900 text-sm">Official Active Member</h4>
                            </div>
                          </div>
                          <span className="text-xs font-black px-2.5 py-1 bg-emerald-600 text-white rounded-full">
                            Fee Paid
                          </span>
                        </div>

                        {userPayment ? (
                          <div className="bg-white/95 p-3.5 rounded-xl border border-emerald-200 text-xs space-y-2 shadow-xs">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium">Receipt No:</span>
                              <span className="font-mono font-bold text-slate-900">
                                {userPayment.receiptNumber || `RCP-${(userPayment._id || '').slice(-6).toUpperCase()}`}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium">Amount Paid:</span>
                              <span className="font-black text-emerald-700 text-sm">
                                ₹{Number(userPayment.amount || club.joinFee || 500).toLocaleString('en-IN')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium">Payment Mode:</span>
                              <span className="font-semibold text-slate-700">
                                {userPayment.paymentMethod || 'Razorpay / UPI'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-500 font-medium">Paid Date:</span>
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
                          <div className="bg-white/90 p-3 rounded-xl border border-emerald-100 text-xs text-slate-600">
                            <p className="font-semibold text-slate-800">Membership verified & fee settled.</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">You have full access to club events, matches, and elections.</p>
                          </div>
                        )}

                        <div className="pt-1 flex flex-col gap-2">
                          <button
                            onClick={() => setSelectedReceipt(userPayment || {
                              _id: `MEM-${club._id.slice(-6)}`,
                              receiptNumber: `RCP-${club._id.slice(-6).toUpperCase()}`,
                              amount: club.joinFee || 500,
                              paymentMethod: 'Membership Verified',
                              clubId: club,
                              userId: user,
                              createdAt: new Date()
                            })}
                            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow"
                          >
                            <Receipt size={14} className="text-teal-400" />
                            <span>View & Print Official Receipt</span>
                          </button>

                          <button 
                            onClick={() => leaveClub(club._id)}
                            className="w-full py-2 text-slate-500 hover:text-red-600 rounded-xl font-bold text-xs hover:bg-red-50/50 transition-all cursor-pointer text-center"
                          >
                            Leave Club
                          </button>
                        </div>
                      </div>
                    ) : isPending ? (
                      <button 
                        disabled
                        className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl font-bold cursor-not-allowed"
                      >
                        Request Pending...
                      </button>
                    ) : club.isAcceptingMembers ? (
                      <button 
                        onClick={handlePayment}
                        disabled={isProcessingPayment}
                        className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm hover:-translate-y-0.5 transition-all flex flex-col items-center justify-center cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
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
                            <span className="text-xs text-teal-100 mt-0.5 font-medium flex items-center gap-1">
                              <ShieldCheck size={12} />
                              {club.joinFee === 0 ? 'Instant Admission' : 'Secured by Razorpay'}
                            </span>
                          </>
                        )}
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="w-full py-3 bg-gray-100 text-gray-400 rounded-xl font-bold cursor-not-allowed flex items-center justify-center"
                      >
                        Recruitment Closed
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="col-span-full">
               <h2 className="text-2xl font-black text-gray-900 mb-6">Pending Requests</h2>
               {club.pendingRequests?.length === 0 ? (
                 <p className="text-gray-500 font-medium bg-gray-50 p-6 rounded-2xl text-center">No pending requests at the moment.</p>
               ) : (
                 <div className="space-y-4">
                   {club.pendingRequests?.map(req => (
                     <div key={req._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-2xl bg-white shadow-sm">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center font-bold">
                           {req.name?.charAt(0)}
                         </div>
                         <div>
                           <p className="font-bold text-gray-900">{req.name}</p>
                           <p className="text-sm text-gray-500">{req.email}</p>
                         </div>
                       </div>
                       <div className="flex gap-2">
                         <button onClick={() => approveMember(club._id, req._id, 'reject')} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                           <X size={20} />
                         </button>
                         <button onClick={() => approveMember(club._id, req._id, 'approve')} className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-colors">
                           <Check size={20} />
                         </button>
                       </div>
                     </div>
                   ))}
                 </div>
               )}

               <h2 className="text-2xl font-black text-gray-900 mb-6 mt-12">Current Members</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {club.members?.map(member => (
                   <div key={member._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                     <div className="w-10 h-10 bg-gray-200 text-gray-600 rounded-full flex items-center justify-center font-bold">
                       {member.name?.charAt(0)}
                     </div>
                     <div>
                       <p className="font-bold text-gray-900">{member.name}</p>
                       <p className="text-xs text-gray-500 truncate w-32">{member.email}</p>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 relative"
          >
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-base">Razorpay Test Simulator</h3>
                  <p className="text-xs text-gray-500 font-medium">Club Fee Payment Sandbox</p>
                </div>
              </div>
              <button
                onClick={() => setMockOrderData(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-100 mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Club:</span>
                <span className="font-bold text-gray-900">{club.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Student:</span>
                <span className="font-bold text-gray-900">{user?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Order Ref:</span>
                <span className="font-mono text-xs text-gray-600">{mockOrderData.id}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-teal-200/50">
                <span className="font-bold text-gray-700">Total Dues:</span>
                <span className="font-black text-teal-700 text-base">₹{club.joinFee || 500}</span>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 mb-5 flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-600" />
              <p>
                Real Razorpay keys are not yet added to <code className="bg-amber-100 px-1 py-0.5 rounded font-mono font-bold">server/.env</code>. You can simulate this test payment now to verify instant club admission, membership records, and official receipt generation!
              </p>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setMockOrderData(null)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSimulatePayment}
                disabled={isProcessingPayment}
                className="flex-1 py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
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
