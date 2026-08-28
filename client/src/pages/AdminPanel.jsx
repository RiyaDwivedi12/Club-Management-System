import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Shield, PlusCircle, LayoutDashboard, Users, Calendar, Trophy, Image as ImageIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState('club');
  const [loading, setLoading] = useState(false);
  
  // Data for dropdowns
  const [users, setUsers] = useState([]);
  const [clubs, setClubs] = useState([]);

  // Form states
  const [clubForm, setClubForm] = useState({ name: '', category: 'Sports', description: '', logo: '', presidentId: '', facultyId: '' });
  const [eventForm, setEventForm] = useState({ title: '', description: '', clubId: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' });
  const [matchForm, setMatchForm] = useState({ teamA: '', teamB: '', refereeId: '', date: '' });

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/dashboard');
      return;
    }

    const fetchData = async () => {
      try {
        const [usersRes, clubsRes] = await Promise.all([
          axios.get('/api/auth/users', { withCredentials: true }),
          axios.get('/api/clubs') // public
        ]);
        setUsers(usersRes.data);
        setClubs(clubsRes.data);
      } catch (err) {
        toast.error('Failed to load necessary data');
      }
    };
    fetchData();
  }, [user, navigate]);

  const handleCreateClub = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/clubs', clubForm, { withCredentials: true });
      toast.success('Club created successfully');
      setClubForm({ name: '', category: 'Sports', description: '', logo: '', presidentId: '', facultyId: '' });
      // Refresh clubs
      const clubsRes = await axios.get('/api/clubs');
      setClubs(clubsRes.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create club');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/events', eventForm, { withCredentials: true });
      toast.success('Event created successfully');
      setEventForm({ title: '', description: '', clubId: '', category: 'Sports', maxParticipants: 0, date: '', poster: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMatch = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/matches', matchForm, { withCredentials: true });
      toast.success('Match created successfully');
      setMatchForm({ teamA: '', teamB: '', refereeId: '', date: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  const tabClass = (tabName) => 
    `flex items-center gap-2 px-6 py-4 font-bold transition-all border-b-2 ${activeTab === tabName ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="mb-8 p-8 rounded-[32px] bg-dark-800 text-white relative overflow-hidden shadow-xl border border-slate-700/50">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2 uppercase tracking-tight">
            <Shield className="text-primary-500" size={32} /> Admin Dashboard
          </h1>
          <p className="text-slate-400 font-medium text-lg">Manage platform entities efficiently.</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary-900/50 to-transparent"></div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm overflow-hidden mb-8 border border-gray-100">
        <div className="flex border-b border-gray-100 overflow-x-auto hide-scrollbar">
          <button onClick={() => setActiveTab('club')} className={tabClass('club')}><Users size={18}/> Create Club</button>
          <button onClick={() => setActiveTab('event')} className={tabClass('event')}><Calendar size={18}/> Create Event</button>
          <button onClick={() => setActiveTab('match')} className={tabClass('match')}><Trophy size={18}/> Create Match</button>
        </div>

        <div className="p-8">
          {activeTab === 'club' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleCreateClub} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Club Name</label>
                <input required type="text" value={clubForm.name} onChange={(e) => setClubForm({...clubForm, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select required value={clubForm.category} onChange={(e) => setClubForm({...clubForm, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                  <option value="Sports">Sports</option>
                  <option value="Literary">Literary</option>
                  <option value="Cultural">Cultural</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea required value={clubForm.description} onChange={(e) => setClubForm({...clubForm, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" rows="4"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Logo URL (Optional)</label>
                <input type="text" value={clubForm.logo} onChange={(e) => setClubForm({...clubForm, logo: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">President</label>
                  <select required value={clubForm.presidentId} onChange={(e) => setClubForm({...clubForm, presidentId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                    <option value="">Select User</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Faculty Advisor</label>
                  <select required value={clubForm.facultyId} onChange={(e) => setClubForm({...clubForm, facultyId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                    <option value="">Select User</option>
                    {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                  </select>
                </div>
              </div>
              <button disabled={loading} type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all hover:shadow-soft-purple hover:-translate-y-1">
                {loading ? 'Creating...' : <><PlusCircle size={20} /> Create Club</>}
              </button>
            </motion.form>
          )}

          {activeTab === 'event' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleCreateEvent} className="space-y-6 max-w-2xl">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Event Title</label>
                <input required type="text" value={eventForm.title} onChange={(e) => setEventForm({...eventForm, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Associated Club</label>
                <select required value={eventForm.clubId} onChange={(e) => setEventForm({...eventForm, clubId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                  <option value="">Select Club</option>
                  {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Category</label>
                <select required value={eventForm.category} onChange={(e) => setEventForm({...eventForm, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                  <option value="Sports">Sports</option>
                  <option value="Literary">Literary</option>
                  <option value="Cultural">Cultural</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Description</label>
                <textarea required value={eventForm.description} onChange={(e) => setEventForm({...eventForm, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" rows="4"></textarea>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Date & Time</label>
                  <input required type="datetime-local" value={eventForm.date} onChange={(e) => setEventForm({...eventForm, date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Max Participants (0 for unlimited)</label>
                  <input required type="number" min="0" value={eventForm.maxParticipants} onChange={(e) => setEventForm({...eventForm, maxParticipants: parseInt(e.target.value)})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Poster URL (Optional)</label>
                <input type="text" value={eventForm.poster} onChange={(e) => setEventForm({...eventForm, poster: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <button disabled={loading} type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all hover:shadow-soft-purple hover:-translate-y-1">
                {loading ? 'Creating...' : <><PlusCircle size={20} /> Create Event</>}
              </button>
            </motion.form>
          )}

          {activeTab === 'match' && (
            <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleCreateMatch} className="space-y-6 max-w-2xl">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Team A</label>
                  <input required type="text" value={matchForm.teamA} onChange={(e) => setMatchForm({...matchForm, teamA: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Team B</label>
                  <input required type="text" value={matchForm.teamB} onChange={(e) => setMatchForm({...matchForm, teamB: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Referee</label>
                <select required value={matchForm.refereeId} onChange={(e) => setMatchForm({...matchForm, refereeId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all">
                  <option value="">Select Referee</option>
                  {users.filter(u => u.role === 'referee' || u.role === 'admin').map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Date & Time</label>
                <input required type="datetime-local" value={matchForm.date} onChange={(e) => setMatchForm({...matchForm, date: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
              </div>
              <button disabled={loading} type="submit" className="flex items-center gap-2 bg-primary-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-primary-700 transition-all hover:shadow-soft-purple hover:-translate-y-1">
                {loading ? 'Creating...' : <><PlusCircle size={20} /> Create Match</>}
              </button>
            </motion.form>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
