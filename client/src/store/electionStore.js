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
      set((state) => ({ elections: [...state.elections, response.data], isLoading: false }));
      toast.success('Election created successfully');
      return true;
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, isLoading: false });
      toast.error(error.response?.data?.message || 'Failed to create election');
      return false;
    }
  },

  addCandidate: async (electionId, data) => {
    try {
      const response = await axios.post(`${API_URL}/${electionId}/candidates`, data, { withCredentials: true });
      set((state) => ({
        elections: state.elections.map(e => e._id === electionId ? response.data : e)
      }));
      toast.success('Candidate added');
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add candidate');
      return false;
    }
  },

  vote: async (electionId, candidateId) => {
    try {
      await axios.post(`${API_URL}/${electionId}/vote`, { candidateId }, { withCredentials: true });
      toast.success('Vote cast successfully!');
      // Re-fetch to get updated vote counts
      await get().fetchElections();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cast vote');
      return false;
    }
  }
}));

export default useElectionStore;
