import { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Plus, FileSpreadsheet, Download, Eye, CheckCircle, ArrowRight, Shield, X } from 'lucide-react';
import toast from 'react-hot-toast';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/EmptyState';

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
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <PageHeader
        variant="hero"
        eyebrow="Athletic Championships"
        eyebrowIcon={Trophy}
        icon={Trophy}
        title="Tournaments & Brackets"
        description="Knockout championship trees, automated bracket generation from team rosters, and real-time live progression."
        actions={canManage && (
          <button
            onClick={() => setShowCreateModal(!showCreateModal)}
            className="btn bg-white text-blue-700 hover:bg-blue-50 shadow-md"
          >
            {showCreateModal ? <X size={18} /> : <Plus size={18} />}
            {showCreateModal ? 'Close Form' : 'New Tournament'}
          </button>
        )}
      />

      {/* Creation Form */}
      <AnimatePresence>
        {showCreateModal && canManage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="card overflow-hidden"
          >
            <div className="card-header">
              <div className="flex items-center gap-3 min-w-0">
                <div className="icon-tile bg-blue-50 text-blue-600">
                  <FileSpreadsheet size={20} />
                </div>
                <div className="min-w-0">
                  <h2 className="card-title">Create Tournament from Excel</h2>
                  <p className="card-subtitle">Upload team rosters to generate a single-elimination bracket</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="btn-soft btn-sm"
              >
                <Download size={14} /> Download Sample Template (.csv)
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Tournament Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Inter-Branch Football Cup 2026"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">Organizing Club</label>
                  <select
                    value={formData.clubId}
                    onChange={e => setFormData({...formData, clubId: e.target.value})}
                    className="input"
                  >
                    <option value="">Select Club</option>
                    {clubs.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Primary Match Referee</label>
                  <select
                    value={formData.refereeId}
                    onChange={e => setFormData({...formData, refereeId: e.target.value})}
                    className="input"
                  >
                    <option value="">Select Primary Referee</option>
                    {users.filter(u => u.role === 'referee' || u.role === 'admin').map(u => (
                      <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-slate-50 rounded-2xl border border-dashed border-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="min-w-0">
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileChange}
                    className="block w-full max-w-full text-sm text-slate-600 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 file:cursor-pointer cursor-pointer"
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePreview}
                  className="btn-secondary w-full sm:w-auto shrink-0"
                >
                  <Eye size={16} /> Preview Sections
                </button>
              </div>

              {preview && (
                <div className="pt-5 border-t border-slate-100 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-dark-900 text-sm">Parsed Teams ({preview.length} teams found)</h3>
                    <span className="badge-green">
                      <CheckCircle size={12} /> Ready for bracket generation
                    </span>
                  </div>
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-2xl">
                    <div className="table-wrap">
                      <table className="data-table">
                        <thead className="sticky top-0">
                          <tr><th>Team/Section</th><th>Class/Year</th><th>Wing</th></tr>
                        </thead>
                        <tbody>
                          {preview.map((p, i) => (
                            <tr key={i}>
                              <td className="font-semibold text-dark-900">{p.name}</td>
                              <td>{p.classOrYear}</td>
                              <td>
                                <span className="badge-blue">
                                  {p.wing}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <button
                    onClick={handleConfirm}
                    disabled={isLoading}
                    className="btn-primary btn-lg w-full whitespace-normal"
                  >
                    {isLoading ? 'Generating Knockout Bracket...' : 'Confirm & Generate Single-Elimination Bracket'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {tournaments.length > 0 ? (
          tournaments.map(t => (
            <motion.div
              key={t._id}
              whileHover={{ y: -4 }}
              className="card p-5 sm:p-6 flex flex-col justify-between min-w-0 hover:border-blue-200 hover:shadow-card-hover transition-all"
            >
              <div className="min-w-0">
                <div className="flex justify-between items-start gap-3 mb-4">
                  <div className="icon-tile bg-amber-50 text-amber-600">
                    <Trophy size={22} />
                  </div>
                  <span className={`capitalize ${t.status === 'completed' ? 'badge-green' : 'badge-blue'}`}>
                    {t.status || 'Active'}
                  </span>
                </div>

                <h2 className="text-lg font-bold text-dark-900 mb-1.5 leading-snug tracking-tight break-words">{t.name}</h2>
                <p className="text-slate-500 text-sm mb-5 flex items-center gap-2 min-w-0">
                  <Shield size={15} className="text-blue-500 shrink-0" /> <span className="truncate">{t.clubId?.name || 'College Sports Club'}</span>
                </p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Teams</div>
                    <div className="text-xl font-extrabold text-dark-900">{t.sections?.length || 0}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Rounds</div>
                    <div className="text-xl font-extrabold text-dark-900">{t.rounds || 0}</div>
                  </div>
                </div>
              </div>

              <Link
                to={`/tournaments/${t._id}/bracket`}
                className="btn-primary w-full"
              >
                <span>View Full Bracket Tree</span>
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full card">
            <EmptyState
              icon={Trophy}
              title="No Active Tournaments"
              description="There are currently no active tournament brackets scheduled. Administrators and faculty coordinators can create one above."
              action={canManage && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn-primary"
                >
                  <Plus size={16} /> Create First Tournament
                </button>
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Tournaments;
