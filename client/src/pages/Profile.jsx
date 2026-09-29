import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { User, Mail, Shield, Book, Award, Activity, Loader2 } from 'lucide-react';

const Profile = () => {
  const { user } = useAuthStore();
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (user?.role === 'admin' || user?.role === 'president' || user?.role === 'faculty') {
        setLoading(false);
        return;
      }
      
      try {
        const memRes = await axios.get('/api/student/memberships', { withCredentials: true });
        setMemberships(memRes.data || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch memberships');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (loading) {
     return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" size={48} /></div>;
  }

  return (
    <div className="w-full max-w-4xl mx-auto pb-10">
      <div className="mb-8 p-8 rounded-[32px] bg-gradient-to-r from-primary-600 to-primary-400 text-white relative overflow-hidden shadow-soft">
        <div className="relative z-10 flex items-center gap-6">
          <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center border-4 border-white backdrop-blur-sm">
            <User size={48} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black mb-1">{user?.name}</h1>
            <p className="text-primary-100 font-medium flex items-center gap-2">
              <Mail size={16} /> {user?.email}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white/20 rounded-full text-sm font-bold backdrop-blur-sm">
              <Shield size={16} />
              <span className="capitalize">{user?.role}</span>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-white opacity-10 rounded-l-full blur-3xl transform translate-x-1/4"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 md:col-span-2 space-y-6">
          <div className="soft-card p-6">
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <Book size={24} className="text-primary-500" /> My Clubs
            </h2>
            {error && <div className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 font-bold text-sm">{error}</div>}
            
            {(user?.role === 'student' || !user?.role) ? (
              memberships.length > 0 ? (
                <div className="space-y-4">
                  {memberships.map((mem) => (
                    <div key={mem._id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-primary-600 font-black">
                        {mem.clubId?.logo ? (
                          <img src={mem.clubId.logo} alt={mem.clubId.name} className="w-full h-full object-cover" />
                        ) : (
                          mem.clubId?.name?.charAt(0)
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 text-lg">{mem.clubId?.name}</h4>
                        <p className="text-sm text-gray-500">Joined on {new Date(mem.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-black ${mem.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {mem.status}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 opacity-50">
                  <Activity size={48} className="mx-auto text-gray-400 mb-3" />
                  <p className="text-gray-500 font-bold">You haven't joined any clubs yet.</p>
                </div>
              )
            ) : (
              <div className="text-center py-8 opacity-50">
                <Shield size={48} className="mx-auto text-gray-400 mb-3" />
                <p className="text-gray-500 font-bold">Admins and staff do not have student memberships.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="col-span-1 space-y-6">
          <div className="soft-card p-6">
            <h2 className="text-xl font-black text-gray-900 mb-4 flex items-center gap-2">
              <Award size={24} className="text-primary-500" /> Achievements
            </h2>
            <div className="text-center py-8 opacity-50 bg-gray-50 rounded-2xl">
              <Award size={32} className="mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500 font-bold text-sm">No achievements yet.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
