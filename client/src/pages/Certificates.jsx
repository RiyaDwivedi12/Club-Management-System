import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Award, Download, ShieldCheck, CheckCircle2, Search, Plus, Calendar,
  Eye, FileText, Users, Filter, Check, Shield
} from 'lucide-react';
import toast from 'react-hot-toast';
import useAuthStore from '../store/authStore';
import CertificateTemplate from '../components/CertificateTemplate';
import PageHeader from '../components/ui/PageHeader';
import LoadingState from '../components/ui/LoadingState';
import EmptyState from '../components/EmptyState';

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
        setMyCertificates(myRes.data || []);
      }

      if (canIssue) {
        const [allRes, tourneyRes, usersRes] = await Promise.all([
          axios.get('/api/certificates', { withCredentials: true }),
          axios.get('/api/tournaments'),
          axios.get('/api/auth/users', { withCredentials: true })
        ]);
        setAllCertificates(allRes.data || []);
        setTournaments(tourneyRes.data || []);
        setUsers(usersRes.data || []);
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
        return 'badge-amber';
      case 'runner-up':
        return 'badge-slate';
      case 'third-place':
        return 'badge bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20';
      default:
        return 'badge-indigo';
    }
  };

  const tabClass = (key) => `tab flex items-center gap-2 ${activeTab === key ? 'tab-active' : ''}`;

  return (
    <div className="max-w-7xl mx-auto pb-24 space-y-6">
      {/* Header Banner */}
      <PageHeader
        variant="hero"
        eyebrow="Official Academic & Sports Credentials"
        eyebrowIcon={Award}
        icon={Award}
        title="Certificates & Merit Awards"
        description="Sanctioned by Club Presidents, Faculty Coordinators, and Administrators. Authenticated with cryptographic hash codes and delivered directly to student profiles."
        actions={canIssue && (
          <button
            onClick={() => setActiveTab('issue')}
            className="btn bg-white text-blue-700 hover:bg-blue-50 shadow-md w-full sm:w-auto"
          >
            <Plus size={18} />
            <span>Issue New Certificates</span>
          </button>
        )}
      />

      {/* Navigation Tabs */}
      <div className="card p-1.5 flex gap-1 overflow-x-auto hide-scrollbar">
        <button onClick={() => setActiveTab('my')} className={tabClass('my')}>
          <Award size={16} /> My Certificates ({myCertificates.length})
        </button>

        <button onClick={() => setActiveTab('verify')} className={tabClass('verify')}>
          <ShieldCheck size={16} /> Verify Authenticity
        </button>

        {canIssue && (
          <>
            <button onClick={() => setActiveTab('issue')} className={tabClass('issue')}>
              <Plus size={16} /> Issue Certificate (Tick Students)
            </button>

            <button onClick={() => setActiveTab('all')} className={tabClass('all')}>
              <FileText size={16} /> All Issued Certificates ({allCertificates.length})
            </button>
          </>
        )}
      </div>

      {/* TAB 1: MY CERTIFICATES */}
      {activeTab === 'my' && (
        <div>
          {loading ? (
            <LoadingState label="Loading certificates…" />
          ) : myCertificates.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {myCertificates.map((cert) => (
                <motion.div
                  key={cert._id}
                  whileHover={{ y: -4 }}
                  className="card p-5 sm:p-6 flex flex-col justify-between hover:border-blue-200 hover:shadow-card-hover transition-all min-w-0"
                >
                  <div className="min-w-0">
                    <div className="flex justify-between items-start gap-3 mb-4">
                      <div className="icon-tile bg-blue-50 text-blue-600">
                        <Award size={22} />
                      </div>
                      <span className={`capitalize ${getBadgeStyle(cert.type)}`}>
                        {cert.type}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-dark-900 mb-2 leading-snug break-words">
                      {cert.title || cert.tournamentId?.name || 'Tournament Championship'}
                    </h3>

                    {cert.teamName && (
                      <p className="badge-blue mb-3">
                        Team/Class: {cert.teamName}
                      </p>
                    )}

                    <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                      <Calendar size={14} className="text-slate-400" /> Issued on {new Date(cert.issueDate).toLocaleDateString()}
                    </p>

                    {cert.issuedByName && (
                      <p className="text-xs font-medium text-slate-500 mb-4 flex items-start gap-1.5">
                        <Shield size={14} className="text-blue-500 shrink-0 mt-px" />
                        <span>Authorized by <span className="capitalize">{cert.issuedByRole ? cert.issuedByRole : 'official'}</span> {cert.issuedByName}</span>
                      </p>
                    )}

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 mb-5">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                        Verification Hash
                      </div>
                      <div className="font-mono font-semibold text-xs text-blue-700 select-all break-all">
                        {cert.verificationHash}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedCertForPreview({
                        ...cert,
                        userName: cert.userId?.name || user?.name || 'Student Athlete',
                        tournamentName: cert.title || cert.tournamentId?.name || 'Tournament Championship'
                      })}
                      className="btn-primary w-full"
                    >
                      <Eye size={17} /> View Certificate
                    </button>

                    <a
                      href={`/api/certificates/${cert._id}/download`}
                      download={`Certificate-${(cert.userId?.name || user?.name || 'Student').replace(/\s+/g, '_')}.pdf`}
                      className="btn-secondary w-full"
                    >
                      <Download size={16} /> Download PDF
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="card">
              <EmptyState
                icon={Award}
                title="No Certificates Yet"
                description="When you win or participate in soccer matches, tournaments, or club events, the Admin, Faculty, or Club President will issue your certificate directly to your profile."
              />
            </div>
          )}
        </div>
      )}

      {/* TAB 2: VERIFY AUTHENTICITY */}
      {activeTab === 'verify' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="card p-5 sm:p-8">
            <div className="flex items-start gap-3.5 mb-5">
              <div className="icon-tile bg-emerald-50 text-emerald-600">
                <ShieldCheck size={22} />
              </div>
              <div className="min-w-0">
                <h2 className="section-title">Verify Official Certificate</h2>
                <p className="text-slate-500 text-sm mt-0.5">
                  Validate authenticity using the cryptographic hash stamped on any official certificate.
                </p>
              </div>
            </div>

            <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1 min-w-0">
                <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Enter 16-character Verification Hash (e.g. 4F2A8B9C...)"
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                  className="input input-icon font-mono uppercase"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={verifying}
                className="btn-primary w-full sm:w-auto"
              >
                {verifying ? 'Checking...' : 'Verify'}
              </button>
            </form>
          </div>

          {verifiedCert && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="card p-5 sm:p-8 border-emerald-200 ring-1 ring-emerald-100 relative overflow-hidden"
            >
              <div className="flex items-center gap-2.5 text-emerald-600 font-bold mb-5 text-lg">
                <CheckCircle2 size={24} /> Official Verified Certificate
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm mb-5">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 min-w-0">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Awarded To</div>
                  <div className="text-base font-bold text-dark-900 break-words">{verifiedCert.userId?.name}</div>
                  <div className="text-xs text-slate-500 break-all">{verifiedCert.userId?.email}</div>
                  {verifiedCert.teamName && (
                    <div className="text-xs text-blue-600 font-semibold mt-1">Class/Team: {verifiedCert.teamName}</div>
                  )}
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1.5">Honors Type</div>
                  <span className={`capitalize ${getBadgeStyle(verifiedCert.type)}`}>
                    {verifiedCert.type}
                  </span>
                </div>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2 min-w-0">
                  <div className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mb-1">Event / Championship</div>
                  <div className="text-base font-bold text-blue-700 break-words">
                    {verifiedCert.title || verifiedCert.tournamentId?.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Issued Date: {new Date(verifiedCert.issueDate).toLocaleDateString()} • Authorized by <span className="capitalize">{verifiedCert.issuedByRole || 'official'}</span> {verifiedCert.issuedByName || ''}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setSelectedCertForPreview({
                    ...verifiedCert,
                    userName: verifiedCert.userId?.name || 'Student Athlete',
                    tournamentName: verifiedCert.title || verifiedCert.tournamentId?.name || 'Championship'
                  })}
                  className="btn-primary flex-1"
                >
                  <Eye size={17} /> View Certificate
                </button>

                <a
                  href={`/api/certificates/${verifiedCert._id}/download`}
                  download={`Certificate-${(verifiedCert.userId?.name || 'Student').replace(/\s+/g, '_')}.pdf`}
                  className="btn-secondary flex-1"
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
          <div className="card overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="icon-tile bg-blue-50 text-blue-600">
                  <Plus size={22} />
                </div>
                <div className="min-w-0">
                  <h2 className="section-title">Issue Official Certificates</h2>
                  <p className="text-slate-500 text-sm mt-0.5">
                    Select match/tournament details, pick the award type, and tick the winning students to distribute certificates directly to their profiles.
                  </p>
                </div>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-xl shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setIssueMode('match')}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    issueMode === 'match' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-dark-900'
                  }`}
                >
                  Match / Class Event
                </button>
                <button
                  type="button"
                  onClick={() => setIssueMode('tournament')}
                  className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    issueMode === 'tournament' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-dark-900'
                  }`}
                >
                  Championship
                </button>
              </div>
            </div>

            <form onSubmit={handleIssueCertificates} className="p-5 sm:p-6 space-y-6">
              {/* Event / Match & Team Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {issueMode === 'tournament' ? (
                  <div>
                    <label className="label">Select Tournament</label>
                    <select
                      value={issueForm.tournamentId}
                      onChange={(e) => setIssueForm({ ...issueForm, tournamentId: e.target.value })}
                      className="input"
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
                    <label className="label">Match / Event Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Inter-Class Soccer Championship"
                      value={issueForm.title}
                      onChange={(e) => setIssueForm({ ...issueForm, title: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="label">Winning Class / Team Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Class BTech 23 A"
                    value={issueForm.teamName}
                    onChange={(e) => setIssueForm({ ...issueForm, teamName: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Award Category & Signatory Authority */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="label">Award Category</label>
                  <select
                    value={issueForm.type}
                    onChange={(e) => setIssueForm({ ...issueForm, type: e.target.value })}
                    className="input"
                  >
                    <option value="winner">Winner 🏆</option>
                    <option value="runner-up">Runner-Up 🥈</option>
                    <option value="third-place">Third Place 🥉</option>
                    <option value="participation">Participation 📜</option>
                  </select>
                </div>

                <div>
                  <label className="label">Sanctioned By (Permission)</label>
                  <select
                    value={issueForm.issuedByRole}
                    onChange={(e) => setIssueForm({ ...issueForm, issuedByRole: e.target.value })}
                    className="input"
                  >
                    <option value="president">Club President</option>
                    <option value="vice-president">Club Vice-President</option>
                    <option value="faculty">Faculty Coordinator (Teacher)</option>
                    <option value="admin">Platform Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="label">Signatory Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. A. Sharma / Riya Dwivedi"
                    value={issueForm.issuedByName}
                    onChange={(e) => setIssueForm({ ...issueForm, issuedByName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
              </div>

              {/* PARTICIPANT TICKING SECTION */}
              <div className="pt-5 border-t border-slate-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <div className="min-w-0">
                    <h3 className="font-bold text-dark-900 flex items-center gap-2">
                      <Users size={18} className="text-blue-600" /> Tick Student Participants
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tick all the students from the team or class who won or took part.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllFiltered}
                      className="btn-soft btn-sm"
                    >
                      Select All Filtered ({filteredStudents.length})
                    </button>
                    {selectedStudentIds.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        Clear Selection ({selectedStudentIds.length})
                      </button>
                    )}
                  </div>
                </div>

                {/* Filter & Search Bar with Course, Year, and Roll No */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <div className="sm:col-span-2 relative">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search by Roll Number (from ID card), Name, Course..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      className="input input-icon"
                    />
                  </div>

                  <div>
                    <select
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="input"
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
                      className="input"
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
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4 flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                  <div className="text-xs font-semibold text-slate-700 whitespace-nowrap flex items-center gap-1.5">
                    <Filter size={15} className="text-blue-600" />
                    <span>Quick Tick by ID Card Roll Nos:</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Enter/Paste roll numbers e.g. 23CS01, 23CS04, 23CS12"
                    value={quickRollInput}
                    onChange={(e) => setQuickRollInput(e.target.value)}
                    className="input flex-1 min-w-0 py-2 font-mono text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleApplyQuickRollNumbers}
                    className="btn-primary"
                  >
                    Tick Matching
                  </button>
                </div>

                {/* Scrollable Student Ticking Checklist */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 border border-slate-200 rounded-xl bg-white p-1.5">
                  {filteredStudents.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-sm font-medium">
                      No students found matching course, year, or roll number.
                    </div>
                  ) : (
                    filteredStudents.map((student) => {
                      const isSelected = selectedStudentIds.includes(student._id);
                      return (
                        <div
                          key={student._id}
                          onClick={() => toggleStudentSelection(student._id)}
                          className={`flex items-center justify-between gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50 shadow-[inset_3px_0_0_0_#2563eb]' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-dark-900 text-sm break-words">{student.name}</span>
                                {student.roll_no && (
                                  <span className="badge-blue font-mono">
                                    Roll: {student.roll_no}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 min-w-0">
                                <span className="text-blue-600 font-semibold truncate">{student.department || 'Course'}</span>
                                {student.year && <span className="shrink-0">• Year {student.year}</span>}
                                <span className="text-slate-400 hidden sm:inline truncate">• {student.email}</span>
                              </div>
                            </div>
                          </div>

                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all shrink-0 ${
                            isSelected ? 'bg-blue-600 border-blue-600 text-white shadow-sm' : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check size={14} className="stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Selected count badge */}
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-slate-500">
                  <span>Selected: <strong className="text-blue-600 text-sm font-bold">{selectedStudentIds.length}</strong> student participants</span>
                  {selectedStudentIds.length > 0 && (
                    <span className="text-emerald-600 flex items-center gap-1 font-semibold">
                      <CheckCircle2 size={14} /> Ready to generate
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isIssuing || selectedStudentIds.length === 0}
                className="btn-primary btn-lg w-full whitespace-normal text-center"
              >
                {isIssuing ? (
                  <span>Generating {selectedStudentIds.length} Authenticated Certificates...</span>
                ) : (
                  <>
                    <Award size={18} className="shrink-0" />
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
        <div className="card overflow-hidden">
          <div className="card-header">
            <h3 className="card-title flex items-center gap-2">
              <FileText size={20} className="text-blue-600" /> Platform Issued Certificates
            </h3>
            <span className="badge-blue">
              Total {allCertificates.length} Records
            </span>
          </div>

          {allCertificates.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No certificates issued yet"
              description='No certificates have been issued yet. Click "Issue Certificate" to begin.'
            />
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Recipient</th>
                    <th>Event / Match</th>
                    <th>Award Type</th>
                    <th>Auth Hash</th>
                    <th>Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {allCertificates.map((cert) => (
                    <tr key={cert._id}>
                      <td>
                        <div className="font-semibold text-dark-900">{cert.userId?.name || 'Student'}</div>
                        <div className="text-xs text-slate-400">{cert.userId?.email}</div>
                      </td>
                      <td>
                        <div className="font-semibold text-slate-800">{cert.title || cert.tournamentId?.name || 'Championship'}</div>
                        {cert.teamName && (
                          <div className="text-xs text-blue-600 font-medium">{cert.teamName}</div>
                        )}
                      </td>
                      <td>
                        <span className={`capitalize whitespace-nowrap ${getBadgeStyle(cert.type)}`}>
                          {cert.type}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-blue-700">
                        {cert.verificationHash}
                      </td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">
                        {new Date(cert.issueDate).toLocaleDateString()}
                      </td>
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedCertForPreview({
                              ...cert,
                              userName: cert.userId?.name || 'Student Athlete',
                              tournamentName: cert.title || cert.tournamentId?.name || 'Championship'
                            })}
                            className="btn-icon hover:bg-blue-50 hover:text-blue-600"
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <a
                            href={`/api/certificates/${cert._id}/download`}
                            download={`Certificate-${(cert.userId?.name || 'Student').replace(/\s+/g, '_')}.pdf`}
                            className="btn-icon"
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
