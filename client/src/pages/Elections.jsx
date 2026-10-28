import { useState, useEffect, useMemo, useRef } from 'react';
import useElectionStore from '../store/electionStore';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Vote, Users, Plus, CheckCircle2, Filter, X, Trophy, Clock, Timer, 
  Sparkles, Shield, Crown, Award, ChevronRight, Trash2, Check, UserCheck, Flame,
  Lock, ArrowUpRight
} from 'lucide-react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import toast from 'react-hot-toast';

// Helper component for live countdown timer
const ElectionCountdown = ({ startDate, endDate, isCompleted, isLive }) => {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      if (now < start) {
        const diff = start - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`Starts in ${hours}h ${mins}m ${secs}s`);
      } else if (now <= end && !isCompleted) {
        const diff = end - now;
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')} remaining`);
      } else {
        setTimeLeft('Voting Concluded');
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [startDate, endDate, isCompleted]);

  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black tracking-wide ${
      isLive ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
      isCompleted ? 'bg-slate-100 text-slate-600 border border-slate-200' : 'bg-blue-50 text-blue-700 border border-blue-200'
    }`}>
      <Clock size={13} className={isLive ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
      <span>{timeLeft}</span>
    </div>
  );
};

const Elections = () => {
  const { 
    elections, 
    fetchElections, 
    vote, 
    concludeElection, 
    nominateCandidate, 
    deleteElection, 
    updateVoteCount, 
    isLoading, 
    error 
  } = useElectionStore();
  const { user, setCredentials } = useAuthStore();
  const hasRefreshedUserRef = useRef(false);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showNominateModal, setShowNominateModal] = useState(null); // election object
  const [clubs, setClubs] = useState([]);
  const [users, setUsers] = useState([]);
  const [filterClub, setFilterClub] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  // Create Form State
  const [formData, setFormData] = useState({
    title: '',
    clubId: '',
    position: 'President',
    banner: '',
    startDate: '',
    endDate: '',
  });

  // Candidate Setup inside Create Form (Profile 1 and Profile 2)
  const [candidate1, setCandidate1] = useState({
    candidateId: '',
    name: '',
    photo: '',
    manifesto: ''
  });
  const [candidate2, setCandidate2] = useState({
    candidateId: '',
    name: '',
    photo: '',
    manifesto: ''
  });

  // Nomination form state
  const [nominationManifesto, setNominationManifesto] = useState('');
  const [nominationPhoto, setNominationPhoto] = useState('');
  const [isSubmittingNomination, setIsSubmittingNomination] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [votingElectionId, setVotingElectionId] = useState(null);

  useEffect(() => {
    fetchElections();
    axios.get('/api/clubs').then(res => setClubs(res.data || [])).catch(console.error);
    if (user && ['admin', 'faculty', 'president'].includes(user.role)) {
      axios.get('/api/auth/users', { withCredentials: true }).then(res => setUsers(res.data || [])).catch(console.error);
    }
    if (user?._id && !hasRefreshedUserRef.current) {
      hasRefreshedUserRef.current = true;
      axios.get('/api/auth/profile', { withCredentials: true })
        .then(res => {
          if (res.data) setCredentials({ ...user, ...res.data });
        })
        .catch(() => {});
    }
  }, [fetchElections, user?._id]);

  useEffect(() => {
    const socket = io(import.meta.env.VITE_API_URL || (import.meta.env.PROD ? 'https://club-management-system-1-t4a7.onrender.com' : 'http://localhost:5000'));
    socket.on('voteUpdate', (data) => {
      updateVoteCount(data.electionId, data.candidateId, data.newVotes);
    });
    socket.on('election_concluded', () => {
      fetchElections();
    });
    socket.on('new_election_created', () => {
      fetchElections();
    });
    return () => socket.disconnect();
  }, [updateVoteCount, fetchElections]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!candidate1.candidateId || !candidate2.candidateId) {
      toast.error('Please assign both Candidate 1 and Candidate 2 for the matchup election.');
      return;
    }
    if (candidate1.candidateId === candidate2.candidateId) {
      toast.error('Candidate 1 and Candidate 2 must be different students!');
      return;
    }

    setIsCreating(true);
    try {
      const payload = {
        ...formData,
        candidates: [candidate1, candidate2]
      };

      const res = await axios.post('/api/elections', payload, { withCredentials: true });
      if (res.data) {
        toast.success(`Matchup election "${res.data.title}" launched successfully!`);
        setShowCreateModal(false);
        setFormData({
          title: '',
          clubId: '',
          position: 'President',
          banner: '',
          startDate: '',
          endDate: '',
        });
        setCandidate1({ candidateId: '', name: '', photo: '', manifesto: '' });
        setCandidate2({ candidateId: '', name: '', photo: '', manifesto: '' });
        fetchElections();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to launch election');
    } finally {
      setIsCreating(false);
    }
  };

  const handleVote = async (electionId, candidateId, candidateName) => {
    if (window.confirm(`Cast your official vote for ${candidateName || 'this candidate'}? You can only vote once.`)) {
      setVotingElectionId(electionId);
      await vote(electionId, candidateId);
      setVotingElectionId(null);
    }
  };

  const handleConclude = async (electionId, electionTitle) => {
    if (window.confirm(`Are you sure you want to officially conclude "${electionTitle}"? The highest voted candidate will instantly be elevated to leadership!`)) {
      await concludeElection(electionId);
    }
  };

  const handleDelete = async (electionId) => {
    if (window.confirm('Delete this election and all cast ballots? This cannot be undone.')) {
      await deleteElection(electionId);
    }
  };

  const handleNominateSubmit = async (e) => {
    e.preventDefault();
    if (!nominationManifesto.trim()) {
      return toast.error('Please enter your candidate manifesto/agenda.');
    }

    if (showNominateModal) {
      const modalClubId = (showNominateModal.clubId?._id || showNominateModal.clubId)?.toString();
      const isMember = Boolean(
        user && (
          user.role === 'admin' ||
          (Array.isArray(showNominateModal.clubId?.members) && showNominateModal.clubId.members.some(m => (m?._id || m)?.toString() === user._id?.toString())) ||
          (Array.isArray(user.clubMemberships) && user.clubMemberships.some(c => (c?._id || c)?.toString() === modalClubId))
        )
      );
      if (!isMember) {
        return toast.error(`You must be an official registered member of ${showNominateModal.clubId?.name || 'this club'} to stand for election.`);
      }
    }

    setIsSubmittingNomination(true);
    try {
      await nominateCandidate(showNominateModal._id, {
        manifesto: nominationManifesto,
        photo: nominationPhoto
      });
      setShowNominateModal(null);
      setNominationManifesto('');
      setNominationPhoto('');
      fetchElections();
    } finally {
      setIsSubmittingNomination(false);
    }
  };

  const canCreateElection = user && ['admin', 'faculty', 'president'].includes(user.role);
  const isAdmin = user && user.role === 'admin';

  // Filter logic
  const filteredElections = useMemo(() => {
    return elections.filter(el => {
      const matchesClub = filterClub ? el.clubId?._id === filterClub : true;
      const now = new Date();
      const isLive = now >= new Date(el.startDate) && now <= new Date(el.endDate) && !el.isConcluded;
      const isCompleted = el.isConcluded || now > new Date(el.endDate);
      const isUpcoming = now < new Date(el.startDate);

      if (filterStatus === 'live') return matchesClub && isLive;
      if (filterStatus === 'completed') return matchesClub && isCompleted;
      if (filterStatus === 'upcoming') return matchesClub && isUpcoming;
      return matchesClub;
    });
  }, [elections, filterClub, filterStatus]);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Top Hero Banner */}
      <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-8 md:p-10 text-white shadow-2xl border border-indigo-500/20">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-black uppercase tracking-wider mb-3">
              <Vote size={14} className="text-indigo-400" />
              <span>Campus Democratic Elections</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white mb-2">
              Club Presidential & Leadership Elections
            </h1>
            <p className="text-slate-300 font-medium text-sm md:text-base leading-relaxed">
              Vote between candidates during live election hours. The winning candidate automatically inherits administrative access to lead the club!
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {canCreateElection && (
              <button 
                onClick={() => setShowCreateModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-500/25 transition-all hover:scale-105 cursor-pointer"
              >
                <Plus size={18} />
                <span>Launch New Election</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient glow decoration */}
        <div className="absolute -right-20 -top-20 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute right-40 -bottom-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      {/* Filter and Tab Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {['all', 'live', 'completed', 'upcoming'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-4 py-2 rounded-xl text-xs font-black capitalize transition-all ${
                filterStatus === st 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {st === 'all' ? 'All Elections' : st}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center bg-slate-50 rounded-xl px-3 py-2 border border-slate-200 w-full sm:w-auto text-xs">
            <Filter size={15} className="text-slate-400 mr-2 shrink-0" />
            <select
              className="bg-transparent font-bold text-slate-700 outline-none w-full"
              value={filterClub}
              onChange={(e) => setFilterClub(e.target.value)}
            >
              <option value="">Filter by Club (All)</option>
              {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Main Election Cards List */}
      {isLoading ? (
        <div className="flex justify-center p-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : filteredElections.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm">
          <Vote size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="text-lg font-black text-slate-800">No Elections Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
            There are currently no elections matching this filter. Admins can launch an election with custom candidate matchups.
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {filteredElections.map((election) => {
            const now = new Date();
            const start = new Date(election.startDate);
            const end = new Date(election.endDate);
            const isLive = now >= start && now <= end && !election.isConcluded;
            const isCompleted = election.isConcluded || now > end;
            const isUpcoming = now < start;
            const hasVoted = user && Array.isArray(election.votedUsers) && election.votedUsers.some(v => v.toString() === user._id || v?._id === user._id);
            
            // Check if user is an approved member of this club
            const userClubId = (election.clubId?._id || election.clubId)?.toString();
            const isClubMember = Boolean(
              user && (
                user.role === 'admin' ||
                (Array.isArray(election.clubId?.members) && election.clubId.members.some(m => (m?._id || m)?.toString() === user._id?.toString())) ||
                (Array.isArray(user.clubMemberships) && user.clubMemberships.some(c => (c?._id || c)?.toString() === userClubId)) ||
                (election.clubId?.presidentId && (election.clubId.presidentId._id || election.clubId.presidentId)?.toString() === user._id?.toString()) ||
                (election.clubId?.vicePresidentId && (election.clubId.vicePresidentId._id || election.clubId.vicePresidentId)?.toString() === user._id?.toString())
              )
            );
            const canVote = isLive && !hasVoted && user && isClubMember;

            // Extract candidate pair (Profile 1 vs Profile 2)
            const cand1 = election.candidates?.[0] || null;
            const cand2 = election.candidates?.[1] || null;

            const totalVotes = (cand1?.votes || 0) + (cand2?.votes || 0);
            const pct1 = totalVotes > 0 ? Math.round(((cand1?.votes || 0) / totalVotes) * 100) : 50;
            const pct2 = totalVotes > 0 ? 100 - pct1 : 50;

            const cand1User = cand1?.candidateId || {};
            const cand2User = cand2?.candidateId || {};

            const cand1Photo = cand1?.photo || cand1User?.profilePicture || null;
            const cand2Photo = cand2?.photo || cand2User?.profilePicture || null;

            const winnerId = election.winner?.candidateId?._id || election.winner?.candidateId;
            const isCand1Winner = isCompleted && ((winnerId && (winnerId === cand1?.candidateId?._id || winnerId === cand1?.candidateId)) || ((cand1?.votes || 0) > (cand2?.votes || 0)));
            const isCand2Winner = isCompleted && ((winnerId && (winnerId === cand2?.candidateId?._id || winnerId === cand2?.candidateId)) || ((cand2?.votes || 0) > (cand1?.votes || 0)));

            return (
              <motion.div
                key={election._id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[32px] border border-slate-200/80 shadow-xl overflow-hidden transition-all hover:shadow-2xl"
              >
                {/* ── CARD HEADER: CLUB INFO & SCHEDULED TIME WINDOW ── */}
                <div className="bg-slate-900 text-white px-6 py-5 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-500 text-white flex items-center justify-center font-black text-xl shadow-md shrink-0">
                      {election.clubId?.logo ? (
                        <img src={election.clubId.logo} alt={election.clubId.name} className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        election.clubId?.name?.charAt(0) || 'C'
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                          {election.clubId?.name || 'Campus Club'}
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-xs font-bold text-amber-300">
                          {election.position || 'President'} Race
                        </span>
                        {user && (
                          isClubMember ? (
                            <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-black text-[10px] border border-emerald-400/30 flex items-center gap-1">
                              <Check size={11} /> Eligible Voter
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-bold text-[10px] border border-amber-400/30 flex items-center gap-1">
                              <Lock size={11} /> Members Only
                            </span>
                          )
                        )}
                      </div>
                      <h2 className="text-xl md:text-2xl font-black text-white tracking-tight">
                        {election.title}
                      </h2>
                    </div>
                  </div>

                  {/* Scheduled Election Time Window & Countdown */}
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-xl text-left">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Timer size={12} className="text-indigo-400" /> Floating Voting Window:
                      </div>
                      <div className="text-xs font-black text-slate-200 font-mono">
                        {format(start, 'hh:mm a')} – {format(end, 'hh:mm a')} ({format(start, 'dd MMM')})
                      </div>
                    </div>

                    <ElectionCountdown 
                      startDate={election.startDate} 
                      endDate={election.endDate} 
                      isCompleted={isCompleted} 
                      isLive={isLive} 
                    />

                    {isAdmin && !isCompleted && (
                      <button
                        onClick={() => handleConclude(election._id, election.title)}
                        className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                        title="Conclude voting now and officially elevate the leading candidate to President"
                      >
                        <Award size={14} /> Conclude & Elect
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(election._id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition cursor-pointer"
                        title="Delete Election"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── CARD BODY: PROFILE 1 VS PROFILE 2 MATCHUP ── */}
                <div className="p-6 md:p-10 relative bg-gradient-to-b from-slate-50/50 to-white">
                  <div className="grid grid-cols-1 lg:grid-cols-11 gap-6 items-center">
                    {/* ──── CANDIDATE 1 (PROFILE ONE) ──── */}
                    <div className={`lg:col-span-5 p-6 rounded-3xl border-2 transition-all relative ${
                      isCand1Winner 
                        ? 'bg-amber-500/5 border-amber-400 shadow-lg shadow-amber-500/10' 
                        : 'bg-white border-slate-200/90 shadow-sm'
                    }`}>
                      {isCand1Winner && (
                        <div className="absolute -top-3.5 left-6 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                          <Crown size={13} className="fill-slate-950" /> Elected {election.position || 'President'}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-5 mb-4 text-center sm:text-left">
                        <div className="relative">
                          <div className={`w-24 h-24 rounded-2xl overflow-hidden border-4 shadow-md ${
                            isCand1Winner ? 'border-amber-400 ring-4 ring-amber-300/30' : 'border-indigo-100'
                          }`}>
                            <img 
                              src={cand1Photo} 
                              alt={cand1?.name || 'Candidate 1'} 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = null; }}
                            />
                          </div>
                          <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
                            #1
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                            Candidate Profile 1
                          </span>
                          <h3 className="text-xl font-black text-slate-900 truncate mt-1">
                            {cand1?.name || cand1User?.name || 'Nominated Candidate'}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            {cand1User?.department || 'Candidate'} {cand1User?.year ? `• Year ${cand1User.year}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Manifesto quote */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                        <p className="text-xs text-slate-600 font-medium italic leading-relaxed">
                          "{cand1?.manifesto || 'Pledging to organize premier inter-college tournaments and foster athletic excellence.'}"
                        </p>
                      </div>

                      {/* Live Votes Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500">Votes Secured</span>
                          <span className="text-slate-900 font-black">{cand1?.votes || 0} votes ({pct1}%)</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ${isCand1Winner ? 'bg-amber-500' : 'bg-indigo-600'}`}
                            style={{ width: `${pct1}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* ──── CENTER: VERSUS (VS) EMBLEM ──── */}
                    <div className="lg:col-span-1 flex flex-col items-center justify-center py-2 text-center">
                      <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-slate-900 via-indigo-900 to-slate-900 text-amber-400 font-black text-lg flex items-center justify-center shadow-xl border-4 border-white animate-pulse">
                        VS
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                        Matchup
                      </span>
                      <span className="text-xs font-black text-slate-700 font-mono mt-0.5">
                        {totalVotes} Votes
                      </span>
                    </div>

                    {/* ──── CANDIDATE 2 (PROFILE TWO) ──── */}
                    <div className={`lg:col-span-5 p-6 rounded-3xl border-2 transition-all relative ${
                      isCand2Winner 
                        ? 'bg-amber-500/5 border-amber-400 shadow-lg shadow-amber-500/10' 
                        : 'bg-white border-slate-200/90 shadow-sm'
                    }`}>
                      {isCand2Winner && (
                        <div className="absolute -top-3.5 right-6 px-3.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[11px] shadow-md flex items-center gap-1.5 uppercase tracking-wider">
                          <Crown size={13} className="fill-slate-950" /> Elected {election.position || 'President'}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-5 mb-4 text-center sm:text-left">
                        <div className="relative">
                          <div className={`w-24 h-24 rounded-2xl overflow-hidden border-4 shadow-md ${
                            isCand2Winner ? 'border-amber-400 ring-4 ring-amber-300/30' : 'border-blue-100'
                          }`}>
                            <img 
                              src={cand2Photo} 
                              alt={cand2?.name || 'Candidate 2'} 
                              className="w-full h-full object-cover"
                              onError={(e) => { e.target.src = null; }}
                            />
                          </div>
                          <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-md border-2 border-white">
                            #2
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                            Candidate Profile 2
                          </span>
                          <h3 className="text-xl font-black text-slate-900 truncate mt-1">
                            {cand2?.name || cand2User?.name || 'Nominated Candidate'}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            {cand2User?.department || 'Candidate'} {cand2User?.year ? `• Year ${cand2User.year}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Manifesto quote */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                        <p className="text-xs text-slate-600 font-medium italic leading-relaxed">
                          "{cand2?.manifesto || 'Committed to transparent club budgeting, vibrant workshops, and student representation.'}"
                        </p>
                      </div>

                      {/* Live Votes Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-bold">
                          <span className="text-slate-500">Votes Secured</span>
                          <span className="text-slate-900 font-black">{cand2?.votes || 0} votes ({pct2}%)</span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ${isCand2Winner ? 'bg-amber-500' : 'bg-blue-600'}`}
                            style={{ width: `${pct2}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── LOWER ACTION BAR: VOTE HIM OR VOTE HIM ── */}
                  <div className="mt-8 pt-6 border-t border-slate-100">
                    {hasVoted ? (
                      <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={22} />
                          </div>
                          <div>
                            <h4 className="font-black text-sm">Your Ballot Has Been Cast!</h4>
                            <p className="text-xs text-emerald-700">Thank you for participating in campus governance. Results update in real-time.</p>
                          </div>
                        </div>
                        <span className="px-3 py-1 bg-emerald-200/60 rounded-full font-black text-xs text-emerald-900 uppercase">
                          Verified Voter
                        </span>
                      </div>
                    ) : isLive && !user ? (
                      <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <Lock size={18} className="text-slate-500" />
                          <span>Please log in with your student account to verify your club membership and vote.</span>
                        </div>
                        <Link to="/login" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition shadow-sm">
                          Log In to Vote
                        </Link>
                      </div>
                    ) : isLive && !isClubMember ? (
                      <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                            <Lock size={20} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-amber-950">Voter Eligibility Restricted</h4>
                              <span className="px-2 py-0.5 bg-amber-200/80 text-amber-900 rounded font-black text-[10px] uppercase tracking-wider">
                                {election.clubId?.name || 'Club'} Members Only
                              </span>
                            </div>
                            <p className="text-xs text-amber-800/90 mt-0.5">
                              You are not currently registered as an official member of <strong>{election.clubId?.name || 'this club'}</strong>. Only registered & paid members can vote in this race.
                            </p>
                          </div>
                        </div>
                        <Link
                          to={`/clubs/${userClubId}`}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
                        >
                          Join & Pay Membership Fee <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    ) : isLive ? (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-600 uppercase tracking-wider">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Live Voting Station Active
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-black text-[10px]">
                              ✓ Verified Club Member
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            Select your candidate below. Votes are cryptographically recorded once.
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 w-full sm:w-auto">
                          {cand1 && (
                            <button
                              onClick={() => handleVote(election._id, cand1.candidateId?._id || cand1.candidateId, cand1.name)}
                              disabled={votingElectionId === election._id}
                              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-indigo-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Vote size={15} />
                              <span>Vote {cand1.name?.split(' ')[0] || 'Candidate 1'}</span>
                            </button>
                          )}

                          {cand2 && (
                            <button
                              onClick={() => handleVote(election._id, cand2.candidateId?._id || cand2.candidateId, cand2.name)}
                              disabled={votingElectionId === election._id}
                              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-2xl shadow-lg shadow-blue-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                            >
                              <Vote size={15} />
                              <span>Vote {cand2.name?.split(' ')[0] || 'Candidate 2'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : isCompleted ? (
                      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Trophy size={22} />
                          </div>
                          <div>
                            <h4 className="font-black text-sm">
                              Election Concluded & Winner Formally Sworn In!
                            </h4>
                            <p className="text-xs text-amber-800">
                              {election.winner?.name 
                                ? `${election.winner.name} won with ${election.winner.votes || 0} votes and now has full ${election.position || 'President'} administrative authority.`
                                : 'Final ballots tabulated. Winner elevated.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="px-3.5 py-1 bg-amber-200/80 rounded-full font-black text-xs text-amber-950 uppercase tracking-wider">
                            Officially Certified
                          </span>
                        </div>
                      </div>
                    ) : !isClubMember ? (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 font-bold">
                          <Clock size={16} className="text-slate-400 shrink-0" />
                          <span>Voting window opens on {format(start, 'PPP')} at {format(start, 'hh:mm a')}. Only approved members of {election.clubId?.name} are eligible to vote.</span>
                        </div>
                        <Link
                          to={`/clubs/${userClubId}`}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                        >
                          Join Club Ahead of Election <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 font-bold">
                          <Clock size={16} className="text-slate-400" />
                          <span>Voting window opens on {format(start, 'PPP')} at {format(start, 'hh:mm a')}. You are verified to vote.</span>
                        </div>
                        <button
                          onClick={() => setShowNominateModal(election)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer"
                        >
                          Stand for Election
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: LAUNCH NEW ELECTION & CANDIDATE MATCHUP (PROFILE 1 VS PROFILE 2) ── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-[32px] p-6 md:p-8 max-w-3xl w-full my-8 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto custom-scrollbar"
          >
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Launch New Club Election</h2>
                <p className="text-xs text-slate-500 font-medium">Float election timing and setup Candidate Profile 1 vs Profile 2 matchup.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-6 text-xs">
              {/* Section 1: Election Scope */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 uppercase mb-1">Election Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. 2026 Cricket Club Presidential Race"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none text-slate-900 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Target Leadership Post</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none text-slate-900 text-xs"
                  >
                    <option value="President">Club President</option>
                    <option value="Vice President">Vice President</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Club & Floating Voting Hours */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Institutional Club</label>
                  <select
                    required
                    value={formData.clubId}
                    onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none text-slate-900 text-xs"
                  >
                    <option value="">-- Choose Club --</option>
                    {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Voting Start Time (Float Start)</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase mb-1">Voting End Time (Float End)</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-xs"
                  />
                </div>
              </div>

              {/* Section 3: Matchup Setup (Profile 1 vs Profile 2) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Flame size={16} className="text-amber-500" /> Candidates Standing for Election (Versus Matchup)
                    </h3>
                    <p className="text-[11px] text-slate-500">Pick two students who will face off on the ballot card.</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                    2 Candidates Required
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Candidate 1 Box */}
                  <div className="p-4 bg-white rounded-2xl border border-indigo-200 shadow-sm space-y-3">
                    <span className="font-black text-indigo-700 uppercase tracking-wider text-[11px] block">
                      Candidate 1 (Profile One)
                    </span>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Student</label>
                      <select
                        required
                        value={candidate1.candidateId}
                        onChange={(e) => {
                          const u = users.find(usr => usr._id === e.target.value);
                          setCandidate1({
                            ...candidate1,
                            candidateId: e.target.value,
                            name: u?.name || '',
                            photo: candidate1.photo || u?.profilePicture || ''
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none text-xs"
                      >
                        <option value="">-- Choose Candidate 1 --</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role}) • {u.email}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Custom Photo URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={candidate1.photo}
                        onChange={(e) => setCandidate1({ ...candidate1, photo: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Manifesto / Agenda</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Elevate sports gear, introduce weekly masterclasses..."
                        value={candidate1.manifesto}
                        onChange={(e) => setCandidate1({ ...candidate1, manifesto: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-medium"
                      />
                    </div>
                  </div>

                  {/* Candidate 2 Box */}
                  <div className="p-4 bg-white rounded-2xl border border-blue-200 shadow-sm space-y-3">
                    <span className="font-black text-blue-700 uppercase tracking-wider text-[11px] block">
                      Candidate 2 (Profile Two)
                    </span>
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Student</label>
                      <select
                        required
                        value={candidate2.candidateId}
                        onChange={(e) => {
                          const u = users.find(usr => usr._id === e.target.value);
                          setCandidate2({
                            ...candidate2,
                            candidateId: e.target.value,
                            name: u?.name || '',
                            photo: candidate2.photo || u?.profilePicture || ''
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none text-xs"
                      >
                        <option value="">-- Choose Candidate 2 --</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role}) • {u.email}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Custom Photo URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={candidate2.photo}
                        onChange={(e) => setCandidate2({ ...candidate2, photo: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Manifesto / Agenda</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Expanding collegiate outreach, transparent funding..."
                        value={candidate2.manifesto}
                        onChange={(e) => setCandidate2({ ...candidate2, manifesto: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-medium"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black rounded-xl text-xs shadow-lg transition-all cursor-pointer"
                >
                  {isCreating ? 'Launching Matchup...' : 'Launch Live Election'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── MODAL: STAND FOR ELECTION (STUDENT NOMINATION) ── */}
      {showNominateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }} 
            className="bg-white rounded-[32px] p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-xs max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-black text-slate-900">Stand for Election</h3>
                <p className="text-xs text-slate-400">Nominate yourself for "{showNominateModal.title}"</p>
              </div>
              <button onClick={() => setShowNominateModal(null)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                <X size={16}/>
              </button>
            </div>

            <form onSubmit={handleNominateSubmit} className="space-y-4">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Your Manifesto / Campaign Vision</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Outline your promises, ideas, and dedication to this club..."
                  value={nominationManifesto}
                  onChange={(e) => setNominationManifesto(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Profile Photo / Banner (Optional URL)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={nominationPhoto}
                  onChange={(e) => setNominationPhoto(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNominateModal(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 font-bold rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNomination}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition"
                >
                  {isSubmittingNomination ? 'Submitting...' : 'Confirm Nomination'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Elections;
