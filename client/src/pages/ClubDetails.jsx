import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Users, Mail, Image as ImageIcon, Check, X } from 'lucide-react';
import useClubStore from '../store/clubStore';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const ClubDetails = () => {
  const { id } = useParams();
  const { currentClub: club, fetchClubById, requestJoinClub, leaveClub, approveMember, isLoading, error } = useClubStore();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('about');
  const [galleryUrl, setGalleryUrl] = useState('');
  const [isAddingPhoto, setIsAddingPhoto] = useState(false);

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
    try {
      const { data: order } = await axios.post('/api/payments/order', { clubId: club?._id }, { withCredentials: true });
      
      const options = {
        key: 'rzp_test_mock123',
        amount: order.amount, 
        currency: order.currency,
        name: 'Club Management System',
        description: `Annual fee for ${club?.name}`,
        order_id: order.id, 
        handler: async function (response) {
          try {
            const verifyRes = await axios.post('/api/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: club.joinFee || 500,
              clubId: club?._id
            }, { withCredentials: true });
            
            if (verifyRes.data.success) {
               toast.success('Payment successful! Request sent.');
               fetchClubById(id);
            }
          } catch (err) {
            toast.error('Payment verification failed.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: '#7c3aed' },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (response){
         toast.error(response.error.description);
      });
      rzp.open();
    } catch (error) {
      toast.error('Could not initiate payment.');
    }
  };

  useEffect(() => {
    fetchClubById(id);
  }, [fetchClubById, id]);

  if (isLoading || !club) {
    return (
      <div className="flex justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return <div className="p-8 text-center text-red-500 font-bold">{error}</div>;
  }

  const isMember = club.members?.some(m => m._id === user?._id) || false;
  const isPending = club.pendingRequests?.some(m => m._id === user?._id) || false;
  const isLeadership = club.presidentId?._id === user?._id || club.facultyId?._id === user?._id || user?.role === 'admin';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-4 md:p-8 max-w-5xl mx-auto"
    >
      <Link to="/clubs" className="inline-flex items-center text-primary-600 hover:text-primary-800 font-bold mb-6">
        <ArrowLeft size={16} className="mr-2" /> Back to Clubs
      </Link>
      
      <div className="soft-card overflow-hidden mb-8">
        <div className="h-64 md:h-80 w-full relative">
          <img src={club.logo || 'https://via.placeholder.com/1000x400?text=Club+Logo'} alt={club.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 p-8 w-full flex justify-between items-end">
            <div>
              <h1 className="text-4xl md:text-5xl font-black text-white mb-2">{club.name}</h1>
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
              className={`pb-4 font-bold ${activeTab === 'about' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Overview
            </button>
            <button 
              onClick={() => setActiveTab('members')}
              className={`pb-4 font-bold flex items-center gap-2 ${activeTab === 'members' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              Manage Members
              {club.pendingRequests?.length > 0 && (
                <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{club.pendingRequests.length}</span>
              )}
            </button>
          </div>
        )}

        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
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
                      <ImageIcon size={24} className="mr-2 text-primary-500" /> Club Gallery ({club.gallery?.length || 0})
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
                        className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl font-medium text-sm text-gray-800 outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        type="submit"
                        disabled={isAddingPhoto}
                        className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-all whitespace-nowrap disabled:opacity-50"
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
                
                {/* Join/Leave Button Logic */}
                {user && user.role === 'student' && !isLeadership && (
                  <>
                    {isMember ? (
                      <button 
                        onClick={() => leaveClub(club._id)}
                        className="w-full py-3 bg-red-50 text-red-600 border border-red-200 rounded-xl font-bold hover:bg-red-100 transition-all"
                      >
                        Leave Club
                      </button>
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
                        className="w-full py-3 bg-primary-600 text-white rounded-xl font-bold shadow-soft-purple hover:-translate-y-1 transition-all flex flex-col items-center justify-center"
                      >
                        <span>Pay ₹{club.joinFee || 500} & Request to Join</span>
                        <span className="text-xs text-primary-200 mt-0.5 font-medium">Secured by Razorpay</span>
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
    </motion.div>
  );
};

export default ClubDetails;
