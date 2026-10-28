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
import PageHeader from '../components/ui/PageHeader';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/EmptyState';

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
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold tabular-nums ${
      isLive ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20' :
      isCompleted ? 'bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-500/15' : 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-600/15'
    }`}>
      <Clock size={13} className={isLive ? 'animate-spin' : ''} style={{ animationDuration: '4s' }} />
      <span>{timeLeft}</span>
    </div>
  );
};


// Candidate photo with an initials fallback (no stock imagery).
const CandidatePhoto = ({ src, name, tint }) => {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt={name || 'Candidate'} className="w-full h-full object-cover" onError={() => setFailed(true)} />;
  }
  const initials = (name || '?').split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  return (
    <div className={`w-full h-full bg-gradient-to-br ${tint} text-white font-extrabold text-2xl flex items-center justify-center`}>
      {initials}
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
    const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
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
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Hero Banner */}
      <PageHeader
        variant="hero"
        eyebrow="Campus Democratic Elections"
        eyebrowIcon={Vote}
        icon={Vote}
        title="Club Presidential & Leadership Elections"
        description="Vote between candidates during live election hours. The winning candidate automatically inherits administrative access to lead the club!"
        actions={canCreateElection && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn w-full sm:w-auto bg-white text-blue-700 hover:bg-blue-50 shadow-md"
          >
            <Plus size={18} />
            <span>Launch New Election</span>
          </button>
        )}
      />

      {/* Filter and Tab Bar */}
      <div className="card p-3 sm:p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar -mx-1 px-1">
          {['all', 'live', 'completed', 'upcoming'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`tab capitalize ${filterStatus === st ? 'tab-active' : ''}`}
            >
              {st === 'all' ? 'All Elections' : st}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Filter size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            className="input input-icon"
            value={filterClub}
            onChange={(e) => setFilterClub(e.target.value)}
          >
            <option value="">Filter by Club (All)</option>
            {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {/* Main Election Cards List */}
      {isLoading ? (
        <div className="card">
          <LoadingState label="Loading elections…" />
        </div>
      ) : filteredElections.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Vote}
            title="No Elections Found"
            description="There are currently no elections matching this filter. Admins can launch an election with custom candidate matchups."
          />
        </div>
      ) : (
        <div className="space-y-6">
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

            const cand1Photo = cand1?.photo || cand1User?.profilePicture || '';
            const cand2Photo = cand2?.photo || cand2User?.profilePicture || '';

            const winnerId = election.winner?.candidateId?._id || election.winner?.candidateId;
            const isCand1Winner = isCompleted && ((winnerId && (winnerId === cand1?.candidateId?._id || winnerId === cand1?.candidateId)) || ((cand1?.votes || 0) > (cand2?.votes || 0)));
            const isCand2Winner = isCompleted && ((winnerId && (winnerId === cand2?.candidateId?._id || winnerId === cand2?.candidateId)) || ((cand2?.votes || 0) > (cand1?.votes || 0)));

            return (
              <motion.div
                key={election._id}
                initial={{ opacity: 0, y: 25 }}
                animate={{ opacity: 1, y: 0 }}
                className="card overflow-hidden"
              >
                {/* ── CARD HEADER: CLUB INFO & SCHEDULED TIME WINDOW ── */}
                <div className="px-5 py-4 md:px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-600/20 shrink-0 overflow-hidden">
                      {election.clubId?.logo ? (
                        <img src={election.clubId.logo} alt={election.clubId.name} className="w-full h-full object-cover" />
                      ) : (
                        election.clubId?.name?.charAt(0) || 'C'
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
                        <span className="text-xs font-semibold text-blue-600 truncate max-w-full">
                          {election.clubId?.name || 'Campus Club'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-xs font-semibold text-slate-500">
                          {election.position || 'President'} Race
                        </span>
                        {user && (
                          isClubMember ? (
                            <span className="badge-green">
                              <Check size={11} /> Eligible Voter
                            </span>
                          ) : (
                            <span className="badge-amber">
                              <Lock size={11} /> Members Only
                            </span>
                          )
                        )}
                      </div>
                      <h2 className="text-lg md:text-xl font-bold text-dark-900 tracking-tight break-words">
                        {election.title}
                      </h2>
                    </div>
                  </div>

                  {/* Scheduled Election Time Window & Countdown */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="bg-slate-50 border border-slate-200/70 px-3 py-1.5 rounded-xl text-left">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Timer size={12} className="text-blue-600" /> Floating Voting Window:
                      </div>
                      <div className="text-xs font-semibold text-dark-900 tabular-nums">
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
                        className="btn btn-sm bg-amber-500 hover:bg-amber-600 text-white shadow-sm"
                        title="Conclude voting now and officially elevate the leading candidate to President"
                      >
                        <Award size={14} /> Conclude & Elect
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(election._id)}
                        className="btn-icon hover:!text-red-600 hover:!bg-red-50"
                        title="Delete Election"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>

                {/* ── CARD BODY: PROFILE 1 VS PROFILE 2 MATCHUP ── */}
                <div className="p-4 sm:p-6 md:p-8 relative bg-slate-50/60">
                  <div className="grid grid-cols-1 lg:grid-cols-11 gap-5 items-center">
                    {/* ──── CANDIDATE 1 (PROFILE ONE) ──── */}
                    <div className={`lg:col-span-5 p-5 sm:p-6 rounded-2xl border transition-all relative min-w-0 ${
                      isCand1Winner
                        ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-300/40 shadow-sm'
                        : 'bg-white border-slate-200/70 shadow-card'
                    }`}>
                      {isCand1Winner && (
                        <div className="absolute -top-3 left-5 px-3 py-0.5 rounded-full bg-amber-500 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1.5">
                          <Crown size={13} className="fill-white" /> Elected {election.position || 'President'}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 mb-4 text-center sm:text-left">
                        <div className="relative shrink-0">
                          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 shadow-sm ${
                            isCand1Winner ? 'border-amber-300' : 'border-indigo-50'
                          }`}>
                            <CandidatePhoto src={cand1Photo} name={cand1?.name || cand1User?.name} tint="from-indigo-500 to-indigo-700" />
                          </div>
                          <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-[11px] flex items-center justify-center shadow-md border-2 border-white">
                            #1
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 w-full">
                          <span className="badge-indigo">
                            Candidate Profile 1
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-dark-900 truncate mt-1.5">
                            {cand1?.name || cand1User?.name || 'Nominated Candidate'}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            {cand1User?.department || 'Candidate'} {cand1User?.year ? `• Year ${cand1User.year}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Manifesto quote */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        {cand1?.manifesto ? (
                          <p className="text-sm text-slate-600 italic leading-relaxed break-words">"{cand1.manifesto}"</p>
                        ) : (
                          <p className="text-sm text-slate-400">No manifesto submitted.</p>
                        )}
                      </div>

                      {/* Live Votes Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center gap-2 text-xs font-semibold">
                          <span className="text-slate-500">Votes Secured</span>
                          <span className="text-dark-900 font-bold tabular-nums">{cand1?.votes || 0} votes ({pct1}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ${isCand1Winner ? 'bg-amber-500' : 'bg-indigo-600'}`}
                            style={{ width: `${pct1}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* ──── CENTER: VERSUS (VS) EMBLEM ──── */}
                    <div className="lg:col-span-1 flex flex-col items-center justify-center py-2 text-center">
                      <div className="w-14 h-14 rounded-full bg-brand-gradient text-white font-extrabold text-base flex items-center justify-center shadow-lg shadow-blue-900/20 border-4 border-white">
                        VS
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mt-2">
                        Matchup
                      </span>
                      <span className="text-xs font-bold text-dark-900 tabular-nums mt-0.5">
                        {totalVotes} Votes
                      </span>
                    </div>

                    {/* ──── CANDIDATE 2 (PROFILE TWO) ──── */}
                    <div className={`lg:col-span-5 p-5 sm:p-6 rounded-2xl border transition-all relative min-w-0 ${
                      isCand2Winner
                        ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-300/40 shadow-sm'
                        : 'bg-white border-slate-200/70 shadow-card'
                    }`}>
                      {isCand2Winner && (
                        <div className="absolute -top-3 right-5 px-3 py-0.5 rounded-full bg-amber-500 text-white font-semibold text-[11px] shadow-sm flex items-center gap-1.5">
                          <Crown size={13} className="fill-white" /> Elected {election.position || 'President'}
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5 mb-4 text-center sm:text-left">
                        <div className="relative shrink-0">
                          <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-4 shadow-sm ${
                            isCand2Winner ? 'border-amber-300' : 'border-blue-50'
                          }`}>
                            <CandidatePhoto src={cand2Photo} name={cand2?.name || cand2User?.name} tint="from-blue-500 to-blue-700" />
                          </div>
                          <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-blue-600 text-white font-bold text-[11px] flex items-center justify-center shadow-md border-2 border-white">
                            #2
                          </span>
                        </div>

                        <div className="flex-1 min-w-0 w-full">
                          <span className="badge-blue">
                            Candidate Profile 2
                          </span>
                          <h3 className="text-lg sm:text-xl font-bold tracking-tight text-dark-900 truncate mt-1.5">
                            {cand2?.name || cand2User?.name || 'Nominated Candidate'}
                          </h3>
                          <p className="text-xs font-semibold text-slate-500 mt-0.5">
                            {cand2User?.department || 'Candidate'} {cand2User?.year ? `• Year ${cand2User.year}` : ''}
                          </p>
                        </div>
                      </div>

                      {/* Manifesto quote */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-4">
                        {cand2?.manifesto ? (
                          <p className="text-sm text-slate-600 italic leading-relaxed break-words">"{cand2.manifesto}"</p>
                        ) : (
                          <p className="text-sm text-slate-400">No manifesto submitted.</p>
                        )}
                      </div>

                      {/* Live Votes Progress */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center gap-2 text-xs font-semibold">
                          <span className="text-slate-500">Votes Secured</span>
                          <span className="text-dark-900 font-bold tabular-nums">{cand2?.votes || 0} votes ({pct2}%)</span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ${isCand2Winner ? 'bg-amber-500' : 'bg-blue-600'}`}
                            style={{ width: `${pct2}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── LOWER ACTION BAR: VOTE HIM OR VOTE HIM ── */}
                  <div className="mt-6 pt-5 border-t border-slate-200/70">
                    {hasVoted ? (
                      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <CheckCircle2 size={22} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-emerald-900">Your Ballot Has Been Cast!</h4>
                            <p className="text-xs text-emerald-700">Thank you for participating in campus governance. Results update in real-time.</p>
                          </div>
                        </div>
                        <span className="badge-green self-start sm:self-auto">
                          Verified Voter
                        </span>
                      </div>
                    ) : isLive && !user ? (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Lock size={18} className="text-slate-400 shrink-0" />
                          <span>Please log in with your student account to verify your club membership and vote.</span>
                        </div>
                        <Link to="/login" className="btn-primary btn-sm w-full sm:w-auto py-2.5 sm:py-1.5">
                          Log In to Vote
                        </Link>
                      </div>
                    ) : isLive && !isClubMember ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Lock size={20} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-bold text-sm text-amber-900">Voter Eligibility Restricted</h4>
                              <span className="badge-amber">
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
                          className="btn w-full sm:w-auto shrink-0 bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
                        >
                          Join & Pay Membership Fee <ArrowUpRight size={14} />
                        </Link>
                      </div>
                    ) : isLive ? (
                      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                        <div className="text-center md:text-left">
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                            <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-700">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Live Voting Station Active
                            </span>
                            <span className="badge-green">
                              ✓ Verified Club Member
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1">
                            Select your candidate below. Votes are cryptographically recorded once.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 min-[400px]:grid-cols-2 gap-2.5 w-full md:w-auto">
                          {cand1 && (
                            <button
                              onClick={() => handleVote(election._id, cand1.candidateId?._id || cand1.candidateId, cand1.name)}
                              disabled={votingElectionId === election._id}
                              className="btn bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 hover:-translate-y-0.5 min-w-0"
                            >
                              <Vote size={16} className="shrink-0" />
                              <span className="truncate">Vote {cand1.name?.split(' ')[0] || 'Candidate 1'}</span>
                            </button>
                          )}

                          {cand2 && (
                            <button
                              onClick={() => handleVote(election._id, cand2.candidateId?._id || cand2.candidateId, cand2.name)}
                              disabled={votingElectionId === election._id}
                              className="btn-primary min-w-0"
                            >
                              <Vote size={16} className="shrink-0" />
                              <span className="truncate">Vote {cand2.name?.split(' ')[0] || 'Candidate 2'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ) : isCompleted ? (
                      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-start sm:items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                            <Trophy size={22} />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-amber-900">
                              Election Concluded & Winner Formally Sworn In!
                            </h4>
                            <p className="text-xs text-amber-800 break-words">
                              {election.winner?.name
                                ? `${election.winner.name} won with ${election.winner.votes || 0} votes and now has full ${election.position || 'President'} administrative authority.`
                                : 'Final ballots tabulated. Winner elevated.'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="badge-amber">
                            Officially Certified
                          </span>
                        </div>
                      </div>
                    ) : !isClubMember ? (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                          <Clock size={16} className="text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
                          <span>Voting window opens on {format(start, 'PPP')} at {format(start, 'hh:mm a')}. Only approved members of {election.clubId?.name} are eligible to vote.</span>
                        </div>
                        <Link
                          to={`/clubs/${userClubId}`}
                          className="btn-primary btn-sm w-full sm:w-auto shrink-0 py-2.5 sm:py-1.5"
                        >
                          Join Club Ahead of Election <ArrowUpRight size={13} />
                        </Link>
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-white border border-slate-200 text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm">
                        <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                          <Clock size={16} className="text-blue-600 shrink-0 mt-0.5 sm:mt-0" />
                          <span>Voting window opens on {format(start, 'PPP')} at {format(start, 'hh:mm a')}. You are verified to vote.</span>
                        </div>
                        <button
                          onClick={() => setShowNominateModal(election)}
                          className="btn-primary btn-sm w-full sm:w-auto shrink-0 py-2.5 sm:py-1.5"
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
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-panel sm:max-w-3xl"
          >
            <div className="sticky top-0 z-10 bg-white flex justify-between items-start gap-3 px-5 py-4 sm:px-6 border-b border-slate-100">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-dark-900">Launch New Club Election</h2>
                <p className="text-xs text-slate-500 mt-0.5">Float election timing and setup Candidate Profile 1 vs Profile 2 matchup.</p>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="btn-icon shrink-0" aria-label="Close">
                <X size={18}/>
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-5 p-5 sm:p-6">
              {/* Section 1: Election Scope */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Election Title</label>
                  <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. 2026 Cricket Club Presidential Race"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Target Leadership Post</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="input"
                  >
                    <option value="President">Club President</option>
                    <option value="Vice President">Vice President</option>
                  </select>
                </div>
              </div>

              {/* Section 2: Club & Floating Voting Hours */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Institutional Club</label>
                  <select
                    required
                    value={formData.clubId}
                    onChange={(e) => setFormData({ ...formData, clubId: e.target.value })}
                    className="input"
                  >
                    <option value="">-- Choose Club --</option>
                    {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Voting Start Time (Float Start)</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Voting End Time (Float End)</label>
                  <input
                    required
                    type="datetime-local"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Section 3: Matchup Setup (Profile 1 vs Profile 2) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-dark-900 flex items-center gap-2">
                      <Flame size={16} className="text-amber-500 shrink-0" /> Candidates Standing for Election (Versus Matchup)
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Pick two students who will face off on the ballot card.</p>
                  </div>
                  <span className="badge-indigo self-start sm:self-auto shrink-0">
                    2 Candidates Required
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Candidate 1 Box */}
                  <div className="p-4 bg-white rounded-xl border border-indigo-200 shadow-card space-y-3 min-w-0">
                    <span className="badge-indigo">
                      Candidate 1 (Profile One)
                    </span>
                    <div>
                      <label className="label">Student</label>
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
                        className="input"
                      >
                        <option value="">-- Choose Candidate 1 --</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role}) • {u.email}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="label">Custom Photo URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={candidate1.photo}
                        onChange={(e) => setCandidate1({ ...candidate1, photo: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Manifesto / Agenda</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Elevate sports gear, introduce weekly masterclasses..."
                        value={candidate1.manifesto}
                        onChange={(e) => setCandidate1({ ...candidate1, manifesto: e.target.value })}
                        className="input resize-y"
                      />
                    </div>
                  </div>

                  {/* Candidate 2 Box */}
                  <div className="p-4 bg-white rounded-xl border border-blue-200 shadow-card space-y-3 min-w-0">
                    <span className="badge-blue">
                      Candidate 2 (Profile Two)
                    </span>
                    <div>
                      <label className="label">Student</label>
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
                        className="input"
                      >
                        <option value="">-- Choose Candidate 2 --</option>
                        {users.map(u => <option key={u._id} value={u._id}>{u.name} ({u.role}) • {u.email}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="label">Custom Photo URL (Optional)</label>
                      <input
                        type="text"
                        placeholder="https://..."
                        value={candidate2.photo}
                        onChange={(e) => setCandidate2({ ...candidate2, photo: e.target.value })}
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label">Manifesto / Agenda</label>
                      <textarea
                        required
                        rows={2}
                        placeholder="e.g. Expanding collegiate outreach, transparent funding..."
                        value={candidate2.manifesto}
                        onChange={(e) => setCandidate2({ ...candidate2, manifesto: e.target.value })}
                        className="input resize-y"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-primary w-full sm:w-auto"
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
        <div className="modal-overlay">
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="modal-panel"
          >
            <div className="flex justify-between items-start gap-3 px-5 py-4 sm:px-6 border-b border-slate-100">
              <div className="min-w-0">
                <h3 className="text-lg font-bold tracking-tight text-dark-900">Stand for Election</h3>
                <p className="text-xs text-slate-500 mt-0.5 break-words">Nominate yourself for "{showNominateModal.title}"</p>
              </div>
              <button onClick={() => setShowNominateModal(null)} className="btn-icon shrink-0" aria-label="Close">
                <X size={16}/>
              </button>
            </div>

            <form onSubmit={handleNominateSubmit} className="space-y-4 p-5 sm:p-6">
              <div>
                <label className="label">Your Manifesto / Campaign Vision</label>
                <textarea
                  required
                  rows={3}
                  placeholder="Outline your promises, ideas, and dedication to this club..."
                  value={nominationManifesto}
                  onChange={(e) => setNominationManifesto(e.target.value)}
                  className="input resize-y"
                />
              </div>

              <div>
                <label className="label">Profile Photo / Banner (Optional URL)</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={nominationPhoto}
                  onChange={(e) => setNominationPhoto(e.target.value)}
                  className="input"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNominateModal(null)}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNomination}
                  className="btn-primary w-full sm:w-auto"
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
