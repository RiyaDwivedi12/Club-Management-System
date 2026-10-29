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
                  <th className="px-4 py-3">Game / Discipline</th>
                  <th className="px-4 py-3">Victory / Match Won</th>
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
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-black rounded-lg text-[11px] inline-flex items-center gap-1">
                        🏆 {cert.game || 'Sports'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-bold text-emerald-700">
                      {cert.matchDetails || cert.achievement || 'Winner'}
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
    </div>
  );
};

export default CertificateManagementView;
