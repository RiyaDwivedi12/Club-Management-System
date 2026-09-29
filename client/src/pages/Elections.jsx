import { useState, useEffect } from 'react';
import useElectionStore from '../store/electionStore';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Vote, Users, Plus, CheckCircle2, Filter, X } from 'lucide-react';
import { format } from 'date-fns';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const Elections = () => {
  const { elections, fetchElections, vote, updateVoteCount, isLoading, error } = useElectionStore();
  const { user } = useAuthStore();
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterClub, setFilterClub] = useState('');

  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    clubId: '',
    startDate: '',
    endDate: '',
  });
  const [candidates, setCandidates] = useState([]);
  const [currentCandidateId, setCurrentCandidateId] = useState('');
  const [currentManifesto, setCurrentManifesto] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchElections();
    axios.get('/api/clubs').then(res => setClubs(res.data)).catch(console.error);
    if (user && ['admin', 'faculty', 'president'].includes(user.role)) {
      axios.get('/api/auth/users', { withCredentials: true }).then(res => setUsers(res.data)).catch(console.error);
    }
  }, [fetchElections, user]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    socket.on('voteUpdate', (data) => {
      updateVoteCount(data.electionId, data.candidateId, data.newVotes);
    });
    return () => socket.disconnect();
  }, [updateVoteCount]);

  const handleAddCandidateToForm = () => {
    if (!currentCandidateId || !currentManifesto) {
      toast.error("Please select a candidate and write a manifesto.");
      return;
    }
    const selectedUser = users.find(u => u._id === currentCandidateId);
    if (candidates.some(c => c.candidateId === currentCandidateId)) {
      toast.error("Candidate already added!");
      return;
    }
    setCandidates([...candidates, { candidateId: currentCandidateId, name: selectedUser.name, manifesto: currentManifesto }]);
    setCurrentCandidateId('');
    setCurrentManifesto('');
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (candidates.length < 2) {
      toast.error("Please add at least 2 candidates.");
      return;
    }
    setIsCreating(true);
    try {
      const res = await axios.post('/api/elections', formData, { withCredentials: true });
      const electionId = res.data._id;
      
      for (const cand of candidates) {
        await axios.post(`/api/elections/${electionId}/candidates`, {
          candidateId: cand.candidateId,
          manifesto: cand.manifesto
        }, { withCredentials: true });
      }
      
      toast.success("Election created successfully!");
      setShowCreateModal(false);
      setFormData({ title: '', clubId: '', startDate: '', endDate: '' });
      setCandidates([]);
      fetchElections();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create election.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleVote = async (electionId, candidateId) => {
    if (window.confirm("Are you sure? You cannot change your vote later.")) {
        await vote(electionId, candidateId);
    }
  };

  const canCreateElection = user && ['admin', 'faculty', 'president'].includes(user.role);

  const filteredElections = filterClub 
    ? elections.filter(e => e.clubId?._id === filterClub)
    : elections;

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Club Elections</h1>
          <p className="text-gray-500 font-medium">Vote for your club representatives and leaders.</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white rounded-2xl px-4 py-2 shadow-sm border border-gray-100">
            <Filter size={18} className="text-gray-400 mr-2" />
            <select 
              className="bg-transparent outline-none font-bold text-gray-700 text-sm"
              value={filterClub}
              onChange={(e) => setFilterClub(e.target.value)}
            >
              <option value="">All Clubs</option>
              {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>

          {canCreateElection && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-bold shadow-soft-purple transition-transform hover:-translate-y-1"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Start Election</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredElections.length > 0 ? (
            filteredElections.map((election, index) => {
                const now = new Date();
                const startDate = new Date(election.startDate);
                const endDate = new Date(election.endDate);
                const isLive = now >= startDate && now <= endDate;
                const isCompleted = now > endDate;
                const hasVoted = user && election.votedUsers.includes(user._id);
                const canSeeResults = isCompleted || (user && ['admin', 'faculty'].includes(user.role));

                const chartData = {
                  labels: election.candidates.map(c => c.candidateId?.name),
                  datasets: [
                    {
                      label: 'Votes',
                      data: election.candidates.map(c => c.votes),
                      backgroundColor: 'rgba(79, 70, 229, 0.6)',
                      borderColor: 'rgba(79, 70, 229, 1)',
                      borderWidth: 1,
                    }
                  ]
                };

                const chartOptions = {
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
                };

                return (
                    <motion.div
                        key={election._id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="soft-card p-6 border-l-4 border-primary-500"
                    >
                        <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-black text-gray-900">{election.title}</h2>
                                    <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
                                        isLive ? 'bg-green-100 text-green-600 animate-pulse' :
                                        isCompleted ? 'bg-gray-100 text-gray-600' : 'bg-blue-100 text-blue-600'
                                    }`}>
                                        {isLive ? 'Live' : isCompleted ? 'Completed' : 'Upcoming'}
                                    </span>
                                </div>
                                <p className="text-gray-500 font-medium flex items-center">
                                    <Users size={16} className="mr-2" /> {election.clubId?.name}
                                </p>
                            </div>
                            <div className="bg-gray-50 px-4 py-2 rounded-xl text-sm font-bold text-gray-600 border border-gray-100">
                                <div>Ends: {format(endDate, 'PPP')}</div>
                                <div className="text-primary-600 mt-1">Total Votes: {election.votedUsers.length}</div>
                            </div>
                        </div>

                        {hasVoted && (
                            <div className="mb-6 p-3 bg-green-50 text-green-700 border border-green-200 rounded-xl font-bold flex items-center">
                                <CheckCircle2 size={18} className="mr-2" /> You have successfully voted in this election.
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <h3 className="font-black text-lg mb-4 text-gray-800">Candidates</h3>
                              {election.candidates.map(candidate => (
                                  <div key={candidate._id} className="border border-gray-100 rounded-2xl p-4 flex flex-col hover:border-primary-200 transition-colors bg-white">
                                      <div className="flex items-center gap-4 mb-4">
                                          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-black text-xl">
                                              {candidate.candidateId?.name?.charAt(0) || 'C'}
                                          </div>
                                          <div>
                                              <h3 className="font-bold text-gray-900">{candidate.candidateId?.name}</h3>
                                              <p className="text-xs font-medium text-gray-500">Candidate</p>
                                          </div>
                                          {canSeeResults && (
                                              <div className="ml-auto text-right">
                                                  <div className="text-2xl font-black text-primary-600">{candidate.votes}</div>
                                                  <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Votes</div>
                                              </div>
                                          )}
                                      </div>
                                      <p className="text-gray-600 text-sm mb-4 flex-1 bg-gray-50 p-3 rounded-xl italic">
                                          "{candidate.manifesto}"
                                      </p>
                                      
                                      {isLive && !hasVoted && user?.role === 'student' && (
                                          <button 
                                              onClick={() => handleVote(election._id, candidate.candidateId._id)}
                                              className="w-full py-2.5 bg-gray-900 text-white rounded-xl font-bold flex items-center justify-center hover:bg-primary-600 transition-colors group"
                                          >
                                              <Vote size={18} className="mr-2 group-hover:scale-110 transition-transform" /> Vote for {candidate.candidateId?.name.split(' ')[0]}
                                          </button>
                                      )}
                                  </div>
                              ))}
                              {election.candidates.length === 0 && (
                                  <div className="py-8 text-center text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
                                      No candidates have been added yet.
                                  </div>
                              )}
                          </div>
                          
                          {/* Results Audit View */}
                          {canSeeResults && election.candidates.length > 0 && (
                            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100">
                                <h3 className="font-black text-lg mb-4 text-gray-800">Results / Audit</h3>
                                <div className="bg-white p-4 rounded-xl border border-gray-100">
                                  <Bar data={chartData} options={chartOptions} />
                                </div>
                            </div>
                          )}
                        </div>
                    </motion.div>
                );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 font-medium bg-white rounded-3xl shadow-sm border border-gray-100">
              No active elections for this filter.
            </div>
          )}
        </div>
      )}
      
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
             <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black">Start New Election</h2>
                <button onClick={() => setShowCreateModal(false)} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><X size={20}/></button>
             </div>
             
             <form onSubmit={handleCreateSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Election Title</label>
                    <input required type="text" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" placeholder="e.g. Presidential Election 2026" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Club</label>
                    <select required value={formData.clubId} onChange={(e) => setFormData({...formData, clubId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none">
                      <option value="">Select Club</option>
                      {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Start Date</label>
                    <input required type="datetime-local" value={formData.startDate} onChange={(e) => setFormData({...formData, startDate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">End Date</label>
                    <input required type="datetime-local" value={formData.endDate} onChange={(e) => setFormData({...formData, endDate: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none" />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                  <h3 className="text-lg font-black mb-4">Add Candidates</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <select value={currentCandidateId} onChange={(e) => setCurrentCandidateId(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none">
                      <option value="">Select Student</option>
                      {users.filter(u => u.role === 'student').map(u => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
                    </select>
                    <input type="text" value={currentManifesto} onChange={(e) => setCurrentManifesto(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" placeholder="Candidate Manifesto" />
                  </div>
                  <button type="button" onClick={handleAddCandidateToForm} className="px-4 py-2 bg-gray-900 text-white font-bold rounded-xl text-sm mb-4">Add to List</button>
                  
                  {candidates.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {candidates.map((cand, idx) => (
                        <div key={idx} className="p-3 bg-primary-50 border border-primary-100 rounded-lg flex justify-between items-center">
                           <div>
                             <span className="font-bold text-primary-900">{cand.name}</span>
                             <p className="text-xs text-primary-700 italic">{cand.manifesto}</p>
                           </div>
                           <button type="button" onClick={() => setCandidates(candidates.filter(c => c.candidateId !== cand.candidateId))} className="text-red-500 p-1 hover:bg-red-100 rounded"><X size={16}/></button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button disabled={isCreating} type="submit" className="w-full py-4 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-colors">
                  {isCreating ? 'Creating Election...' : 'Launch Election'}
                </button>
             </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Elections;
