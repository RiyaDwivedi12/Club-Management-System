import { create } from 'zustand';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = '/api/elections';

const useElectionStore = create((set, get) => ({
  elections: [],
  isLoading: false,
  error: null,

  fetchElections: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(API_URL);
      set({ elections: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error('Failed to fetch elections');
    }
  },

  createElection: async (electionData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(API_URL, electionData, { withCredentials: true });
      set((state) => ({ elections: [response.data, ...state.elections], isLoading: false }));
      toast.success('Election created successfully');
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to create election');
      return null;
    }
  },

  addCandidate: async (electionId, data) => {
    try {
      const response = await axios.post(`${API_URL}/${electionId}/candidates`, data, { withCredentials: true });
      set((state) => ({
        elections: state.elections.map(e => e._id === electionId ? response.data : e)
      }));
      toast.success('Candidate added to matchup!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add candidate');
      return false;
    }
  },

  nominateCandidate: async (electionId, data) => {
    try {
      const response = await axios.post(`${API_URL}/${electionId}/nominate`, data, { withCredentials: true });
      set((state) => ({
        elections: state.elections.map(e => e._id === electionId ? response.data : e)
      }));
      toast.success('Nomination submitted successfully!');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit nomination');
      return false;
    }
  },

  vote: async (electionId, candidateId) => {
    try {
      const res = await axios.post(`${API_URL}/${electionId}/vote`, { candidateId }, { withCredentials: true });
      toast.success(res.data?.message || 'Vote cast successfully!');
      // Update locally & re-fetch
      await get().fetchElections();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cast vote');
      return false;
    }
  },

  concludeElection: async (electionId) => {
    try {
      const response = await axios.post(`${API_URL}/${electionId}/conclude`, {}, { withCredentials: true });
      set((state) => ({
        elections: state.elections.map(e => e._id === electionId ? response.data.election : e)
      }));
      toast.success(response.data?.message || 'Election concluded! Winner leadership privileges elevated.');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to conclude election');
      return false;
    }
  },

  deleteElection: async (electionId) => {
    try {
      await axios.delete(`${API_URL}/${electionId}`, { withCredentials: true });
      set((state) => ({
        elections: state.elections.filter(e => e._id !== electionId)
      }));
      toast.success('Election deleted successfully');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete election');
      return false;
    }
  },

  updateVoteCount: (electionId, candidateId, newVotes) => {
    set((state) => ({
      elections: state.elections.map((election) => {
        if (election._id === electionId) {
          return {
            ...election,
            candidates: election.candidates.map((c) =>
              c.candidateId?._id === candidateId || c.candidateId === candidateId
                ? { ...c, votes: newVotes }
                : c
            ),
          };
        }
        return election;
      }),
    }));
  }
}));

export default useElectionStore;
