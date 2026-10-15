import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, FileSpreadsheet, Download, Eye, CheckCircle, Users, ArrowRight, Shield, Award } from 'lucide-react';
import toast from 'react-hot-toast';

const Tournaments = () => {
  const { user } = useAuthStore();
  const [tournaments, setTournaments] = useState([]);
  const [clubs, setClubs] = useState([]);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({ name: '', clubId: '', refereeId: '' });
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchTournaments();
    axios.get('/api/clubs').then(res => setClubs(res.data)).catch(console.error);
    if (user && ['admin', 'faculty'].includes(user.role)) {
      axios.get('/api/auth/users', { withCredentials: true }).then(res => setUsers(res.data)).catch(console.error);
    }
  }, [user]);

  const fetchTournaments = async () => {
    try {
      const res = await axios.get('/api/tournaments');
      setTournaments(res.data || []);
    } catch (err) {
      toast.error('Failed to load tournaments');
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handlePreview = async () => {
    if (!file) return toast.error("Please select an Excel or CSV file");
    const data = new FormData();
    data.append('file', file);
    data.append('preview', 'true');
    try {
      const res = await axios.post('/api/tournaments/upload', data, { withCredentials: true });
      setPreview(res.data.preview);
      toast.success("Excel data preview loaded!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to parse preview");
    }
  };

  const handleConfirm = async () => {
    if (!formData.name || !formData.clubId || !formData.refereeId) {
      return toast.error("Please fill tournament name, club, and referee");
    }
    if (!file) {
      return toast.error("Please attach an Excel/CSV file with teams");
    }

    setIsLoading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('name', formData.name);
    data.append('clubId', formData.clubId);
    data.append('refereeId', formData.refereeId);
    
    try {
      await axios.post('/api/tournaments/upload', data, { withCredentials: true });
      toast.success("Tournament and single-elimination bracket generated!");
      setPreview(null);
      setFile(null);
      setFormData({ name: '', clubId: '', refereeId: '' });
      setShowCreateModal(false);
      fetchTournaments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create tournament");
    } finally {
      setIsLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Section Name,Class/Year,Wing,Student Roll Numbers\nCSE-Alpha,2026,Senior,101,102,103\nIT-Beta,2026,Senior,201,202,203\nECE-Gamma,2026,Junior,301,302,303\nMECH-Delta,2026,Junior,401,402,403\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "tournament_bracket_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const canManage = user && ['admin', 'faculty'].includes(user.role);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans pb-20">
      {/* Header Banner */}
      <div className="mb-8 p-8 rounded-[32px] bg-gradient-to-br from-dark-900 via-primary-950 to-slate-900 text-white relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-400 font-bold text-xs uppercase tracking-wider mb-3">
              <Trophy size={14} /> Athletic Championships
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">
              Tournaments & <span className="text-primary-400">Brackets</span>
            </h1>
            <p className="text-slate-400 font-medium text-base md:text-lg max-w-xl">
              Knockout championship trees, automated bracket generation from team rosters, and real-time live progression.
            </p>
          </div>

          {canManage && (
            <button
              onClick={() => setShowCreateModal(!showCreateModal)}
              className="flex items-center gap-2 bg-primary-600 hover:bg-primary-500 text-white px-6 py-3.5 rounded-2xl font-bold transition-all shadow-lg hover:shadow-primary-500/25"
            >
              <Plus size={20} />
              {showCreateModal ? 'Close Form' : 'New Tournament'}
            </button>
          )}
        </div>

        {/* Decorative background glows */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-primary-500 opacity-20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Creation Modal / Form */}
      <AnimatePresence>
        {showCreateModal && canManage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100 mb-10"
          >
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                <FileSpreadsheet className="text-primary-600" /> Create Tournament from Excel
              </h2>
              <button
                onClick={downloadTemplate}
                className="inline-flex items-center gap-1.5 text-xs text-primary-600 hover:text-primary-800 font-bold bg-primary-50 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Download size={14} /> Download Sample Template (.csv)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Tournament Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Inter-Branch Football Cup 2026" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Organizing Club</label>
                <select 
                  value={formData.clubId} 
                  onChange={e => setFormData({...formData, clubId: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">Select Club</option>
                  {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Primary Match Referee</label>
                <select 
                  value={formData.refereeId} 
                  onChange={e => setFormData({...formData, refereeId: e.target.value})} 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="">Select Primary Referee</option>
                  {users.filter(u => u.role === 'referee' || u.role === 'admin').map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <input 
                  type="file" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileChange} 
                  className="text-sm font-semibold file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-primary-600 file:text-white hover:file:bg-primary-700 cursor-pointer" 
                />
              </div>
              <button 
                type="button" 
                onClick={handlePreview} 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                <Eye size={14} /> Preview Sections
              </button>
            </div>
            
            {preview && (
              <div className="mt-6 border-t pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold text-gray-900 text-sm">Parsed Teams ({preview.length} teams found)</h3>
                  <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                    <CheckCircle size={14} /> Ready for bracket generation
                  </span>
                </div>
                <div className="max-h-60 overflow-y-auto mb-6 border rounded-2xl">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-100 text-xs font-black text-gray-600 uppercase sticky top-0">
                      <tr><th className="p-3">Team/Section</th><th className="p-3">Class/Year</th><th className="p-3">Wing</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 font-semibold text-gray-700">
                      {preview.map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="p-3 font-bold text-gray-900">{p.name}</td>
                          <td className="p-3">{p.classOrYear}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-primary-100 text-primary-700">
                              {p.wing}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button 
                  onClick={handleConfirm} 
                  disabled={isLoading}
                  className="px-6 py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black w-full shadow-lg transition-all disabled:opacity-50"
                >
                  {isLoading ? 'Generating Knockout Bracket...' : 'Confirm & Generate Single-Elimination Bracket ⚡'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.length > 0 ? (
          tournaments.map(t => (
            <motion.div 
              key={t._id} 
              whileHover={{ y: -4 }}
              className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center font-black shadow-sm">
                    <Trophy size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                    t.status === 'completed' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-primary-100 text-primary-700'
                  }`}>
                    {t.status || 'Active'}
                  </span>
                </div>

                <h2 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{t.name}</h2>
                <p className="text-gray-500 text-sm font-semibold mb-6 flex items-center gap-2">
                  <Shield size={16} className="text-primary-500" /> {t.clubId?.name || 'College Sports Club'}
                </p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Teams</div>
                    <div className="text-xl font-black text-gray-900">{t.sections?.length || 0}</div>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Rounds</div>
                    <div className="text-xl font-black text-gray-900">{t.rounds || 0}</div>
                  </div>
                </div>
              </div>
              
              <Link 
                to={`/tournaments/${t._id}/bracket`}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3.5 rounded-2xl font-black text-sm shadow-sm transition-all"
              >
                <span>View Full Bracket Tree</span>
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full bg-white rounded-[32px] p-16 text-center border border-gray-100 shadow-sm">
            <Trophy size={56} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-black text-gray-800 mb-2">No Active Tournaments</h3>
            <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
              There are currently no active tournament brackets scheduled. Administrators and faculty coordinators can create one above.
            </p>
            {canManage && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-2xl font-bold text-sm shadow-soft-purple"
              >
                <Plus size={16} /> Create First Tournament
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
