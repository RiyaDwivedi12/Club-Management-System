import { useState, useEffect } from 'react';
import useElectionStore from '../store/electionStore';
import useAuthStore from '../store/authStore';
import { motion } from 'framer-motion';
import { Vote, Users, Plus, CheckCircle2 } from 'lucide-react';
import { format } from 'date-fns';

const Elections = () => {
  const { elections, fetchElections, vote, isLoading, error } = useElectionStore();
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchElections();
  }, [fetchElections]);

  const handleVote = async (electionId, candidateId) => {
    if (window.confirm("Are you sure? You cannot change your vote later.")) {
        await vote(electionId, candidateId);
    }
  };

  const canCreateElection = user && (user.role === 'admin' || user.role === 'faculty');

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Club Elections</h1>
          <p className="text-gray-500 font-medium">Vote for your club representatives and leaders.</p>
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
          {elections.length > 0 ? (
            elections.map((election, index) => {
                const now = new Date();
                const startDate = new Date(election.startDate);
                const endDate = new Date(election.endDate);
                const isLive = now >= startDate && now <= endDate;
                const isCompleted = now > endDate;
                const hasVoted = user && election.votedUsers.includes(user._id);

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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {election.candidates.map(candidate => (
                                <div key={candidate._id} className="border border-gray-100 rounded-2xl p-4 flex flex-col h-full hover:border-primary-200 transition-colors">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-black text-xl">
                                            {candidate.candidateId?.name?.charAt(0) || 'C'}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{candidate.candidateId?.name}</h3>
                                            <p className="text-xs font-medium text-gray-500">Candidate</p>
                                        </div>
                                        {(isCompleted || canCreateElection) && (
                                            <div className="ml-auto text-right">
                                                <div className="text-2xl font-black text-primary-600">{candidate.votes}</div>
                                                <div className="text-xs text-gray-400 font-bold uppercase tracking-wider">Votes</div>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-gray-600 text-sm mb-6 flex-1 bg-gray-50 p-3 rounded-xl italic">
                                        "{candidate.manifesto}"
                                    </p>
                                    
                                    {isLive && !hasVoted && (
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
                                <div className="col-span-full py-8 text-center text-gray-400 font-medium border-2 border-dashed border-gray-200 rounded-2xl">
                                    No candidates have been added yet.
                                </div>
                            )}
                        </div>
                    </motion.div>
                );
            })
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 font-medium bg-white rounded-3xl shadow-sm border border-gray-100">
              No active elections right now.
            </div>
          )}
        </div>
      )}
      
      {/* Create Election Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
             <h2 className="text-2xl font-black mb-4">Start New Election</h2>
             <p className="text-gray-500 mb-6">Election creation form goes here.</p>
             <button onClick={() => setShowCreateModal(false)} className="w-full py-3 bg-gray-100 rounded-xl font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Elections;
