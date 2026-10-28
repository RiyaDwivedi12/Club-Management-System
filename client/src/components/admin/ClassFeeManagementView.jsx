import { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Building2, Plus, Download, FileText, Search, CheckCircle2, Clock, AlertCircle,
  Users, DollarSign, Wallet, ShieldCheck, ArrowRight, Eye, Trash2, X, UploadCloud,
  FileSpreadsheet, Filter, RefreshCw, ExternalLink, ChevronRight, CheckSquare,
  Square, CreditCard, BookOpen, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../ui/PageHeader';
import StatTile from '../ui/StatTile';
import LoadingState from '../ui/LoadingState';
import EmptyState from '../EmptyState';

const ClassFeeManagementView = ({ clubs = [] }) => {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [offlineDocs, setOfflineDocs] = useState([]);
  const [overallKPI, setOverallKPI] = useState(null);

  // Filters
  const [selectedDept, setSelectedDept] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedClassModal, setSelectedClassModal] = useState(null);
  const [showAddDeptModal, setShowAddDeptModal] = useState(false);
  const [showAddClassModal, setShowAddClassModal] = useState(false);
  const [showUploadPdfModal, setShowUploadPdfModal] = useState(false);
  const [offlinePaymentStudent, setOfflinePaymentStudent] = useState(null);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // In-App Document / Spreadsheet Viewer modal state
  const [viewingDoc, setViewingDoc] = useState(null);
  const [docViewerData, setDocViewerData] = useState(null);
  const [docViewerLoading, setDocViewerLoading] = useState(false);
  const [docSearchQuery, setDocSearchQuery] = useState('');
  const [docDeptFilter, setDocDeptFilter] = useState('All');

  // Class drill-down student selection for batch actions
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentFilter, setStudentFilter] = useState('all'); // all, paid, pending, online, offline
  const [studentSearch, setStudentSearch] = useState('');

  // Form states
  const [deptForm, setDeptForm] = useState({ name: '', code: '', description: '', color: 'from-blue-600 to-indigo-700' });
  const [classForm, setClassForm] = useState({
    name: '',
    department: 'Engineering',
    course: 'B.Tech',
    year: 1,
    section: 'A',
    standardFee: 500,
    academicYear: '2025-2026'
  });
  const [singlePaymentForm, setSinglePaymentForm] = useState({
    amount: 500,
    paymentMethod: 'Offline / Cash',
    paymentType: 'Annual Membership Fee',
    clubId: '',
    offlineDocId: '',
    notes: '',
    receiptNumber: ''
  });
  const [batchPaymentForm, setBatchPaymentForm] = useState({
    amount: 500,
    paymentMethod: 'Offline / Cash',
    paymentType: 'Annual Membership Fee',
    clubId: '',
    offlineDocId: '',
    notes: ''
  });

  // PDF Upload state
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadNotes, setUploadNotes] = useState('');
  const [uploadDept, setUploadDept] = useState('All');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Fetch Class Fee and Department Data
  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/class-fees/classes', { withCredentials: true });
      setClasses(res.data.classes || []);
      setDepartments(res.data.departments || []);
      setOfflineDocs(res.data.offlineDocs || []);
      setOverallKPI(res.data.overallKPI || null);

      // If a class modal is currently open, refresh its data
      if (selectedClassModal) {
        const updated = (res.data.classes || []).find(c => c._id === selectedClassModal._id);
        if (updated) setSelectedClassModal(updated);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch class and department data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update default department in class form when departments change
  useEffect(() => {
    if (departments.length > 0 && !departments.some(d => d.name === classForm.department)) {
      setClassForm(prev => ({ ...prev, department: departments[0].name }));
    }
  }, [departments]);

  // Filtered Classes
  const filteredClasses = useMemo(() => {
    return classes.filter(cls => {
      const matchesDept = selectedDept === 'All' || cls.department?.toLowerCase() === selectedDept.toLowerCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        cls.name?.toLowerCase().includes(q) || 
        cls.course?.toLowerCase().includes(q) ||
        cls.department?.toLowerCase().includes(q);
      return matchesDept && matchesSearch;
    });
  }, [classes, selectedDept, searchQuery]);

  // Filtered Students inside Selected Class Modal
  const modalStudents = useMemo(() => {
    if (!selectedClassModal?.students) return [];
    return selectedClassModal.students.filter(student => {
      // Status filter
      if (studentFilter === 'paid' && student.paymentStatus !== 'Paid') return false;
      if (studentFilter === 'pending' && student.paymentStatus === 'Paid') return false;
      if (studentFilter === 'online' && student.paymentMode !== 'Online') return false;
      if (studentFilter === 'offline' && student.paymentMode !== 'Offline') return false;

      // Search query
      const q = studentSearch.toLowerCase().trim();
      if (q) {
        const matchesName = student.name?.toLowerCase().includes(q);
        const matchesRoll = student.roll_no?.toLowerCase().includes(q);
        const matchesEmail = student.email?.toLowerCase().includes(q);
        return matchesName || matchesRoll || matchesEmail;
      }
      return true;
    });
  }, [selectedClassModal, studentFilter, studentSearch]);

  // Handlers for Department Creation
  const handleCreateDepartment = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/class-fees/departments', deptForm, { withCredentials: true });
      toast.success(`Department '${deptForm.name}' created successfully!`);
      setDeptForm({ name: '', code: '', description: '', color: 'from-blue-600 to-indigo-700' });
      setShowAddDeptModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create department');
    }
  };

  // Handlers for Class Card Creation
  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...classForm,
        name: classForm.name.trim() || `${classForm.course} - Year ${classForm.year} (Sec ${classForm.section})`
      };
      await axios.post('/api/class-fees/classes', payload, { withCredentials: true });
      toast.success(`Class card '${payload.name}' created successfully!`);
      setClassForm({
        name: '',
        department: departments[0]?.name || 'Engineering',
        course: 'B.Tech',
        year: 1,
        section: 'A',
        standardFee: 500,
        academicYear: '2025-2026'
      });
      setShowAddClassModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create class');
    }
  };

  // Delete Class Card
  const handleDeleteClass = async (classId, className, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the class card for '${className}'?`)) return;
    try {
      await axios.delete(`/api/class-fees/classes/${classId}`, { withCredentials: true });
      toast.success(`Class card '${className}' deleted`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete class');
    }
  };

  // Open Record Offline Payment Modal for a single student
  const openSinglePaymentModal = (student) => {
    setOfflinePaymentStudent(student);
    setSinglePaymentForm({
      amount: selectedClassModal?.standardFee || 500,
      paymentMethod: 'Offline / Cash',
      paymentType: 'Annual Membership Fee',
      clubId: clubs[0]?._id || '',
      offlineDocId: offlineDocs[0]?._id || '',
      notes: `Offline payment verified for ${student.name} (${student.roll_no || 'N/A'})`,
      receiptNumber: `OFF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`
    });
  };

  // Submit Single Offline Payment
  const handleRecordSinglePayment = async (e) => {
    e.preventDefault();
    if (!offlinePaymentStudent) return;

    try {
      await axios.post('/api/class-fees/offline-payment', {
        studentId: offlinePaymentStudent._id,
        classId: selectedClassModal?._id,
        ...singlePaymentForm
      }, { withCredentials: true });

      toast.success(`Payment of ₹${singlePaymentForm.amount} recorded for ${offlinePaymentStudent.name}!`);
      setOfflinePaymentStudent(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record offline payment');
    }
  };

  // Submit Batch Offline Payment
  const handleBatchPayment = async (e) => {
    e.preventDefault();
    if (selectedStudentIds.length === 0) return;

    try {
      await axios.post('/api/class-fees/batch-offline-payment', {
        studentIds: selectedStudentIds,
        classId: selectedClassModal?._id,
        ...batchPaymentForm
      }, { withCredentials: true });

      toast.success(`Verified and recorded offline payments for ${selectedStudentIds.length} students!`);
      setSelectedStudentIds([]);
      setShowBatchModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record batch payments');
    }
  };

  // Revert Payment
  const handleRevertPayment = async (studentId, studentName) => {
    if (!window.confirm(`Revert payment status for ${studentName} back to Pending?`)) return;
    try {
      await axios.post('/api/class-fees/revert-payment', { studentId }, { withCredentials: true });
      toast.success(`Payment reverted for ${studentName}`);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to revert payment');
    }
  };

  // Process and map classes from an uploaded Excel/CSV file
  const handleRunAiSegregate = async (docId, fileName) => {
    try {
      const toastId = toast.loading(`Categorizing classes from '${fileName}'...`);
      const res = await axios.post(`/api/class-fees/documents/${docId}/ai-segregate`, {}, { withCredentials: true });
      toast.dismiss(toastId);
      toast.success(res.data.message || 'Classes categorized successfully!');
      if (res.data.aiSummary) {
        toast.success(
          `Categorized: ${res.data.aiSummary.studentsCreatedOrUpdated} students into ${res.data.aiSummary.classesCreated} class cards!`,
          { duration: 7000 }
        );
      }
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to categorize classes');
    }
  };

  // Open Document / Spreadsheet in the in-app interactive viewer
  const handleOpenDocViewer = async (doc) => {
    if (!doc) return;
    setViewingDoc(doc);
    setDocViewerLoading(true);
    setDocViewerData(null);
    setDocSearchQuery('');
    setDocDeptFilter('All');
    try {
      const res = await axios.get(`/api/class-fees/documents/${doc._id}/preview`, { withCredentials: true });
      setDocViewerData(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load document preview');
    } finally {
      setDocViewerLoading(false);
    }
  };

  // Filtered rows inside Document Spreadsheet Viewer
  const filteredDocRows = useMemo(() => {
    if (!docViewerData?.rows) return [];
    return docViewerData.rows.filter(row => {
      // Department filter
      if (docDeptFilter !== 'All') {
        const rowDept = Object.entries(row).find(([k]) => ['department', 'dept', 'branch'].includes(k.toLowerCase().replace(/[^a-z]/g, '')))?.[1] || '';
        if (String(rowDept).toLowerCase() !== docDeptFilter.toLowerCase()) return false;
      }

      // Search query across all cell values
      if (docSearchQuery.trim()) {
        const q = docSearchQuery.toLowerCase().trim();
        const matches = Object.values(row).some(val => String(val).toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [docViewerData, docDeptFilter, docSearchQuery]);

  // Handle Offline Payment PDF / Excel Upload
  const handleUploadPdf = async (e) => {
    e.preventDefault();
    if (!uploadFile) return toast.error('Please select an Excel, CSV, or PDF document first');

    setUploading(true);
    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('notes', uploadNotes);
    formData.append('department', uploadDept);
    if (selectedClassModal) {
      formData.append('classId', selectedClassModal._id);
    }

    try {
      const res = await axios.post('/api/class-fees/upload-doc', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      toast.success(res.data.message || 'Document uploaded successfully!');
      if (res.data.aiSummary) {
        toast.success(
          `Categorized: ${res.data.aiSummary.studentsCreatedOrUpdated} students mapped into ${res.data.aiSummary.classesCreated} class cards!`,
          { duration: 7000 }
        );
      }
      setUploadFile(null);
      setUploadNotes('');
      setShowUploadPdfModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  // Toggle multi-select of students
  const toggleStudentSelect = (studentId) => {
    setSelectedStudentIds(prev => 
      prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]
    );
  };

  const selectAllPendingStudents = () => {
    const pendingIds = modalStudents.filter(s => s.paymentStatus !== 'Paid').map(s => s._id);
    if (selectedStudentIds.length === pendingIds.length && pendingIds.length > 0) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(pendingIds);
    }
  };

  // Trigger Excel & PDF Exports
  const handleExportAllExcel = () => {
    window.open('/api/class-fees/export/excel', '_blank');
  };

  const handleExportAllPdf = () => {
    window.open('/api/class-fees/export/pdf', '_blank');
  };

  const handleExportClassPdf = (classId) => {
    window.open(`/api/class-fees/classes/${classId}/export/pdf`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* ── TOP HEADER & ACTIONS ────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <div className="icon-tile bg-blue-50 text-blue-600">
          <Building2 size={20} />
        </div>
        <div className="min-w-0">
          <h2 className="section-title">Department & Class Fee Management</h2>
          <p className="text-sm text-slate-500 mt-0.5">Create departments & class cards, monitor online/offline collections, upload offline PDFs, and export official receipts.</p>
        </div>
      </div>

      {/* Global Action Buttons */}
      <div className="card p-3 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2">
        <button
          onClick={() => setShowAddClassModal(true)}
          className="btn-primary"
        >
          <Plus size={16} />
          <span>Create Class Card</span>
        </button>

        <button
          onClick={() => setShowAddDeptModal(true)}
          className="btn-secondary"
        >
          <Plus size={16} />
          <span>New Department</span>
        </button>

        <button
          onClick={() => setShowUploadPdfModal(true)}
          className="btn-soft"
        >
          <UploadCloud size={16} />
          <span>Upload Document / Sheet</span>
        </button>

        <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

        <div className="grid grid-cols-2 sm:flex gap-2">
          <button
            onClick={handleExportAllExcel}
            title="Download Class Breakdown Excel"
            className="btn-ghost"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportAllPdf}
            title="Download Institutional PDF Receipt Report"
            className="btn-ghost"
          >
            <Download size={16} className="text-blue-600" />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* ── KPI TILES ───────────────────────────────────────────────────────── */}
      {overallKPI && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <StatTile
            icon={DollarSign}
            tint="blue"
            label="Total Net Revenue"
            value={`₹${overallKPI.totalNetRevenue?.toLocaleString('en-IN')}`}
            hint={`${overallKPI.overallCollectionRate}% collected • ${overallKPI.totalPaid} / ${overallKPI.totalStudents} Paid`}
          />
          <StatTile
            icon={Layers}
            tint="indigo"
            label="Configured Classes"
            value={`${overallKPI.totalClasses} Classes`}
            hint={`Across ${departments.length} Departments • ${overallKPI.totalStudents} Enrolled`}
          />
          <StatTile
            icon={FileText}
            tint="violet"
            label="Offline Receipts"
            value={`₹${overallKPI.offlineRevenue?.toLocaleString('en-IN')}`}
            hint={`Verified Cash & Challans • ${overallKPI.totalOfflinePaidStudents} Students`}
          />
          <StatTile
            icon={Clock}
            tint="amber"
            label="Pending Fee Dues"
            value={`₹${overallKPI.totalPendingDues?.toLocaleString('en-IN')}`}
            hint={`Awaiting Verification • ${overallKPI.totalPendingStudents} Unpaid`}
          />
        </div>
      )}

      {/* ── DEPARTMENT FILTER BAR & SEARCH ──────────────────────────────────── */}
      <div className="card p-3 sm:p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar w-full lg:w-auto min-w-0">
          <button
            onClick={() => setSelectedDept('All')}
            className={`tab shrink-0 ${selectedDept === 'All' ? 'tab-active' : ''}`}
          >
            All Departments ({classes.length})
          </button>
          {departments.map((dept) => {
            const count = classes.filter(c => c.department?.toLowerCase() === dept.name?.toLowerCase()).length;
            const isSelected = selectedDept.toLowerCase() === dept.name?.toLowerCase();
            return (
              <button
                key={dept._id}
                onClick={() => setSelectedDept(dept.name)}
                className={`tab shrink-0 inline-flex items-center gap-1.5 ${isSelected ? 'tab-active' : ''}`}
              >
                <span>{dept.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search class, course, year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input input-icon pr-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── RECENT UPLOADED OFFLINE PDF DOCUMENTS QUICK BAR ─────────────────── */}
      {offlineDocs.length > 0 && (
        <div className="card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="icon-tile bg-violet-50 text-violet-600">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-dark-900 break-words">
                Latest Uploaded Offline Payment List: <span className="font-mono text-blue-700 break-all">{offlineDocs[0].originalName}</span>
              </p>
              <p className="text-xs text-slate-500 mt-0.5 break-words">
                {offlineDocs[0].notes || 'Administrative offline deposit slip'} • Uploaded by {offlineDocs[0].uploadedByName || 'Admin'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => handleOpenDocViewer(offlineDocs[0])}
              className="btn-secondary btn-sm flex-1 md:flex-none"
            >
              <Eye size={13} /> View Data
            </button>
            <button
              onClick={() => setShowUploadPdfModal(true)}
              className="btn-soft btn-sm flex-1 md:flex-none"
            >
              View All ({offlineDocs.length})
            </button>
          </div>
        </div>
      )}

      {/* ── CLASS CARDS GRID ────────────────────────────────────────────────── */}
      {loading ? (
        <LoadingState label="Loading department and class fee cards..." />
      ) : filteredClasses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Building2}
            title="No Class Cards Found"
            description={searchQuery
              ? `No classes matching "${searchQuery}". Try clearing search filter.`
              : `No classes created under '${selectedDept}'. Click below to create your first class card.`}
            action={
              <button
                onClick={() => setShowAddClassModal(true)}
                className="btn-primary"
              >
                <Plus size={16} /> Create Class Card
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredClasses.map((cls) => {
            const isPharmacy = cls.department?.toLowerCase().includes('pharm');
            const isManagement = cls.department?.toLowerCase().includes('mgmt') || cls.department?.toLowerCase().includes('manage');
            const badgeBg = isPharmacy
              ? 'badge-green'
              : isManagement
              ? 'badge-indigo'
              : 'badge-blue';

            return (
              <motion.div
                key={cls._id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className="card hover:border-blue-200 hover:shadow-card-hover transition-shadow flex flex-col justify-between overflow-hidden min-w-0"
              >
                {/* Card Top Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className={`${badgeBg} truncate max-w-[70%]`}>
                      {cls.department}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportClassPdf(cls._id);
                        }}
                        title="Download Class PDF Receipt"
                        className="btn-icon hover:!text-blue-600 hover:!bg-blue-50"
                      >
                        <Download size={15} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClass(cls._id, cls.name, e)}
                        title="Delete Class Card"
                        className="btn-icon hover:!text-red-600 hover:!bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-dark-900 tracking-tight leading-snug break-words">
                    {cls.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {cls.course} • Year {cls.year} • Sec {cls.section} (Fee: ₹{cls.standardFee})
                  </p>

                  {/* Revenue Amount */}
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-end justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Revenue Collected</p>
                      <h4 className="text-2xl font-extrabold text-dark-900 tracking-tight mt-0.5 truncate">
                        ₹{cls.totalCollected?.toLocaleString('en-IN')}
                      </h4>
                    </div>
                    <span className={`shrink-0 ${
                      cls.collectionPercentage >= 70
                        ? 'badge-green'
                        : cls.collectionPercentage >= 40
                        ? 'badge-amber'
                        : 'badge-red'
                    }`}>
                      {cls.collectionPercentage}% Paid
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cls.collectionPercentage >= 70
                          ? 'bg-emerald-500'
                          : cls.collectionPercentage >= 40
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${cls.collectionPercentage}%` }}
                    />
                  </div>

                  {/* Sub Stats Row */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    <div className="bg-slate-50 border border-slate-100 p-3 rounded-xl min-w-0">
                      <p className="text-[11px] text-slate-500 font-semibold">Paid Students</p>
                      <p className="text-sm font-bold text-dark-900 mt-0.5">
                        {cls.paidCount} / {cls.totalStudents}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {cls.onlinePaidCount} Online • {cls.offlinePaidCount} Offline
                      </p>
                    </div>
                    <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-100 min-w-0">
                      <p className="text-[11px] text-amber-700 font-semibold">Pending Dues</p>
                      <p className="text-sm font-bold text-amber-900 mt-0.5 truncate">
                        ₹{cls.totalPendingAmount?.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-amber-600 mt-0.5">
                        {cls.pendingCount} Students Unpaid
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action Button (Opens Full Roster Modal) */}
                <div className="px-5 py-4 bg-slate-50/70 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setSelectedClassModal(cls);
                      setSelectedStudentIds([]);
                      setStudentFilter('all');
                      setStudentSearch('');
                    }}
                    className="btn-primary w-full"
                  >
                    <span>Open Class Roster & Data</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── DRILL-DOWN MODAL: OPENING A CLASS CARD ──────────────────────────── */}
      {selectedClassModal && (
        <div className="modal-overlay">
          <div className="modal-panel sm:max-w-5xl flex flex-col overflow-hidden">
            {/* Modal Header Banner */}
            <div className="bg-brand-gradient text-white p-5 sm:p-6 relative shrink-0">
              <button
                onClick={() => setSelectedClassModal(null)}
                className="absolute right-4 top-4 sm:right-5 sm:top-5 w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X size={18} />
              </button>

              <div className="flex flex-wrap items-center gap-2 mb-2 pr-12">
                <span className="text-[11px] font-semibold bg-white/15 border border-white/20 text-white px-2.5 py-0.5 rounded-full">
                  {selectedClassModal.department}
                </span>
                <span className="text-xs font-medium text-blue-100/80">
                  {selectedClassModal.course} • Year {selectedClassModal.year} • Section {selectedClassModal.section}
                </span>
                <span className="text-[11px] font-semibold text-emerald-200 bg-emerald-400/15 px-2 py-0.5 rounded-full">
                  Fee: ₹{selectedClassModal.standardFee}
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight pr-12 break-words">{selectedClassModal.name}</h2>
              <p className="text-sm text-blue-100/80 mt-1">
                Student roster, online & offline fee records, and enrolled clubs.
              </p>

              {/* Fast Metrics Row inside Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mt-4">
                <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2.5 min-w-0">
                  <p className="text-[11px] text-blue-100/80 font-medium">Total Collected</p>
                  <p className="text-base font-bold text-white mt-0.5 truncate">
                    ₹{selectedClassModal.totalCollected?.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2.5 min-w-0">
                  <p className="text-[11px] text-blue-100/80 font-medium">Online Payments</p>
                  <p className="text-base font-bold text-white mt-0.5 truncate">
                    {selectedClassModal.onlinePaidCount} Students
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2.5 min-w-0">
                  <p className="text-[11px] text-blue-100/80 font-medium">Offline Payments</p>
                  <p className="text-base font-bold text-white mt-0.5 truncate">
                    {selectedClassModal.offlinePaidCount} Students
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 border border-white/10 px-3 py-2.5 min-w-0">
                  <p className="text-[11px] text-blue-100/80 font-medium">Pending Dues</p>
                  <p className="text-base font-bold text-amber-200 mt-0.5 truncate">
                    ₹{selectedClassModal.totalPendingAmount?.toLocaleString('en-IN')} ({selectedClassModal.pendingCount})
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Action Sub-Bar */}
            <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar w-full lg:w-auto min-w-0">
                <button
                  onClick={() => setStudentFilter('all')}
                  className={`tab shrink-0 ${studentFilter === 'all' ? 'tab-active' : 'bg-white'}`}
                >
                  All ({selectedClassModal.students.length})
                </button>
                <button
                  onClick={() => setStudentFilter('paid')}
                  className={`tab shrink-0 ${studentFilter === 'paid' ? 'tab-active' : 'bg-white'}`}
                >
                  Paid ({selectedClassModal.paidCount})
                </button>
                <button
                  onClick={() => setStudentFilter('pending')}
                  className={`tab shrink-0 ${studentFilter === 'pending' ? 'tab-active' : 'bg-white'}`}
                >
                  Pending ({selectedClassModal.pendingCount})
                </button>
                <button
                  onClick={() => setStudentFilter('online')}
                  className={`tab shrink-0 ${studentFilter === 'online' ? 'tab-active' : 'bg-white'}`}
                >
                  Online ({selectedClassModal.onlinePaidCount})
                </button>
                <button
                  onClick={() => setStudentFilter('offline')}
                  className={`tab shrink-0 ${studentFilter === 'offline' ? 'tab-active' : 'bg-white'}`}
                >
                  Offline ({selectedClassModal.offlinePaidCount})
                </button>
              </div>

              {/* Action Buttons & Search */}
              <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full lg:w-auto">
                {/* Search */}
                <div className="relative flex-1 min-w-0 lg:w-56">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search roll no, name..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="input input-icon"
                  />
                </div>

                <button
                  onClick={() => handleExportClassPdf(selectedClassModal._id)}
                  title="Export this class roster to PDF"
                  className="btn-secondary !px-3 shrink-0"
                >
                  <Download size={16} />
                </button>

                {/* Batch Mark Selected as Paid Offline Button */}
                {selectedStudentIds.length > 0 && (
                  <button
                    onClick={() => {
                      setBatchPaymentForm({
                        amount: selectedClassModal.standardFee || 500,
                        paymentMethod: 'Offline / Cash',
                        paymentType: 'Annual Membership Fee',
                        clubId: clubs[0]?._id || '',
                        offlineDocId: offlineDocs[0]?._id || '',
                        notes: `Batch verified for ${selectedStudentIds.length} students in ${selectedClassModal.name}`
                      });
                      setShowBatchModal(true);
                    }}
                    className="btn-primary w-full sm:w-auto"
                  >
                    <CheckSquare size={15} />
                    <span>Mark Selected ({selectedStudentIds.length}) Paid</span>
                  </button>
                )}
              </div>
            </div>

            {/* Student Table */}
            <div className="overflow-y-auto flex-1 p-3 sm:p-6">
              {modalStudents.length === 0 ? (
                <EmptyState icon={Users} title="No students match filter criteria." />
              ) : (
                <div className="table-wrap rounded-2xl border border-slate-100">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th className="w-10 text-center">
                          <button
                            onClick={selectAllPendingStudents}
                            title="Select all pending students"
                            className="p-1 hover:text-blue-600"
                          >
                            <CheckSquare size={15} />
                          </button>
                        </th>
                        <th>Roll No</th>
                        <th>Student Name</th>
                        <th>Status</th>
                        <th>Payment Mode</th>
                        <th>Fee Type</th>
                        <th>Amount</th>
                        <th>Clubs Enrolled</th>
                        <th>Receipt / Date</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modalStudents.map((student) => {
                        const isPaid = student.paymentStatus === 'Paid';
                        const isOffline = student.paymentMode === 'Offline';
                        const isSelected = selectedStudentIds.includes(student._id);

                        return (
                          <tr
                            key={student._id}
                            className={isSelected ? '[&>td]:!bg-blue-50/60' : ''}
                          >
                            {/* Checkbox */}
                            <td className="text-center">
                              {!isPaid ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleStudentSelect(student._id)}
                                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                              ) : (
                                <span className="text-slate-300">•</span>
                              )}
                            </td>

                            {/* Roll Number */}
                            <td className="font-mono font-semibold text-dark-900 whitespace-nowrap">
                              {student.roll_no}
                            </td>

                            {/* Name & Email */}
                            <td className="whitespace-nowrap">
                              <p className="font-semibold text-dark-900">{student.name}</p>
                              <p className="text-xs text-slate-400">{student.email}</p>
                            </td>

                            {/* Status */}
                            <td>
                              {isPaid ? (
                                <span className="badge-green">
                                  <CheckCircle2 size={12} /> Paid
                                </span>
                              ) : (
                                <span className="badge-amber">
                                  <Clock size={12} /> Pending
                                </span>
                              )}
                            </td>

                            {/* Payment Mode */}
                            <td className="whitespace-nowrap">
                              {isPaid ? (
                                <div className="flex items-center gap-1.5">
                                  {isOffline ? (
                                    <span className="badge-indigo">
                                      <FileText size={12} /> Offline
                                    </span>
                                  ) : (
                                    <span className="badge-blue">
                                      <CreditCard size={12} /> Online (UPI)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">—</span>
                              )}
                            </td>

                            {/* Fee Type */}
                            <td className="text-slate-600 capitalize whitespace-nowrap">
                              {student.feeType || 'Membership Fee'}
                            </td>

                            {/* Amount */}
                            <td className="font-bold text-dark-900 whitespace-nowrap">
                              ₹{student.amount || selectedClassModal.standardFee}
                            </td>

                            {/* Enrolled Clubs */}
                            <td>
                              <div className="flex flex-wrap gap-1 min-w-[140px] max-w-[220px]">
                                {student.clubs.map((cName, idx) => (
                                  <span
                                    key={idx}
                                    className="badge-slate truncate max-w-[140px]"
                                    title={cName}
                                  >
                                    {cName}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Receipt / Date */}
                            <td className="whitespace-nowrap">
                              {isPaid ? (
                                <div>
                                  <p className="font-mono text-xs font-semibold text-slate-700">{student.receiptNumber || 'PAID-OK'}</p>
                                  {student.offlineDoc && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDocViewer(student.offlineDoc)}
                                      className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 mt-0.5 cursor-pointer"
                                    >
                                      <Eye size={11} /> View Source
                                    </button>
                                  )}
                                  {student.paidAt && (
                                    <p className="text-[11px] text-slate-400">
                                      {new Date(student.paidAt).toLocaleDateString('en-IN')}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">Unpaid</span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="text-right whitespace-nowrap">
                              {!isPaid ? (
                                <button
                                  onClick={() => openSinglePaymentModal(student)}
                                  className="btn-primary btn-sm"
                                >
                                  Mark Paid (Offline)
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRevertPayment(student._id, student.name)}
                                  className="btn btn-sm text-slate-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  Revert
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 sm:px-6 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2 shrink-0">
              <span className="text-xs text-slate-500 font-medium text-center sm:text-left">
                Showing {modalStudents.length} of {selectedClassModal.students.length} students
              </span>
              <button
                onClick={() => setSelectedClassModal(null)}
                className="btn-secondary"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SINGLE STUDENT RECORD OFFLINE PAYMENT MODAL ───────────────────────── */}
      {offlinePaymentStudent && (
        <div className="modal-overlay">
          <div className="modal-panel p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="badge-indigo">
                  Offline Payment Verification
                </span>
                <h3 className="text-lg font-bold tracking-tight text-dark-900 mt-2 break-words">
                  Record Fee for {offlinePaymentStudent.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Roll No: {offlinePaymentStudent.roll_no} • {selectedClassModal?.name}
                </p>
              </div>
              <button
                onClick={() => setOfflinePaymentStudent(null)}
                className="btn-icon shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordSinglePayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Amount Received (₹)
                  </label>
                  <input
                    required
                    type="number"
                    value={singlePaymentForm.amount}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, amount: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    Payment Method
                  </label>
                  <select
                    value={singlePaymentForm.paymentMethod}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, paymentMethod: e.target.value })}
                    className="input"
                  >
                    <option value="Offline / Cash">Offline / Cash</option>
                    <option value="Offline / Bank Challan">Bank Challan</option>
                    <option value="Offline / UPI Direct Transfer">Offline UPI Direct</option>
                    <option value="Cash Registry Entry">Department Cash Registry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Fee Type
                  </label>
                  <select
                    value={singlePaymentForm.paymentType}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, paymentType: e.target.value })}
                    className="input"
                  >
                    <option value="Annual Membership Fee">Annual Membership Fee</option>
                    <option value="Club Entry Fee">Club Entry Fee</option>
                    <option value="Event Registration">Event Registration</option>
                    <option value="Institutional Dues">Institutional Dues</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    Assign Club
                  </label>
                  <select
                    value={singlePaymentForm.clubId}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, clubId: e.target.value })}
                    className="input"
                  >
                    <option value="">-- All General Clubs --</option>
                    {clubs.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Link Uploaded PDF Document if any */}
              {offlineDocs.length > 0 && (
                <div>
                  <label className="label">
                    Link Uploaded Offline PDF List (Optional)
                  </label>
                  <select
                    value={singlePaymentForm.offlineDocId}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, offlineDocId: e.target.value })}
                    className="input"
                  >
                    <option value="">-- No specific PDF linked --</option>
                    {offlineDocs.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.originalName} ({new Date(doc.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">
                  Receipt Number
                </label>
                <input
                  type="text"
                  value={singlePaymentForm.receiptNumber}
                  onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, receiptNumber: e.target.value })}
                  className="input font-mono"
                />
              </div>

              <div>
                <label className="label">
                  Administrative Notes / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cash submitted to Department Office / Challan copy verified"
                  value={singlePaymentForm.notes}
                  onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, notes: e.target.value })}
                  className="input"
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOfflinePaymentStudent(null)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Confirm & Mark Paid (Offline)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── BATCH OFFLINE PAYMENT MODAL ─────────────────────────────────────── */}
      {showBatchModal && (
        <div className="modal-overlay">
          <div className="modal-panel p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
              <div>
                <span className="badge-indigo">
                  Batch Offline Processing
                </span>
                <h3 className="text-lg font-bold tracking-tight text-dark-900 mt-2 break-words">
                  Verify {selectedStudentIds.length} Selected Students
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedClassModal?.name} • All selected students will be marked as Paid Offline
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="btn-icon shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBatchPayment} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Amount per Student (₹)
                  </label>
                  <input
                    required
                    type="number"
                    value={batchPaymentForm.amount}
                    onChange={(e) => setBatchPaymentForm({ ...batchPaymentForm, amount: e.target.value })}
                    className="input"
                  />
                </div>

                <div>
                  <label className="label">
                    Payment Method
                  </label>
                  <select
                    value={batchPaymentForm.paymentMethod}
                    onChange={(e) => setBatchPaymentForm({ ...batchPaymentForm, paymentMethod: e.target.value })}
                    className="input"
                  >
                    <option value="Offline / Cash">Offline / Cash</option>
                    <option value="Offline / Bank Challan">Bank Challan</option>
                    <option value="Offline / UPI Direct Transfer">Offline UPI Direct</option>
                  </select>
                </div>
              </div>

              {offlineDocs.length > 0 && (
                <div>
                  <label className="label">
                    Link Uploaded Offline PDF List
                  </label>
                  <select
                    value={batchPaymentForm.offlineDocId}
                    onChange={(e) => setBatchPaymentForm({ ...batchPaymentForm, offlineDocId: e.target.value })}
                    className="input"
                  >
                    <option value="">-- No specific PDF linked --</option>
                    {offlineDocs.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.originalName} ({new Date(doc.createdAt).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="label">
                  Batch Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Offline list verified from Accounts Office"
                  value={batchPaymentForm.notes}
                  onChange={(e) => setBatchPaymentForm({ ...batchPaymentForm, notes: e.target.value })}
                  className="input"
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Confirm Batch of {selectedStudentIds.length} Students
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── UPLOAD OFFLINE PAYMENT PDF MODAL ─────────────────────────────────── */}
      {showUploadPdfModal && (
        <div className="modal-overlay">
          <div className="modal-panel sm:max-w-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="icon-tile bg-blue-50 text-blue-600">
                  <FileSpreadsheet size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-lg font-bold tracking-tight text-dark-900">Payment Document & Spreadsheet Importer</h3>
                  <p className="text-xs text-slate-400">Upload spreadsheets or PDFs to group student classes and record fee payments.</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadPdfModal(false)}
                className="btn-icon shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Spreadsheet Guide Banner */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-5 text-xs">
              <div className="flex items-start gap-2 font-semibold text-dark-900 text-sm mb-1">
                <Layers size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                <span>Spreadsheet Column Structure for Automatic Class Mapping</span>
              </div>
              <p className="text-xs text-slate-600 mb-2 leading-relaxed">
                When collecting student fee data, include these column headers in row 1 of your Excel/CSV:
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 font-mono text-[11px] text-blue-900 font-medium mb-2 overflow-x-auto whitespace-nowrap">
                Roll Number, Student Name, Email, Department, Course, Year, Section, Amount, Payment Mode, Fee Type, Receipt Number
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="badge-green">Pharmacy 2023 A</span>
                <span className="badge-blue">B.Tech 2026 A</span>
                <span className="badge-amber">Architecture 2023 A</span>
                <span className="badge-red">Medical Design 2023 A</span>
                <span className="badge-indigo">MBA 2024 A</span>
              </div>
            </div>

            <form onSubmit={handleUploadPdf} className="space-y-4">
              {/* Drag-drop upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 p-6 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf, .png, .jpg, .jpeg, .xlsx, .xls, .csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="hidden"
                />
                <div className="icon-tile bg-blue-100 text-blue-600">
                  <FileSpreadsheet size={22} />
                </div>
                <div className="min-w-0 max-w-full">
                  <p className="text-sm font-semibold text-dark-900 break-all">
                    {uploadFile ? uploadFile.name : 'Click to select Excel (.xlsx, .csv) or PDF document'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Supports .CSV, .XLSX, .XLS, .PDF, .JPG, .PNG (Up to 20MB)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Department Scope (Optional)
                  </label>
                  <select
                    value={uploadDept}
                    onChange={(e) => setUploadDept(e.target.value)}
                    className="input"
                  >
                    <option value="All">Auto-Detect All Departments</option>
                    {departments.map((d) => (
                      <option key={d._id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="label">
                    Document Label / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Campus Fee Collection Batch 2026"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="btn-primary w-full"
              >
                <UploadCloud size={15} />
                <span>{uploading ? 'Processing & Categorizing Classes...' : 'Upload & Process Document'}</span>
              </button>
            </form>

            {/* List of previously uploaded documents */}
            {offlineDocs.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                  Uploaded Offline Payment Archives ({offlineDocs.length})
                </h4>
                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {offlineDocs.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-semibold text-dark-900 truncate">{doc.originalName}</p>
                        <p className="text-[11px] text-slate-400">
                          {doc.notes || 'Offline Document'} • {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {doc.originalName?.match(/\.(xlsx|xls|csv)$/i) && (
                          <button
                            type="button"
                            onClick={() => handleRunAiSegregate(doc._id, doc.originalName)}
                            className="btn btn-sm bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
                            title="Process and map classes from this document"
                          >
                            <Layers size={12} /> Map Classes
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenDocViewer(doc)}
                          className="btn-secondary btn-sm"
                        >
                          <Eye size={12} /> View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── CREATE DEPARTMENT MODAL ─────────────────────────────────────────── */}
      {showAddDeptModal && (
        <div className="modal-overlay">
          <div className="modal-panel sm:max-w-md p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-dark-900">Add Academic Department</h3>
                <p className="text-xs text-slate-400">e.g. Engineering, Pharmacy, Management</p>
              </div>
              <button
                onClick={() => setShowAddDeptModal(false)}
                className="btn-icon shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="label">
                  Department Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Pharmacy, Engineering, Management"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">
                  Department Code (Abbreviation)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PHARM, ENG, MGMT"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  className="input font-mono uppercase"
                />
              </div>

              <div>
                <label className="label">
                  Description / Disciplines
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pharmaceutical Sciences, Clinical Pharmacy & Pharmacology"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="input"
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CREATE CLASS CARD MODAL ─────────────────────────────────────────── */}
      {showAddClassModal && (
        <div className="modal-overlay">
          <div className="modal-panel p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 mb-5">
              <div>
                <h3 className="text-lg font-bold tracking-tight text-dark-900">Create New Class Card</h3>
                <p className="text-xs text-slate-400">Generate a new class card under any department</p>
              </div>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="btn-icon shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="label">
                  Department *
                </label>
                <select
                  required
                  value={classForm.department}
                  onChange={(e) => setClassForm({ ...classForm, department: e.target.value })}
                  className="input"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name} ({d.code || 'DEPT'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">
                    Course / Degree *
                  </label>
                  <select
                    value={classForm.course}
                    onChange={(e) => setClassForm({ ...classForm, course: e.target.value })}
                    className="input"
                  >
                    <option value="B.Tech">B.Tech</option>
                    <option value="B.Pharm">B.Pharm</option>
                    <option value="M.Pharm">M.Pharm</option>
                    <option value="MBA">MBA</option>
                    <option value="BCA">BCA</option>
                    <option value="MCA">MCA</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="B.Sc">B.Sc</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    Academic Year / Batch
                  </label>
                  <input
                    type="text"
                    value={classForm.academicYear}
                    onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="label">
                    Year (1-4) *
                  </label>
                  <select
                    value={classForm.year}
                    onChange={(e) => setClassForm({ ...classForm, year: Number(e.target.value) })}
                    className="input"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="label">
                    Section *
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={3}
                    placeholder="A, B, C"
                    value={classForm.section}
                    onChange={(e) => setClassForm({ ...classForm, section: e.target.value.toUpperCase() })}
                    className="input uppercase"
                  />
                </div>

                <div>
                  <label className="label">
                    Standard Fee (₹)
                  </label>
                  <input
                    required
                    type="number"
                    value={classForm.standardFee}
                    onChange={(e) => setClassForm({ ...classForm, standardFee: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">
                  Class Card Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${classForm.course} - Year ${classForm.year} (Sec ${classForm.section || 'A'})`}
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="input"
                />
              </div>

              <div className="pt-2 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Create Class Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── IN-APP DOCUMENT / SPREADSHEET VIEWER MODAL ───────────────────────── */}
      {viewingDoc && (
        <div className="modal-overlay">
          <div className="modal-panel sm:max-w-6xl h-[92vh] sm:h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-4 py-4 sm:px-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`icon-tile ${
                  docViewerData?.fileType === 'pdf'
                    ? 'bg-red-50 text-red-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {docViewerData?.fileType === 'pdf' ? <FileText size={20} /> : <FileSpreadsheet size={20} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <h3 className="text-base font-bold tracking-tight text-dark-900 truncate max-w-full">
                      {viewingDoc.originalName}
                    </h3>
                    <span className="badge-slate uppercase">
                      {docViewerData?.fileType || 'Document'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {viewingDoc.notes || 'Payment Archive Document'} • Uploaded {new Date(viewingDoc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {(docViewerData?.fileType === 'csv' || docViewerData?.fileType === 'excel') && (
                  <button
                    onClick={() => handleRunAiSegregate(viewingDoc._id, viewingDoc.originalName)}
                    className="btn-primary btn-sm flex-1 sm:flex-none"
                  >
                    <Layers size={14} />
                    <span>Map to Class Cards</span>
                  </button>
                )}
                <a
                  href={viewingDoc.filePath}
                  download
                  className="btn-secondary btn-sm"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => {
                    setViewingDoc(null);
                    setDocViewerData(null);
                  }}
                  className="btn-icon shrink-0"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {docViewerLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 sm:p-12 text-center">
                <div className="spinner mb-3" />
                <p className="text-sm font-semibold text-dark-900">Reading and Parsing Spreadsheet Data...</p>
                <p className="text-xs text-slate-500 mt-1">Extracting student rows, fee columns, and department metadata</p>
              </div>
            ) : docViewerData?.fileType === 'pdf' ? (
              <div className="flex-1 p-3 sm:p-4 bg-slate-100 overflow-hidden">
                <iframe
                  src={viewingDoc.filePath}
                  className="w-full h-full rounded-2xl bg-white border border-slate-200"
                  title={viewingDoc.originalName}
                />
              </div>
            ) : (docViewerData?.fileType === 'csv' || docViewerData?.fileType === 'excel') ? (
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                {/* Stats Ribbon */}
                {docViewerData?.stats && (
                  <div className="px-4 sm:px-5 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
                    <div className="flex items-center gap-x-4 gap-y-2 flex-wrap min-w-0">
                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        <Users size={15} className="text-blue-600" />
                        <span>Total Rows: <strong className="text-dark-900">{docViewerData.totalRows} Students</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 font-medium text-slate-600">
                        <DollarSign size={15} className="text-emerald-600" />
                        <span>Total Amount: <strong className="text-emerald-700">₹{docViewerData.stats.totalAmount?.toLocaleString('en-IN')}</strong></span>
                      </div>
                      {docViewerData.stats.uniqueDepartments?.length > 0 && (
                        <div className="flex items-center flex-wrap gap-1 text-[11px] font-medium text-slate-500">
                          <span>Departments:</span>
                          {docViewerData.stats.uniqueDepartments.map(dept => (
                            <span key={dept} className="badge-slate">
                              {dept}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Showing {filteredDocRows.length} of {docViewerData.totalRows} records
                    </div>
                  </div>
                )}

                {/* Filter and Search Bar */}
                <div className="p-3 sm:p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white shrink-0">
                  <div className="relative w-full md:max-w-md">
                    <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by student name, roll number, receipt, mode..."
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      className="input input-icon"
                    />
                  </div>

                  {docViewerData?.stats?.uniqueDepartments?.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar max-w-full">
                      <button
                        onClick={() => setDocDeptFilter('All')}
                        className={`tab shrink-0 ${docDeptFilter === 'All' ? 'tab-active' : ''}`}
                      >
                        All
                      </button>
                      {docViewerData.stats.uniqueDepartments.map(d => (
                        <button
                          key={d}
                          onClick={() => setDocDeptFilter(d)}
                          className={`tab shrink-0 ${docDeptFilter === d ? 'tab-active' : ''}`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scrollable Data Table */}
                <div className="flex-1 overflow-auto min-h-0">
                  <table className="data-table [&_thead_th]:sticky [&_thead_th]:top-0 [&_thead_th]:z-10">
                    <thead>
                      <tr>
                        <th className="w-12 text-center">#</th>
                        {docViewerData?.headers?.map(header => (
                          <th key={header}>
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocRows.length === 0 ? (
                        <tr>
                          <td colSpan={(docViewerData?.headers?.length || 1) + 1} className="py-16 text-center">
                            <p className="font-semibold text-sm text-dark-900">No matching student rows found</p>
                            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or department filter</p>
                          </td>
                        </tr>
                      ) : (
                        filteredDocRows.map((row, idx) => (
                          <tr key={idx}>
                            <td className="text-center font-semibold text-slate-400 text-xs">
                              {idx + 1}
                            </td>
                            {docViewerData?.headers?.map(header => {
                              const val = row[header];
                              const lowerH = header.toLowerCase();

                              // Style special columns
                              if (lowerH.includes('amount') || lowerH.includes('fee')) {
                                return (
                                  <td key={header} className="font-bold text-emerald-700 whitespace-nowrap">
                                    ₹{val}
                                  </td>
                                );
                              }
                              if (lowerH.includes('roll') || lowerH.includes('receipt') || lowerH.includes('id')) {
                                return (
                                  <td key={header} className="font-mono font-semibold text-dark-900 whitespace-nowrap">
                                    {val}
                                  </td>
                                );
                              }
                              if (lowerH.includes('mode') || lowerH.includes('method')) {
                                const modeStr = String(val).toLowerCase();
                                let badgeColor = 'badge-slate';
                                if (modeStr.includes('upi')) badgeColor = 'badge-indigo';
                                else if (modeStr.includes('cash')) badgeColor = 'badge-green';
                                else if (modeStr.includes('card')) badgeColor = 'badge-blue';
                                else if (modeStr.includes('net') || modeStr.includes('bank')) badgeColor = 'badge-amber';

                                return (
                                  <td key={header} className="whitespace-nowrap">
                                    <span className={badgeColor}>
                                      {val}
                                    </span>
                                  </td>
                                );
                              }
                              if (lowerH.includes('name')) {
                                return (
                                  <td key={header} className="font-semibold text-dark-900 whitespace-nowrap">
                                    {val}
                                  </td>
                                );
                              }
                              return (
                                <td key={header} className="whitespace-nowrap text-slate-600">
                                  {val !== undefined && val !== null ? String(val) : ''}
                                </td>
                              );
                            })}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState
                  icon={FileText}
                  title="Preview not supported for this file format"
                  action={
                    <a
                      href={viewingDoc.filePath}
                      download
                      className="btn-primary"
                    >
                      <Download size={16} /> Download File
                    </a>
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassFeeManagementView;
