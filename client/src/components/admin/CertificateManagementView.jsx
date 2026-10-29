import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Award, UploadCloud, FileSpreadsheet, Download, CheckCircle2, AlertCircle, 
  Search, Eye, Trash2, RefreshCw, Trophy, ShieldCheck, UserCheck, Filter, 
  ExternalLink, Sparkles 
} from 'lucide-react';
import CertificateTemplate from '../CertificateTemplate';

const CertificateManagementView = () => {
  const fileInputRef = useRef(null);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGameFilter, setSelectedGameFilter] = useState('All');
  
  // Excel / CSV Preview State
  const [previewData, setPreviewData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tournamentName, setTournamentName] = useState('Annual Campus Sports Championship');

  // Preview Modal
  const [previewCert, setPreviewCert] = useState(null);

  // Single Direct Certificate Issue Modal State
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [isSubmittingDirect, setIsSubmittingDirect] = useState(false);
  const [directForm, setDirectForm] = useState({
    recipientName: '',
    roll_no: '',
    className: '',
    game: 'Badminton',
    customGame: '',
    position: '1st Position',
    title: 'Annual Inter-Class Sports Championship 2026',
    matchDetails: '',
    issuedByName: 'Director of Athletics',
    issuedByRole: 'admin'
  });

  const handleDirectIssue = async (e) => {
    e.preventDefault();
    if (!directForm.recipientName.trim() && !directForm.roll_no.trim()) {
      toast.error('Please enter student name or roll number');
      return;
    }

    const finalGame = directForm.game === 'Other' ? (directForm.customGame.trim() || 'General Sports') : directForm.game;
    setIsSubmittingDirect(true);

    try {
      const res = await axios.post('/api/certificates/generate', {
        recipientName: directForm.recipientName.trim(),
        roll_no: directForm.roll_no.trim(),
        className: directForm.className.trim(),
        game: finalGame,
        position: directForm.position,
        title: directForm.title.trim() || 'Annual Inter-Class Sports Championship 2026',
        matchDetails: directForm.matchDetails.trim() || `${directForm.position} in ${finalGame}`,
        issuedByName: directForm.issuedByName.trim() || 'Director of Athletics',
        issuedByRole: directForm.issuedByRole
      }, { withCredentials: true });

      toast.success(res.data.message || 'Certificate issued successfully!');
      setShowIssueModal(false);
      setDirectForm({
        recipientName: '',
        roll_no: '',
        className: '',
        game: 'Badminton',
        customGame: '',
        position: '1st Position',
        title: 'Annual Inter-Class Sports Championship 2026',
        matchDetails: '',
        issuedByName: 'Director of Athletics',
        issuedByRole: 'admin'
      });
      fetchCertificates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue certificate');
    } finally {
      setIsSubmittingDirect(false);
    }
  };

  const fetchCertificates = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/certificates', { withCredentials: true });
      setCertificates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
  }, []);

  // Handle File Selection and Parsing Preview
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExts = ['.xlsx', '.xls', '.csv'];
    const hasValidExt = validExts.some(ext => file.name.toLowerCase().endsWith(ext));
    if (!hasValidExt) {
      toast.error('Please upload an Excel (.xlsx, .xls) or CSV file');
      return;
    }

    setSelectedFile(file);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/certificates/bulk-preview', formData, {
        withCredentials: true
      });
      setPreviewData(res.data);
      toast.success(`Extracted ${res.data.totalRows || (res.data.rows || []).length} student entries from ${file.name}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to read spreadsheet');
      setPreviewData(null);
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  // Confirm and Issue All Parsed Certificates
  const handleBulkIssue = async () => {
    if (!previewData || !previewData.rows || previewData.rows.length === 0) {
      toast.error('No certificates to issue');
      return;
    }

    setIssuing(true);
    try {
      const payload = {
        certificates: previewData.rows,
        tournamentName: tournamentName.trim() || 'Annual Sports Championship'
      };

      const res = await axios.post('/api/certificates/bulk-issue', payload, { withCredentials: true });
      toast.success(res.data.message || 'Certificates successfully approved & issued!');
      setPreviewData(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchCertificates();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue certificates');
    } finally {
      setIssuing(false);
    }
  };

  // Delete / Revoke Certificate
  const handleDeleteCert = async (id, name) => {
    if (!window.confirm(`Are you sure you want to revoke the certificate for '${name}'?`)) return;
    try {
      await axios.delete(`/api/certificates/${id}`, { withCredentials: true });
      toast.success('Certificate revoked');
      setCertificates(prev => prev.filter(c => c._id !== id));
    } catch (err) {
      toast.error('Failed to revoke certificate');
    }
  };

  // Unique games in issued certificates
  const uniqueGames = Array.from(new Set((certificates || []).map(c => c.game).filter(Boolean)));

  const filteredCerts = (certificates || []).filter(c => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      c.recipientName?.toLowerCase().includes(q) ||
      c.userId?.name?.toLowerCase().includes(q) ||
      c.roll_no?.toLowerCase().includes(q) ||
      c.userId?.roll_no?.toLowerCase().includes(q) ||
      c.game?.toLowerCase().includes(q) ||
      c.matchDetails?.toLowerCase().includes(q);

    const matchesGame = selectedGameFilter === 'All' || c.game?.toLowerCase() === selectedGameFilter.toLowerCase();
    return matchesSearch && matchesGame;
  });

  return (
    <div className="space-y-6">
      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Trophy size={13} className="text-amber-300" /> Sports Victory Certification
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Approve & Issue Sports Certificates</h2>
          <p className="text-sm text-blue-100 max-w-xl mt-1">
            Upload an Excel or CSV file with Student Name, Roll Number, Game, and Match Won. 
            Certificates will instantly link to the student's ID for viewing and download.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowIssueModal(true)}
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <Award size={16} className="text-slate-900" /> Issue Certificate (Individual)
          </button>
          <a
            href="/api/certificates/template/download"
            download
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Download size={15} /> Download Sample Template
          </a>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-5 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
          >
            <FileSpreadsheet size={16} className="text-blue-600" /> Upload Excel / CSV File
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".xlsx,.xls,.csv"
            className="hidden"
          />
        </div>
      </div>

      {/* ── EXCEL PREVIEW CARD ──────────────────────────────────── */}
      {previewData && (
        <div className="bg-white p-6 rounded-3xl border-2 border-blue-500 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-blue-600 animate-ping"></span>
                <h3 className="text-base font-black text-slate-900">
                  Ready to Issue {previewData.totalRows} Certificates from {selectedFile?.name}
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {previewData.matchedCount} of {previewData.totalRows} students matched with registered CampusHub student IDs.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tournament / Championship Name"
                value={tournamentName}
                onChange={(e) => setTournamentName(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
              <button
                onClick={handleBulkIssue}
                disabled={issuing}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                {issuing ? <RefreshCw size={15} className="animate-spin" /> : <CheckCircle2 size={15} />}
                {issuing ? 'Issuing...' : 'Approve & Issue All'}
              </button>
              <button
                onClick={() => { setPreviewData(null); setSelectedFile(null); }}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto max-h-72 border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                <tr>
                  <th className="px-4 py-3">#</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Game / Sport</th>
                  <th className="px-4 py-3">Match Won / Achievement</th>
                  <th className="px-4 py-3">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {previewData.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-2.5 font-bold text-slate-400">{row.rowIndex}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-slate-800">{row.roll_no}</td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">{row.recipientName}</td>
                    <td className="px-4 py-2.5">
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-md">
                        {row.game}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-emerald-700">{row.matchDetails}</td>
                    <td className="px-4 py-2.5">
                      {row.isMatched ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 size={12} /> Linked to Student ID
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                          <AlertCircle size={12} /> Will link on Roll No login
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ISSUED CERTIFICATES SECTION ──────────────────────────── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-black text-slate-900 text-base">Issued Sports Certificates ({filteredCerts.length})</h3>
            <button
              onClick={fetchCertificates}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search student, roll, or game..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none w-56"
              />
            </div>

            {/* Filter by Game */}
            {uniqueGames.length > 0 && (
              <select
                value={selectedGameFilter}
                onChange={(e) => setSelectedGameFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="All">All Games ({certificates.length})</option>
                {uniqueGames.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Certificate Cards / Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
            Loading issued certificates...
          </div>
        ) : filteredCerts.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Trophy size={36} className="mx-auto text-slate-300 mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No Certificates Found</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Upload an Excel (.xlsx) or CSV file above with Student Name, Roll Number, and Match Won to issue official certificates.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">Student Recipient</th>
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Class Name</th>
                  <th className="px-4 py-3">Game / Discipline</th>
                  <th className="px-4 py-3">Position / Rank</th>
                  <th className="px-4 py-3">Issue Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredCerts.map((cert) => (
                  <tr key={cert._id} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-3 font-bold text-slate-900">
                      {cert.recipientName || cert.userId?.name || 'Student'}
                      {cert.department && (
                        <span className="block text-[10px] text-slate-400 font-normal">{cert.department}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">
                      {cert.roll_no || cert.userId?.roll_no || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-slate-100 font-bold text-slate-800 rounded-md text-[11px]">
                        {cert.className || cert.teamName || cert.department || '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black rounded-lg text-[11px] inline-flex items-center gap-1">
                        🏆 {cert.game || 'Sports'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const pos = cert.position || cert.achievement || (cert.type === 'winner' ? '1st Position' : cert.type === 'runner-up' ? '2nd Position' : cert.type === 'third-place' ? '3rd Position' : 'Participation');
                        const isFirst = pos.includes('1st') || pos.toLowerCase().includes('winner');
                        const isSecond = pos.includes('2nd') || pos.toLowerCase().includes('runner');
                        const isThird = pos.includes('3rd') || pos.toLowerCase().includes('third');

                        const badge = isFirst
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : isSecond
                          ? 'bg-slate-200 text-slate-800 border-slate-300'
                          : isThird
                          ? 'bg-orange-100 text-orange-900 border-orange-300'
                          : 'bg-blue-50 text-blue-700 border-blue-200';

                        const icon = isFirst ? '🥇' : isSecond ? '🥈' : isThird ? '🥉' : '📜';

                        return (
                          <span className={`px-2.5 py-1 rounded-lg font-black text-xs border inline-flex items-center gap-1 ${badge}`}>
                            {icon} {pos}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-[11px]">
                      {new Date(cert.issueDate || cert.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewCert(cert)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> View
                        </button>
                        <a
                          href={`/api/certificates/${cert._id}/download`}
                          download
                          className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-lg transition text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Download size={13} /> PDF
                        </a>
                        <button
                          onClick={() => handleDeleteCert(cert._id, cert.recipientName || cert.userId?.name)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
                          title="Revoke Certificate"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: PREVIEW CERTIFICATE ───────────────────────────── */}
      {previewCert && (
        <CertificateTemplate
          cert={previewCert}
          onClose={() => setPreviewCert(null)}
        />
      )}
      {/* ── DIRECT SINGLE CERTIFICATE ISSUANCE MODAL ─────────────────── */}
      {showIssueModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-blue-600">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center font-bold text-blue-600">
                  <Award size={22} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Issue Sports Certificate</h3>
                  <p className="text-xs text-slate-500">Specify student class, game, and winning position</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIssueModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleDirectIssue} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abhi Sharma"
                    value={directForm.recipientName}
                    onChange={(e) => setDirectForm({ ...directForm, recipientName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Student Roll Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 23CS045"
                    value={directForm.roll_no}
                    onChange={(e) => setDirectForm({ ...directForm, roll_no: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Class / Section *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Tech CSE 3rd Year"
                    value={directForm.className}
                    onChange={(e) => setDirectForm({ ...directForm, className: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Game / Sport Won *</label>
                  <select
                    value={directForm.game}
                    onChange={(e) => setDirectForm({ ...directForm, game: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Badminton">Badminton</option>
                    <option value="Cricket">Cricket</option>
                    <option value="Football">Football / Soccer</option>
                    <option value="Chess">Chess</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Table Tennis">Table Tennis</option>
                    <option value="Athletics">Athletics (Race/Sprint)</option>
                    <option value="Tug of War">Tug of War</option>
                    <option value="Other">Other / Custom Sport...</option>
                  </select>
                </div>
              </div>

              {directForm.game === 'Other' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Specify Custom Sport Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Swimming, Archery, Kabaddi"
                    value={directForm.customGame}
                    onChange={(e) => setDirectForm({ ...directForm, customGame: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Winning Position / Rank *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { key: '1st Position', label: '1st Position', icon: '🥇', color: 'border-amber-400 bg-amber-50 text-amber-950 font-black' },
                    { key: '2nd Position', label: '2nd Position', icon: '🥈', color: 'border-slate-300 bg-slate-100 text-slate-900 font-bold' },
                    { key: '3rd Position', label: '3rd Position', icon: '🥉', color: 'border-orange-400 bg-orange-50 text-orange-950 font-bold' },
                    { key: 'Participation', label: 'Participant', icon: '📜', color: 'border-blue-200 bg-blue-50 text-blue-900 font-medium' }
                  ].map((p) => (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => setDirectForm({ ...directForm, position: p.key })}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 text-xs ${
                        directForm.position === p.key ? `${p.color} ring-2 ring-blue-500 shadow-xs` : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-base">{p.icon}</span>
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Championship / Event Name</label>
                  <input
                    type="text"
                    value={directForm.title}
                    onChange={(e) => setDirectForm({ ...directForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Signatory Authority Name</label>
                  <input
                    type="text"
                    value={directForm.issuedByName}
                    onChange={(e) => setDirectForm({ ...directForm, issuedByName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowIssueModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingDirect}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-black shadow-md transition flex items-center gap-1.5"
                >
                  {isSubmittingDirect ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      Generating Certificate...
                    </>
                  ) : (
                    <>
                      <Award size={15} />
                      Issue & Deliver to Student
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateManagementView;
