import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  ShieldCheck, Crown, Award, Building2, Timer, Upload, Download, 
  CheckCircle2, AlertCircle, RefreshCw, Search, Trash2, KeyRound, 
  Plus, Users, Sparkles, Trophy, Calendar, Check, X, FileSpreadsheet
} from 'lucide-react';

const RoleOnboardingView = () => {
  const [data, setData] = useState({
    counts: { faculty: 0, presidents: 0, vicePresidents: 0, referees: 0, pendingElevations: 0 },
    faculty: [],
    presidents: [],
    vicePresidents: [],
    referees: [],
    pendingElevations: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Referee Date & Time Expiry State
  const todayStr = new Date().toISOString().split('T')[0];
  const nowTimeStr = new Date().toTimeString().slice(0, 5);
  const [refereeBatchExpiryDate, setRefereeBatchExpiryDate] = useState('2026-11-11');
  const [refereeBatchExpiryTime, setRefereeBatchExpiryTime] = useState('18:00');

  // Referee renew modal state
  const [renewRefereeModal, setRenewRefereeModal] = useState(null); // user object
  const [renewDate, setRenewDate] = useState('2026-11-11');
  const [renewTime, setRenewTime] = useState('18:00');

  // Upload modal / state
  const [uploadRole, setUploadRole] = useState(null); // 'faculty' | 'president' | 'vice_president' | 'referee'
  const [uploading, setUploading] = useState(false);
  const [issuing, setIssuing] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  // Manual single-user onboarding state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    role: 'faculty',
    name: '',
    email: '',
    roll_no: '',
    password: '',
    department: '',
    clubName: '',
    sport: 'Badminton',
    validDays: 30,
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiryTime: '18:00'
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/auth/roles-summary', { withCredentials: true });
      if (res.data) {
        setData({
          counts: res.data.counts || { faculty: 0, presidents: 0, vicePresidents: 0, referees: 0, pendingElevations: 0 },
          faculty: Array.isArray(res.data.faculty) ? res.data.faculty : [],
          presidents: Array.isArray(res.data.presidents) ? res.data.presidents : [],
          vicePresidents: Array.isArray(res.data.vicePresidents) ? res.data.vicePresidents : [],
          referees: Array.isArray(res.data.referees) ? res.data.referees : [],
          pendingElevations: Array.isArray(res.data.pendingElevations) ? res.data.pendingElevations : []
        });
      }
    } catch (err) {
      toast.error('Failed to load role credentials summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Trigger file upload for a specific role
  const handleStartUpload = (role) => {
    setUploadRole(role);
    setPreviewData(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Parse file and generate preview
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadRole) return;

    setSelectedFile(file);
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('role', uploadRole);
    formData.append('preview', 'true');

    try {
      const res = await axios.post('/api/auth/bulk-onboard', formData, {
        withCredentials: true
      });
      setPreviewData(res.data);
      toast.success(`Extracted ${res.data.total || (res.data.records || []).length} ${uploadRole.replace('_', ' ')} entries!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse file');
      setPreviewData(null);
      setSelectedFile(null);
    } finally {
      setUploading(false);
    }
  };

  // Confirm and Commit bulk onboarding
  const handleConfirmOnboard = async () => {
    if (!previewData || !previewData.records || previewData.records.length === 0) return;

    setIssuing(true);
    try {
      const payload = {
        role: uploadRole,
        records: previewData.records,
        preview: 'false',
        ...(uploadRole === 'referee' ? {
          expiryDate: refereeBatchExpiryDate,
          expiryTime: refereeBatchExpiryTime
        } : {})
      };

      const res = await axios.post('/api/auth/bulk-onboard', payload, { withCredentials: true });
      toast.success(res.data.message || 'Accounts successfully onboarded!');
      setPreviewData(null);
      setSelectedFile(null);
      setUploadRole(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to onboard accounts');
    } finally {
      setIssuing(false);
    }
  };

  // Elevate Election Winner to President / Vice President
  const handleElevateWinner = async (elevation) => {
    try {
      await axios.post('/api/auth/approve-election-winner', {
        userId: elevation.candidate._id,
        newRole: elevation.targetRole,
        clubId: elevation.clubId
      }, { withCredentials: true });

      toast.success(`🎉 ${elevation.candidate.name} is now official ${elevation.position} for ${elevation.clubName}!`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to elevate candidate');
    }
  };

  // Extend Referee validity by 7 days
  const handleExtendReferee = async (userId) => {
    try {
      await axios.post('/api/auth/assign-referee', {
        userId,
        durationDays: 7
      }, { withCredentials: true });
      toast.success('Referee privileges extended by +7 days!');
      fetchData();
    } catch (err) {
      toast.error('Failed to extend referee validity');
    }
  };

  // Revoke Role (demote to student)
  const handleRevokeRole = async (userId, userName) => {
    if (!window.confirm(`Revoke privileged credentials for '${userName}'? They will be demoted to student.`)) return;
    try {
      await axios.post('/api/auth/update-role', { userId, role: 'student' }, { withCredentials: true });
      toast.success(`Credentials revoked for ${userName}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to revoke role');
    }
  };

  // Single manual user submission
  const handleManualSubmit = async (e) => {
    e.preventDefault();

    // Strict Date & Time Validation for Referee
    if (manualForm.role === 'referee') {
      if (!manualForm.expiryDate || !manualForm.expiryTime) {
        toast.error('Please specify both expiration date and time for the referee.');
        return;
      }
      const combined = new Date(`${manualForm.expiryDate}T${manualForm.expiryTime}`);
      if (isNaN(combined.getTime())) {
        toast.error('Invalid date or time format. Please select valid values.');
        return;
      }
      if (combined <= new Date()) {
        toast.error('Referee expiration date & time must be in the future.');
        return;
      }
    }
    try {
      await axios.post('/api/auth/bulk-onboard', {
        role: manualForm.role,
        records: [manualForm],
        preview: 'false'
      }, { withCredentials: true });

      toast.success(`${manualForm.name} onboarded as ${manualForm.role.toUpperCase()}!`);
      setShowManualModal(false);
      setManualForm({
        role: 'faculty',
        name: '',
        email: '',
        roll_no: '',
        password: '',
        department: '',
        clubName: '',
        sport: 'Badminton',
        validDays: 30,
    expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    expiryTime: '18:00'
      });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to onboard user');
    }
  };

  // Combined list for directory table
  const allUsersList = [
    ...(data?.faculty || []).map(f => ({ ...f, displayRole: 'Faculty / Mentor', roleKey: 'faculty', icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-200' })),
    ...(data?.presidents || []).map(p => ({ ...p, displayRole: 'Club President', roleKey: 'president', icon: Crown, color: 'text-amber-600 bg-amber-50 border-amber-200' })),
    ...(data?.vicePresidents || []).map(v => ({ ...v, displayRole: 'Vice President', roleKey: 'vice_president', icon: Award, color: 'text-purple-600 bg-purple-50 border-purple-200' })),
    ...(data?.referees || []).map(r => ({ ...r, displayRole: 'Match Referee', roleKey: 'referee', icon: Timer, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }))
  ];

  const filteredUsers = allUsersList.filter(u => {
    const matchesTab = activeTab === 'all' || u.roleKey === activeTab;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q ||
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.roll_no?.toLowerCase().includes(q) ||
      u.clubName?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q) ||
      u.refereeSport?.toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* ── HIDDEN FILE INPUT ──────────────────────────────────────── */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls,.csv"
        className="hidden"
      />

      {/* ── HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <KeyRound size={13} className="text-amber-400" /> Credential Onboarding Console
            </span>
          </div>
          <h2 className="text-2xl font-black tracking-tight">Staff, Leadership & Referee Credentials</h2>
          <p className="text-sm text-slate-300 max-w-2xl mt-1 font-medium">
            Upload CSV/Excel spreadsheets with Names, Gmail/Emails, and Passwords to grant direct login credentials for 
            Club Presidents, Vice Presidents, Faculty Coordinators, and Referees (with custom time validity).
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setShowManualModal(true)}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus size={15} /> Add Single Account
          </button>
          <button
            onClick={fetchData}
            className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* ── ELECTION WINNERS READY FOR ELEVATION BANNER ────────────── */}
      {(data?.pendingElevations || []).length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-2 border-amber-400 p-5 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-md">
                <Crown size={19} />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">
                  {data?.pendingElevations?.length} Elected Leadership Candidate(s) Ready for Official Access!
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  These students won their club elections. Grant their official credentials so they can enter their leadership portal.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {(data?.pendingElevations || []).map((el, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-amber-200 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">
                    Won {el.position}
                  </span>
                  <h4 className="font-black text-slate-900 text-xs mt-1">{el.candidate.name}</h4>
                  <p className="text-[11px] text-slate-500">{el.clubName} • {el.votes} Votes</p>
                </div>
                <button
                  onClick={() => handleElevateWinner(el)}
                  className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs shadow-xs transition shrink-0 cursor-pointer"
                >
                  Grant Access
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── THE 4 ONBOARDING CARDS ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* CARD 1: FACULTY COORDINATORS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Building2 size={22} />
              </div>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-xs rounded-full">
                {data?.counts?.faculty ?? 0} Active
              </span>
            </div>
            <h3 className="font-black text-slate-900 text-base">Faculty Coordinators</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Upload Faculty Name, Gmail, and Password to enable Faculty Coordinator website portal access.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleStartUpload('faculty')}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} /> Upload Faculty CSV/Excel
            </button>
            
          </div>
        </div>

        {/* CARD 2: CLUB PRESIDENTS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Crown size={22} />
              </div>
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-xs rounded-full">
                {data?.counts?.presidents ?? 0} Active
              </span>
            </div>
            <h3 className="font-black text-slate-900 text-base">Club Presidents</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Upload President Name, Gmail, Roll No, Password & Club Name to grant President portal entry.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleStartUpload('president')}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} /> Upload President CSV/Excel
            </button>
            
          </div>
        </div>

        {/* CARD 3: CLUB VICE PRESIDENTS */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Award size={22} />
              </div>
              <span className="px-2.5 py-1 bg-purple-50 text-purple-700 font-bold text-xs rounded-full">
                {data?.counts?.vicePresidents ?? 0} Active
              </span>
            </div>
            <h3 className="font-black text-slate-900 text-base">Club Vice-Presidents</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Upload Vice-President Name, Gmail, Roll No, Password & Club Name to grant Vice-President portal entry.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleStartUpload('vice_president')}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} /> Upload VP CSV/Excel
            </button>
            
          </div>
        </div>

        {/* CARD 4: REFEREES (TIME-BOUND) */}
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Timer size={22} />
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-full">
                {data?.counts?.referees ?? 0} Active
              </span>
            </div>
            <h3 className="font-black text-slate-900 text-base">Match Referees</h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Upload Referees with Sport & Validity Duration (e.g. 7, 14, 30 days) for time-bound tournament officiating.
            </p>
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => handleStartUpload('referee')}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Upload size={14} /> Upload Referee CSV/Excel
            </button>
            
          </div>
        </div>
      </div>

      {/* ── PREVIEW & CONFIRMATION MODAL ─────────────────────────── */}
      {previewData && (
        <div className="bg-white p-6 rounded-3xl border-2 border-indigo-500 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                Ready to Onboard {previewData.role.toUpperCase()}
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">
                Extracted {previewData.total} Accounts from {selectedFile?.name}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmOnboard}
                disabled={issuing}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                {issuing ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                {issuing ? 'Onboarding...' : 'Confirm & Grant Login Access'}
              </button>
              <button
                onClick={() => { setPreviewData(null); setSelectedFile(null); }}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>

          {previewData.role === 'referee' && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-black text-emerald-900 block flex items-center gap-1.5">
                  <Timer size={15} /> Referee Privileges Expiration Date & Time *
                </span>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Referees will be able to officiate matches until this exact date and time.
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-0.5">Date</label>
                  <input
                    required
                    type="date"
                    min={todayStr}
                    value={refereeBatchExpiryDate}
                    onChange={(e) => setRefereeBatchExpiryDate(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-800 uppercase mb-0.5">Time</label>
                  <input
                    required
                    type="time"
                    value={refereeBatchExpiryTime}
                    onChange={(e) => setRefereeBatchExpiryTime(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="overflow-x-auto max-h-64 border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">#</th>
                  <th className="px-4 py-2.5">Name</th>
                  <th className="px-4 py-2.5">Email / Gmail</th>
                  <th className="px-4 py-2.5">Password</th>
                  <th className="px-4 py-2.5">Details (Club / Sport / Days)</th>
                  <th className="px-4 py-2.5">Account Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {previewData.records.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50/80 transition">
                    <td className="px-4 py-2 text-slate-400 font-bold">{r.rowIndex}</td>
                    <td className="px-4 py-2 font-black text-slate-900">{r.name}</td>
                    <td className="px-4 py-2 text-slate-600 font-mono">{r.email}</td>
                    <td className="px-4 py-2 font-mono font-bold text-slate-800">{r.password}</td>
                    <td className="px-4 py-2 text-slate-600">
                      {r.clubName ? `Club: ${r.clubName}` : r.sport ? `Sport: ${r.sport} (${r.validDays}d)` : r.department || 'General'}
                    </td>
                    <td className="px-4 py-2">
                      {r.isExisting ? (
                        <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          Existing Account (Will Elevate)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                          New User (Will Create)
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

      {/* ── DIRECTORY & SEARCH TABLE ───────────────────────────────── */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {['all', 'faculty', 'president', 'vice_president', 'referee'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition capitalize cursor-pointer ${
                  activeTab === tab
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search name, email, roll, club..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none w-64"
            />
          </div>
        </div>

        {/* Directory Table */}
        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs font-bold">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-600" />
            Loading accounts directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Users size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold text-slate-500">No active accounts found in this category</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold">
                <tr>
                  <th className="px-4 py-3">User & Contact</th>
                  <th className="px-4 py-3">Role & Privilege</th>
                  <th className="px-4 py-3">Club / Department / Sport</th>
                  <th className="px-4 py-3">Validity / Access Expiry</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredUsers.map((u) => {
                  const Icon = u.icon;
                  // Referee validity calculation
                  const isReferee = u.roleKey === 'referee';
                  let expiryLabel = 'Indefinite';
                  let formattedExactDateTime = '';
                  let isExpired = false;
                  if (isReferee && u.refereeExpiresAt) {
                    const expDateObj = new Date(u.refereeExpiresAt);
                    formattedExactDateTime = expDateObj.toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    }) + ' at ' + expDateObj.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

                    const diffMs = expDateObj - new Date();
                    if (diffMs > 0) {
                      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                      const diffDays = Math.floor(diffHours / 24);
                      expiryLabel = diffDays > 0 
                        ? `🟢 Active (${diffDays}d ${diffHours % 24}h left)` 
                        : `🟢 Active (${diffHours}h left)`;
                    } else {
                      expiryLabel = '🔴 Expired';
                      isExpired = true;
                    }
                  }

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/80 transition">
                      <td className="px-4 py-3">
                        <div className="font-black text-slate-900">{u.name}</div>
                        <div className="text-[11px] text-slate-400 font-mono">{u.email}</div>
                        {u.roll_no && <div className="text-[10px] text-slate-500 font-bold">Roll: {u.roll_no}</div>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black border inline-flex items-center gap-1 ${u.color}`}>
                          <Icon size={12} /> {u.displayRole}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {u.clubName ? (
                          <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md text-[11px]">
                            {u.clubName}
                          </span>
                        ) : u.refereeSport ? (
                          <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                            🏆 {u.refereeSport}
                          </span>
                        ) : (
                          u.department || 'General'
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isReferee ? (
                          <div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black inline-block ${
                              isExpired ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              {expiryLabel}
                            </span>
                            {formattedExactDateTime && (
                              <span className="block text-[10px] text-slate-500 font-mono mt-0.5 font-bold">
                                {formattedExactDateTime}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Standard Access</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isReferee && (
                            <button
                              onClick={() => setRenewRefereeModal(u)}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-black rounded-lg transition text-[10px] cursor-pointer flex items-center gap-1 border border-emerald-200"
                              title="Set or Renew Valid Date & Time"
                            >
                              <Timer size={11} /> Renew Date/Time
                            </button>
                          )}
                          <button
                            onClick={() => handleRevokeRole(u._id, u.name)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition cursor-pointer"
                            title="Revoke Role to Student"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── MODAL: MANUAL ADD SINGLE USER ────────────────────────── */}
      {showManualModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-black text-slate-900 text-base">Onboard Single Account</h3>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Target Role</label>
                <select
                  value={manualForm.role}
                  onChange={(e) => setManualForm({ ...manualForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="faculty">Faculty Coordinator</option>
                  <option value="president">Club President</option>
                  <option value="vice_president">Club Vice President</option>
                  <option value="referee">Match Referee (Time-Bound)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Full Name *</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Dr. Sunita Rao or Rahul Mehta"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Gmail / Email *</label>
                <input
                  required
                  type="email"
                  placeholder="user@gmail.com"
                  value={manualForm.email}
                  onChange={(e) => setManualForm({ ...manualForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Roll Number</label>
                  <input
                    type="text"
                    placeholder="23CS012"
                    value={manualForm.roll_no}
                    onChange={(e) => setManualForm({ ...manualForm, roll_no: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Login Password *</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. faculty123"
                    value={manualForm.password}
                    onChange={(e) => setManualForm({ ...manualForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {manualForm.role === 'referee' && (
                <div className="space-y-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">Assigned Sport / Game *</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Badminton, Cricket, Football, Chess..."
                      value={manualForm.sport}
                      onChange={(e) => setManualForm({ ...manualForm, sport: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">Valid Until Date *</label>
                      <input
                        required
                        type="date"
                        min={todayStr}
                        value={manualForm.expiryDate}
                        onChange={(e) => setManualForm({ ...manualForm, expiryDate: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-emerald-900 uppercase mb-1">Valid Until Time *</label>
                      <input
                        required
                        type="time"
                        value={manualForm.expiryTime}
                        onChange={(e) => setManualForm({ ...manualForm, expiryTime: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-emerald-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-emerald-700 font-medium">
                    ⚠️ The referee will only be permitted to score and officiate matches until this exact date & time.
                  </p>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shadow-xs transition cursor-pointer"
                >
                  Grant Login Access
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoleOnboardingView;
