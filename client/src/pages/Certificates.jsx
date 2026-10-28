import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, Download, ShieldCheck, CheckCircle2, Search, Plus, Trophy, Calendar, 
  Eye, FileText, AlertCircle, Printer, Users, CheckSquare, Square, 
  Filter, Check, GraduationCap, X, ChevronRight, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import CertificateTemplate from '../components/CertificateTemplate';

const Certificates = () => {
  const { user } = useAuthStore();
  const [myCertificates, setMyCertificates] = useState([]);
  const [allCertificates, setAllCertificates] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my'); // 'my' | 'verify' | 'issue' | 'all'
  const [selectedCertForPreview, setSelectedCertForPreview] = useState(null);
  
  // Verification State
  const [verifyHash, setVerifyHash] = useState('');
  const [verifiedCert, setVerifiedCert] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Advanced Issue Form State
  const [issueMode, setIssueMode] = useState('match'); // 'match' | 'tournament'
  const [issueForm, setIssueForm] = useState({
    tournamentId: '',
    title: '',
    teamName: '', // e.g. "BTech 23 A"
    type: 'winner',
    issuedByRole: user?.role === 'president' ? 'president' : user?.role === 'faculty' ? 'faculty' : 'admin',
    issuedByName: user?.name || ''
  });
  
  // Multi-Student Ticking Selection State
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [yearFilter, setYearFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [quickRollInput, setQuickRollInput] = useState('');
  const [isIssuing, setIsIssuing] = useState(false);

  // Authorized to issue: Admin, Faculty Coordinator, President, or Vice-President
  const canIssue = user && ['admin', 'faculty', 'president', 'vice-president'].includes(user.role);

  const fetchCertificatesData = async () => {
    setLoading(true);
    try {
      if (user) {
        const myRes = await axios.get('/api/certificates/my-certificates', { withCredentials: true });
        setMyCertificates(Array.isArray(myRes.data) ? myRes.data : []);
      }

      if (canIssue) {
        const [allRes, tourneyRes, usersRes] = await Promise.all([
          axios.get('/api/certificates', { withCredentials: true }),
          axios.get('/api/tournaments'),
          axios.get('/api/auth/users', { withCredentials: true })
        ]);
        setAllCertificates(Array.isArray(allRes.data) ? allRes.data : []);
        setTournaments(Array.isArray(tourneyRes.data) ? tourneyRes.data : []);
        setUsers(Array.isArray(usersRes.data) ? usersRes.data : (Array.isArray(usersRes.data?.users) ? usersRes.data.users : []));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificatesData();
  }, [user]);

  useEffect(() => {
    if (user) {
      setIssueForm(prev => ({
        ...prev,
        issuedByRole: user.role === 'president' ? 'president' : user.role === 'faculty' ? 'faculty' : 'admin',
        issuedByName: user.name || ''
      }));
    }
  }, [user]);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyHash.trim()) return toast.error('Enter a verification hash');
    setVerifying(true);
    setVerifiedCert(null);
    try {
      const res = await axios.get(`/api/certificates/verify/${verifyHash.trim()}`);
      if (res.data.valid) {
        setVerifiedCert(res.data.certificate);
        toast.success('Certificate verified authentic! ✓');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Certificate not found or invalid');
    } finally {
      setVerifying(false);
    }
  };

  // Toggle selection for a single student checkbox
  const toggleStudentSelection = (studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };

  // Extract unique courses/departments from student users
  const uniqueCourses = Array.from(
    new Set(users.filter(u => u.role === 'student' && u.department).map(u => u.department))
  ).filter(Boolean);

  // Filter students based on search, course/department, and year
  const filteredStudents = users.filter(u => {
    if (u.role !== 'student') return false;
    const searchLower = studentSearch.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      (u.name && u.name.toLowerCase().includes(searchLower)) ||
      (u.email && u.email.toLowerCase().includes(searchLower)) ||
      (u.roll_no && u.roll_no.toLowerCase().includes(searchLower)) ||
      (u.department && u.department.toLowerCase().includes(searchLower));
    const matchesYear = yearFilter === 'all' || String(u.year) === String(yearFilter);
    const matchesDept = departmentFilter === 'all' || u.department === departmentFilter;
    return matchesSearch && matchesYear && matchesDept;
  });

  const handleSelectAllFiltered = () => {
    const ids = filteredStudents.map(s => s._id);
    setSelectedStudentIds(prev => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelection = () => {
    setSelectedStudentIds([]);
  };

  // Quick match & tick students by Roll Numbers entered/pasted from ID cards
  const handleApplyQuickRollNumbers = () => {
    if (!quickRollInput.trim()) return;
    const entered = quickRollInput
      .split(/[\s,;\n]+/)
      .map(r => r.trim().toLowerCase())
      .filter(Boolean);

    const matchedStudents = users.filter(u => 
      u.role === 'student' && u.roll_no && entered.includes(u.roll_no.toLowerCase())
    );

    if (matchedStudents.length === 0) {
      toast.error('No students found matching the entered Roll Numbers.');
      return;
    }

    const matchedIds = matchedStudents.map(u => u._id);
    setSelectedStudentIds(prev => Array.from(new Set([...prev, ...matchedIds])));
    toast.success(`Successfully ticked ${matchedIds.length} students matching roll numbers!`);
    setQuickRollInput('');
  };

  const handleIssueCertificates = async (e) => {
    e.preventDefault();
    
    if (selectedStudentIds.length === 0) {
      return toast.error('Please tick at least one student to issue certificates.');
    }

    const titleToUse = issueMode === 'tournament'
      ? (tournaments.find(t => t._id === issueForm.tournamentId)?.name || 'Tournament Championship')
      : (issueForm.title.trim() || `${issueForm.teamName || 'Sports'} Match Championship`);

    if (issueMode === 'tournament' && !issueForm.tournamentId) {
      return toast.error('Please select a tournament from the list.');
    }

    if (issueMode === 'match' && !issueForm.title.trim() && !issueForm.teamName.trim()) {
      return toast.error('Please provide a match name (e.g. Soccer Match) or team/class name (e.g. BTech 23 A).');
    }

    setIsIssuing(true);
    try {
      const payload = {
        title: titleToUse,
        tournamentId: issueMode === 'tournament' ? issueForm.tournamentId : null,
        teamName: issueForm.teamName,
        type: issueForm.type,
        studentIds: selectedStudentIds,
        issuedByRole: issueForm.issuedByRole,
        issuedByName: issueForm.issuedByName
      };

      const res = await axios.post('/api/certificates/generate', payload, { withCredentials: true });

      toast.success(res.data.message || `Successfully generated and issued certificates to ${selectedStudentIds.length} students!`);
      
      // Reset form
      setSelectedStudentIds([]);
      setIssueForm(prev => ({
        ...prev,
        title: '',
        teamName: '',
        tournamentId: ''
      }));

      // Refresh list
      fetchCertificatesData();
      setActiveTab('all');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to generate certificates');
    } finally {
      setIsIssuing(false);
    }
  };

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'winner':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'runner-up':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      case 'third-place':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-purple-100 text-purple-800 border-purple-300';
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto font-sans pb-24">
      {/* Header Banner */}
      <div className="mb-8 p-8 md:p-10 rounded-3xl bg-gradient-to-r from-teal-700 via-teal-600 to-emerald-700 text-white relative overflow-hidden shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-100 font-bold text-xs uppercase tracking-wider mb-3 border border-white/20">
              <Award size={14} className="text-teal-200" /> Official Academic & Sports Credentials
            </div>
            <h1 className="text-3xl md:text-5xl font-black mb-2 tracking-tight">
              Certificates & Merit Awards
            </h1>
            <p className="text-teal-100 font-medium text-sm md:text-base max-w-2xl">
              Sanctioned by Club Presidents, Faculty Coordinators, and Administrators. Authenticated with cryptographic hash codes and delivered directly to student profiles.
            </p>
          </div>

          {canIssue && (
            <button
              onClick={() => setActiveTab('issue')}
              className="flex items-center gap-2 px-6 py-3.5 bg-white text-teal-700 hover:bg-teal-50 font-bold rounded-2xl shadow-md transition-all hover:scale-105 cursor-pointer"
            >
              <Plus size={18} />
              <span>Issue New Certificates</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-2xl mb-8 gap-1.5">
        <button
          onClick={() => setActiveTab('my')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'my'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Award size={16} /> My Certificates ({myCertificates.length})
        </button>

        <button
          onClick={() => setActiveTab('verify')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
            activeTab === 'verify'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <ShieldCheck size={16} /> Verify Authenticity
        </button>

        {canIssue && (
          <>
            <button
              onClick={() => setActiveTab('issue')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'issue'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Plus size={16} /> Issue Certificate (Tick Students)
            </button>

            <button
              onClick={() => setActiveTab('all')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <FileText size={16} /> All Issued Certificates ({allCertificates.length})
            </button>
          </>
        )}
      </div>

      {/* TAB 1: MY CERTIFICATES */}
      {activeTab === 'my' && (
        <div>
          {loading ? (
            <div className="flex justify-center p-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
          ) : myCertificates.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myCertificates.map((cert) => (
                <motion.div
                  key={cert._id}
                  whileHover={{ y: -4 }}
                  className="bg-white rounded-[32px] p-7 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-all"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center font-black">
                        <Award size={26} />
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getBadgeStyle(cert.type)}`}>
                        {cert.type}
                      </span>
                    </div>

                    <h3 className="text-xl font-black text-gray-900 mb-2 leading-snug">
                      {cert.title || cert.tournamentId?.name || 'Tournament Championship'}
                    </h3>
                    
                    {cert.teamName && (
                      <p className="text-xs font-bold text-primary-600 bg-primary-50 px-2.5 py-1 rounded-lg inline-block mb-3">
                        Team/Class: {cert.teamName}
                      </p>
                    )}

                    <p className="text-xs font-semibold text-gray-400 mb-4 flex items-center gap-1.5">
                      <Calendar size={14} /> Issued on {new Date(cert.issueDate).toLocaleDateString()}
                    </p>

                    {cert.issuedByName && (
                      <p className="text-xs font-medium text-gray-500 mb-4 flex items-center gap-1.5">
                        <Shield size={14} className="text-primary-500" /> Authorized by {cert.issuedByRole ? cert.issuedByRole.toUpperCase() : 'OFFICIAL'} {cert.issuedByName}
                      </p>
                    )}

                    <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 mb-6">
                      <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                        Verification Hash
                      </div>
                      <div className="font-mono font-black text-xs text-primary-600 select-all">
                        {cert.verificationHash}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2.5 mt-2">
                    <button
                      onClick={() => setSelectedCertForPreview({
                        ...cert,
                        userName: cert.userId?.name || user?.name || 'Student Athlete',
                        tournamentName: cert.title || cert.tournamentId?.name || 'Tournament Championship'
                      })}
                      className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-2xl font-black text-sm shadow-soft-purple transition-all hover:-translate-y-0.5"
                    >
                      <Eye size={17} /> View Certificate
                    </button>

                    <a
                      href={`/api/certificates/${cert._id}/download`}
                      download={`Certificate-${(cert.userId?.name || user?.name || 'Student').replace(/\s+/g, '_')}.pdf`}
                      className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 py-3 rounded-2xl font-bold text-sm transition-all"
                    >
                      <Download size={16} /> Download PDF
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-[32px] p-16 text-center border border-gray-100 shadow-sm">
              <Award size={56} className="mx-auto text-primary-500 mb-4 animate-bounce" style={{ animationDuration: '3s' }} />
              <h3 className="text-2xl font-black text-gray-900 mb-2">No Certificates Yet</h3>
              <p className="text-gray-500 text-sm max-w-md mx-auto mb-6">
                When you win or participate in soccer matches, tournaments, or club events, the Admin, Faculty, or Club President will issue your certificate directly to your profile.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VERIFY AUTHENTICITY */}
      {activeTab === 'verify' && (
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 mb-8">
            <h2 className="text-2xl font-black text-gray-900 mb-2 flex items-center gap-2">
              <ShieldCheck className="text-primary-600" /> Verify Official Certificate
            </h2>
            <p className="text-gray-500 text-sm mb-6 font-medium">
              Validate authenticity using the cryptographic hash stamped on any official certificate.
            </p>

            <form onSubmit={handleVerify} className="flex gap-3">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Enter 16-character Verification Hash (e.g. 4F2A8B9C...)"
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl font-mono text-sm uppercase focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="px-6 py-3.5 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-sm shadow-soft-purple transition-all disabled:opacity-50"
              >
                {verifying ? 'Checking...' : 'Verify'}
              </button>
            </form>
          </div>

          {verifiedCert && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[32px] p-8 border-2 border-green-200 shadow-lg relative overflow-hidden"
            >
              <div className="flex items-center gap-3 text-green-600 font-black mb-6 text-lg">
                <CheckCircle2 size={24} /> Official Verified Certificate
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm font-semibold mb-6">
                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-xs text-gray-400 font-bold uppercase mb-1">Awarded To</div>
                  <div className="text-base font-black text-gray-900">{verifiedCert.userId?.name}</div>
                  <div className="text-xs text-gray-500">{verifiedCert.userId?.email}</div>
                  {verifiedCert.teamName && (
                    <div className="text-xs text-primary-600 font-bold mt-1">Class/Team: {verifiedCert.teamName}</div>
                  )}
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl">
                  <div className="text-xs text-gray-400 font-bold uppercase mb-1">Honors Type</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border ${getBadgeStyle(verifiedCert.type)}`}>
                    {verifiedCert.type}
                  </span>
                </div>

                <div className="p-4 bg-gray-50 rounded-2xl col-span-2">
                  <div className="text-xs text-gray-400 font-bold uppercase mb-1">Event / Championship</div>
                  <div className="text-base font-black text-primary-600">
                    {verifiedCert.title || verifiedCert.tournamentId?.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Issued Date: {new Date(verifiedCert.issueDate).toLocaleDateString()} • Authorized by {verifiedCert.issuedByRole?.toUpperCase() || 'OFFICIAL'} {verifiedCert.issuedByName || ''}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                <button
                  onClick={() => setSelectedCertForPreview({
                    ...verifiedCert,
                    userName: verifiedCert.userId?.name || 'Student Athlete',
                    tournamentName: verifiedCert.title || verifiedCert.tournamentId?.name || 'Championship'
                  })}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white py-3.5 rounded-2xl font-black text-sm shadow-soft-purple transition-all"
                >
                  <Eye size={17} /> View Certificate
                </button>

                <a
                  href={`/api/certificates/${verifiedCert._id}/download`}
                  download={`Certificate-${(verifiedCert.userId?.name || 'Student').replace(/\s+/g, '_')}.pdf`}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-900 hover:bg-black text-white py-3.5 rounded-2xl font-black text-sm transition-all"
                >
                  <Download size={17} /> Download Official PDF
                </a>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {/* TAB 3: ISSUE CERTIFICATES (TICK PARTICIPANTS / CLASS WINNERS) */}
      {activeTab === 'issue' && canIssue && (
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-6 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                  <Plus className="text-primary-600" /> Issue Official Certificates
                </h2>
                <p className="text-gray-500 text-sm mt-1 font-medium">
                  Select match/tournament details, pick the award type, and tick the winning students to distribute certificates directly to their profiles.
                </p>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl shrink-0">
                <button
                  type="button"
                  onClick={() => setIssueMode('match')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    issueMode === 'match' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Match / Class Event
                </button>
                <button
                  type="button"
                  onClick={() => setIssueMode('tournament')}
                  className={`px-4 py-2 rounded-lg text-xs font-black transition-all ${
                    issueMode === 'tournament' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500'
                  }`}
                >
                  Championship
                </button>
              </div>
            </div>

            <form onSubmit={handleIssueCertificates} className="space-y-6">
              {/* Event / Match & Team Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issueMode === 'tournament' ? (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Select Tournament</label>
                    <select
                      value={issueForm.tournamentId}
                      onChange={(e) => setIssueForm({ ...issueForm, tournamentId: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      required
                    >
                      <option value="">Select Tournament...</option>
                      {tournaments.map((t) => (
                        <option key={t._id} value={t._id}>{t.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Match / Event Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Inter-Class Soccer Championship"
                      value={issueForm.title}
                      onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Winning Class / Team Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Class BTech 23 A"
                    value={issueForm.teamName}
                    onChange={(e) => setIssueForm({ ...issueForm, teamName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Award Category & Signatory Authority */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Award Category</label>
                  <select
                    value={issueForm.type}
                    onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="winner">Winner 🏆</option>
                    <option value="runner-up">Runner-Up 🥈</option>
                    <option value="third-place">Third Place 🥉</option>
                    <option value="participation">Participation 📜</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Sanctioned By (Permission)</label>
                  <select
                    value={issueForm.issuedByRole}
                    onChange={(e) => setIssueForm({ ...issueForm, issuedByRole: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value="president">Club President</option>
                    <option value="vice-president">Club Vice-President</option>
                    <option value="faculty">Faculty Coordinator (Teacher)</option>
                    <option value="admin">Platform Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">Signatory Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. A. Sharma / Riya Dwivedi"
                    value={issueForm.issuedByName}
                    onChange={(e) => setIssueForm({ ...issueForm, issuedByName: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              {/* PARTICIPANT TICKING SECTION */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
                  <div>
                    <h3 className="font-black text-gray-900 text-base flex items-center gap-2">
                      <Users size={18} className="text-primary-600" /> Tick Student Participants
                    </h3>
                    <p className="text-xs text-gray-500">
                      Tick all the students from the team or class who won or took part.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="text-xs font-bold text-primary-600 hover:text-primary-700 px-3 py-1.5 bg-primary-50 rounded-lg transition-colors"
                    >
                      Select All Filtered ({filteredStudents.length})
                    </button>
                    {selectedStudentIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-xs font-bold text-red-600 hover:text-red-700 px-3 py-1.5 bg-red-50 rounded-lg transition-colors"
                      >
                        Clear Selection ({selectedStudentIds.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter & Search Bar with Course, Year, and Roll No */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-3">
                  <div className="sm:col-span-2 relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search by Roll Number (from ID card), Name, Course..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="all">All Courses / Branches</option>
                      {uniqueCourses.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={yearFilter}
                      onChange={(e) => setYearFilter(e.target.value)}
                      className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none"
                    >
                      <option value="all">All Academic Years</option>
                      <option value="1">Year 1</option>
                      <option value="2">Year 2</option>
                      <option value="3">Year 3</option>
                      <option value="4">Year 4</option>
                    </select>
                  </div>
                </div>

                {/* Quick Roll Numbers Paste / Entry Box */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 mb-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="text-xs font-bold text-gray-700 whitespace-nowrap flex items-center gap-1.5">
                    <Filter size={15} className="text-primary-600" />
                    <span>Quick Tick by ID Card Roll Nos:</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter/Paste roll numbers e.g. 23CS01, 23CS04, 23CS12"
                    value={quickRollInput}
                    onChange={(e) => setQuickRollInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleApplyQuickRollNumbers}
                    className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm whitespace-nowrap"
                  >
                    Tick Matching
                  </button>
                </div>

                {/* Scrollable Student Ticking Checklist */}
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-2xl bg-white p-2">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-gray-400 text-xs font-bold">
                      No students found matching course, year, or roll number.
                    </div>
                  ) : (
                    filteredStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student._id);
                      return (
                        <div
                          key={student._id}
                          onClick={() => toggleStudentSelection(student._id)}
                          className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-colors ${
                            isSelected ? 'bg-primary-50/70 border-l-4 border-l-primary-500' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-600 font-black text-xs flex items-center justify-center shrink-0">
                              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-gray-900 text-sm">{student.name}</span>
                                {student.roll_no && (
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-md font-mono text-[11px] font-bold">
                                    Roll: {student.roll_no}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 font-medium mt-0.5 flex items-center gap-2">
                                <span className="text-primary-600 font-semibold">{student.department || 'Course'}</span>
                                {student.year && <span>• Year {student.year}</span>}
                                <span className="text-gray-400 hidden sm:inline">• {student.email}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                              isSelected ? 'bg-primary-600 border-primary-600 text-white shadow-sm' : 'border-gray-300 bg-white'
                            }`}>
                              {isSelected && <Check size={14} className="stroke-[3]" />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected count badge */}
                <div className="mt-3 flex items-center justify-between text-xs font-bold text-gray-500">
                  <span>Selected: <strong className="text-primary-600 text-sm font-black">{selectedStudentIds.length}</strong> student participants</span>
                  {selectedStudentIds.length > 0 && (
                    <span className="text-green-600 flex items-center gap-1 font-bold">
                      <CheckCircle2 size={14} /> Ready to generate
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isIssuing || selectedStudentIds.length === 0}
                className="w-full py-4 bg-primary-600 hover:bg-primary-500 text-white rounded-2xl font-black text-sm shadow-soft-purple transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
              >
                {isIssuing ? (
                  <span>Generating {selectedStudentIds.length} Authenticated Certificates...</span>
                ) : (
                  <>
                    <Award size={18} />
                    <span>Generate & Issue Certificates to {selectedStudentIds.length} Students ⚡</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: ALL ISSUED CERTIFICATES (STAFF VIEW) */}
      {activeTab === 'all' && canIssue && (
        <div className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-black text-gray-900 text-xl flex items-center gap-2">
              <FileText size={22} className="text-primary-600" /> Platform Issued Certificates
            </h3>
            <span className="text-xs font-bold bg-primary-50 text-primary-700 px-3 py-1 rounded-full">
              Total {allCertificates.length} Records
            </span>
          </div>

          {allCertificates.length === 0 ? (
            <div className="bg-white rounded-[32px] p-12 text-center text-gray-400 font-bold border border-gray-100">
              No certificates have been issued yet. Click "Issue Certificate" to begin.
            </div>
          ) : (
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Recipient</th>
                      <th className="px-6 py-4">Event / Match</th>
                      <th className="px-6 py-4">Award Type</th>
                      <th className="px-6 py-4">Auth Hash</th>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 font-medium">
                    {allCertificates.map((cert) => (
                      <tr key={cert._id} className="hover:bg-gray-50/60 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-900">{cert.userId?.name || 'Student'}</div>
                          <div className="text-xs text-gray-400">{cert.userId?.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-gray-800">{cert.title || cert.tournamentId?.name || 'Championship'}</div>
                          {cert.teamName && (
                            <div className="text-xs text-primary-600 font-semibold">{cert.teamName}</div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider border ${getBadgeStyle(cert.type)}`}>
                            {cert.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-primary-600">
                          {cert.verificationHash}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(cert.issueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setSelectedCertForPreview({
                                ...cert,
                                userName: cert.userId?.name || 'Student Athlete',
                                tournamentName: cert.title || cert.tournamentId?.name || 'Championship'
                              })}
                              className="p-2 hover:bg-primary-50 text-primary-600 rounded-lg transition-colors"
                              title="Preview"
                            >
                              <Eye size={16} />
                            </button>
                            <a
                              href={`/api/certificates/${cert._id}/download`}
                              download={`Certificate-${(cert.userId?.name || 'Student').replace(/\s+/g, '_')}.pdf`}
                              className="p-2 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
                              title="Download PDF"
                            >
                              <Download size={16} />
                            </a>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal for certificate view and direct download */}
      {selectedCertForPreview && (
        <CertificateTemplate
          cert={selectedCertForPreview}
          onClose={() => setSelectedCertForPreview(null)}
        />
      )}
    </div>
  );
};

export default Certificates;
