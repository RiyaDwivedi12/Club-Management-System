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
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
              <Building2 size={22} />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight">
                Department & Class Fee Management
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Create departments & class cards, monitor online/offline collections, upload offline PDFs, and export official receipts.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAddDeptModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            <Plus size={15} />
            <span>New Department</span>
          </button>

          <button
            onClick={() => setShowAddClassModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Plus size={15} />
            <span>Create Class Card</span>
          </button>

          <button
            onClick={() => setShowUploadPdfModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <UploadCloud size={15} />
            <span>Upload Document / Sheet</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block"></div>

          <button
            onClick={handleExportAllExcel}
            title="Download Class Breakdown Excel"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <FileSpreadsheet size={15} />
            <span>Excel</span>
          </button>

          <button
            onClick={handleExportAllPdf}
            title="Download Institutional PDF Receipt Report"
            className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Download size={15} />
            <span>PDF Report</span>
          </button>
        </div>
      </div>

      {/* ── 4 SIGNATURE "TOTAL NET REVENUE" AESTHETIC KPI CARDS ──────────────── */}
      {overallKPI && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Net Revenue (Signature Emerald/Teal Gradient) */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-emerald-100 tracking-wider">Total Net Revenue</p>
                <h3 className="text-3xl font-black mt-1">₹{overallKPI.totalNetRevenue?.toLocaleString('en-IN')}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-white shadow-inner">
                <DollarSign size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-emerald-100 font-medium">
              <span>{overallKPI.overallCollectionRate}% collected</span>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                {overallKPI.totalPaid} / {overallKPI.totalStudents} Paid
              </span>
            </div>
          </div>

          {/* Card 2: Active Class Cards (Signature Blue/Indigo Gradient) */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-blue-100 tracking-wider">Configured Classes</p>
                <h3 className="text-3xl font-black mt-1">{overallKPI.totalClasses} Classes</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-white shadow-inner">
                <Layers size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-blue-100 font-medium">
              <span>Across {departments.length} Departments</span>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                {overallKPI.totalStudents} Enrolled
              </span>
            </div>
          </div>

          {/* Card 3: Offline Payment Collections (Signature Purple/Violet Gradient) */}
          <div className="bg-gradient-to-br from-violet-600 to-purple-800 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-violet-100 tracking-wider">Offline Receipts</p>
                <h3 className="text-3xl font-black mt-1">₹{overallKPI.offlineRevenue?.toLocaleString('en-IN')}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-white shadow-inner">
                <FileText size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-violet-100 font-medium">
              <span>Verified Cash & Challans</span>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                {overallKPI.totalOfflinePaidStudents} Students
              </span>
            </div>
          </div>

          {/* Card 4: Pending Dues (Signature Amber/Orange Gradient) */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-amber-100 tracking-wider">Pending Fee Dues</p>
                <h3 className="text-3xl font-black mt-1">₹{overallKPI.totalPendingDues?.toLocaleString('en-IN')}</h3>
              </div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center font-bold text-white shadow-inner">
                <Clock size={24} />
              </div>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-amber-100 font-medium">
              <span>Awaiting Verification</span>
              <span className="text-[11px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                {overallKPI.totalPendingStudents} Unpaid
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── DEPARTMENT FILTER BAR & SEARCH ──────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Department Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedDept('All')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
              selectedDept === 'All'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
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
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{dept.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search class, course, year..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
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
        <div className="bg-violet-50/70 border border-violet-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold shrink-0">
              <FileText size={16} />
            </div>
            <div>
              <p className="font-bold text-violet-950">
                Latest Uploaded Offline Payment List: <span className="font-mono text-violet-700">{offlineDocs[0].originalName}</span>
              </p>
              <p className="text-[11px] text-violet-600 mt-0.5">
                {offlineDocs[0].notes || 'Administrative offline deposit slip'} • Uploaded by {offlineDocs[0].uploadedByName || 'Admin'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleOpenDocViewer(offlineDocs[0])}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-violet-700 hover:bg-violet-100 rounded-lg font-bold border border-violet-200 transition cursor-pointer"
            >
              <Eye size={13} /> View Data
            </button>
            <button
              onClick={() => setShowUploadPdfModal(true)}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-bold transition cursor-pointer"
            >
              View All ({offlineDocs.length})
            </button>
          </div>
        </div>
      )}

      {/* ── CLASS CARDS GRID (PREMIUM CARD DESIGN) ──────────────────────────── */}
      {loading ? (
        <div className="py-20 text-center">
          <RefreshCw className="animate-spin mx-auto text-blue-600 mb-2" size={32} />
          <p className="text-xs text-slate-500 font-bold">Loading department and class fee cards...</p>
        </div>
      ) : filteredClasses.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4 font-bold">
            <Building2 size={32} />
          </div>
          <h3 className="text-lg font-black text-slate-900">No Class Cards Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No classes matching "${searchQuery}". Try clearing search filter.`
              : `No classes created under '${selectedDept}'. Click below to create your first class card.`}
          </p>
          <button
            onClick={() => setShowAddClassModal(true)}
            className="mt-5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
          >
            + Create Class Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClasses.map((cls) => {
            const isPharmacy = cls.department?.toLowerCase().includes('pharm');
            const isManagement = cls.department?.toLowerCase().includes('mgmt') || cls.department?.toLowerCase().includes('manage');
            const badgeBg = isPharmacy
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : isManagement
              ? 'bg-purple-50 text-purple-700 border-purple-200'
              : 'bg-blue-50 text-blue-700 border-blue-200';

            return (
              <motion.div
                key={cls._id}
                whileHover={{ y: -3 }}
                transition={{ duration: 0.15 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-lg transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Card Top Header */}
                <div className="p-5 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${badgeBg}`}>
                      {cls.department}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportClassPdf(cls._id);
                        }}
                        title="Download Class PDF Receipt"
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        onClick={(e) => handleDeleteClass(cls._id, cls.name, e)}
                        title="Delete Class Card"
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-black text-slate-900 tracking-tight leading-snug">
                    {cls.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    {cls.course} • Year {cls.year} • Sec {cls.section} (Fee: ₹{cls.standardFee})
                  </p>

                  {/* Revenue Amount in Total Net Revenue Style */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-baseline justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Revenue Collected</p>
                      <h4 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                        ₹{cls.totalCollected?.toLocaleString('en-IN')}
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                        cls.collectionPercentage >= 70
                          ? 'bg-emerald-50 text-emerald-700'
                          : cls.collectionPercentage >= 40
                          ? 'bg-amber-50 text-amber-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}>
                        {cls.collectionPercentage}% Paid
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        cls.collectionPercentage >= 70
                          ? 'bg-emerald-500'
                          : cls.collectionPercentage >= 40
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}
                      style={{ width: `${cls.collectionPercentage}%` }}
                    />
                  </div>

                  {/* Sub Stats Row */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Paid Students</p>
                      <p className="text-xs font-black text-slate-800 mt-0.5">
                        {cls.paidCount} / {cls.totalStudents}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {cls.onlinePaidCount} Online • {cls.offlinePaidCount} Offline
                      </p>
                    </div>
                    <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-100/50">
                      <p className="text-[10px] text-amber-700 font-bold uppercase">Pending Dues</p>
                      <p className="text-xs font-black text-amber-900 mt-0.5">
                        ₹{cls.totalPendingAmount?.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-amber-600 mt-0.5">
                        {cls.pendingCount} Students Unpaid
                      </p>
                    </div>
                  </div>
                </div>

                {/* Card Action Button (Opens Full Roster Modal) */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setSelectedClassModal(cls);
                      setSelectedStudentIds([]);
                      setStudentFilter('all');
                      setStudentSearch('');
                    }}
                    className="w-full py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <span>Open Class Roster & Data</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ── DRILL-DOWN MODAL: OPENING A CLASS CARD ──────────────────────────── */}
      {selectedClassModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header Banner */}
            <div className="bg-[#0B132B] text-white p-6 relative shrink-0">
              <button
                onClick={() => setSelectedClassModal(null)}
                className="absolute right-5 top-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X size={18} />
              </button>

              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-blue-500 text-white px-2.5 py-0.5 rounded-full">
                  {selectedClassModal.department}
                </span>
                <span className="text-[10px] font-bold text-slate-300">
                  {selectedClassModal.course} • Year {selectedClassModal.year} • Section {selectedClassModal.section}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                  Fee: ₹{selectedClassModal.standardFee}
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tight">{selectedClassModal.name}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Student roster, online & offline fee records, and enrolled clubs.
              </p>

              {/* Fast Metrics Row inside Modal */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Total Collected</p>
                  <p className="text-base font-black text-emerald-400 mt-0.5">
                    ₹{selectedClassModal.totalCollected?.toLocaleString('en-IN')}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Online Payments</p>
                  <p className="text-base font-black text-blue-400 mt-0.5">
                    {selectedClassModal.onlinePaidCount} Students
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Offline Payments</p>
                  <p className="text-base font-black text-purple-400 mt-0.5">
                    {selectedClassModal.offlinePaidCount} Students
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Pending Dues</p>
                  <p className="text-base font-black text-amber-400 mt-0.5">
                    ₹{selectedClassModal.totalPendingAmount?.toLocaleString('en-IN')} ({selectedClassModal.pendingCount})
                  </p>
                </div>
              </div>
            </div>

            {/* Filter and Action Sub-Bar */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3 shrink-0">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
                <button
                  onClick={() => setStudentFilter('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    studentFilter === 'all' ? 'bg-slate-900 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All ({selectedClassModal.students.length})
                </button>
                <button
                  onClick={() => setStudentFilter('paid')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    studentFilter === 'paid' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Paid ({selectedClassModal.paidCount})
                </button>
                <button
                  onClick={() => setStudentFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    studentFilter === 'pending' ? 'bg-amber-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Pending ({selectedClassModal.pendingCount})
                </button>
                <button
                  onClick={() => setStudentFilter('online')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    studentFilter === 'online' ? 'bg-blue-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Online ({selectedClassModal.onlinePaidCount})
                </button>
                <button
                  onClick={() => setStudentFilter('offline')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
                    studentFilter === 'offline' ? 'bg-purple-600 text-white shadow-2xs' : 'bg-white text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Offline ({selectedClassModal.offlinePaidCount})
                </button>
              </div>

              {/* Action Buttons & Search */}
              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                {/* Search */}
                <div className="relative flex-1 md:w-48">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search roll no, name..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

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
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                  >
                    <CheckSquare size={14} />
                    <span>Mark Selected ({selectedStudentIds.length}) Paid</span>
                  </button>
                )}

                <button
                  onClick={() => handleExportClassPdf(selectedClassModal._id)}
                  title="Export this class roster to PDF"
                  className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition"
                >
                  <Download size={15} />
                </button>
              </div>
            </div>

            {/* Student Table */}
            <div className="overflow-y-auto flex-1 p-6">
              {modalStudents.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users size={32} className="mx-auto mb-2 opacity-60" />
                  <p className="font-bold text-xs">No students match filter criteria.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-black uppercase text-[10px] tracking-wider">
                        <th className="py-3 px-4 w-10 text-center">
                          <button
                            onClick={selectAllPendingStudents}
                            title="Select all pending students"
                            className="p-1 hover:text-slate-800"
                          >
                            <CheckSquare size={14} />
                          </button>
                        </th>
                        <th className="py-3 px-4">Roll No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Status</th>
                        <th className="py-3 px-4">Payment Mode</th>
                        <th className="py-3 px-4">Fee Type</th>
                        <th className="py-3 px-4">Amount</th>
                        <th className="py-3 px-4">Clubs Enrolled</th>
                        <th className="py-3 px-4">Receipt / Date</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {modalStudents.map((student) => {
                        const isPaid = student.paymentStatus === 'Paid';
                        const isOffline = student.paymentMode === 'Offline';
                        const isSelected = selectedStudentIds.includes(student._id);

                        return (
                          <tr
                            key={student._id}
                            className={`hover:bg-slate-50/80 transition ${isSelected ? 'bg-purple-50/40' : ''}`}
                          >
                            {/* Checkbox */}
                            <td className="py-3 px-4 text-center">
                              {!isPaid ? (
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleStudentSelect(student._id)}
                                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                              ) : (
                                <span className="text-slate-300">•</span>
                              )}
                            </td>

                            {/* Roll Number */}
                            <td className="py-3 px-4 font-mono font-bold text-slate-900">
                              {student.roll_no}
                            </td>

                            {/* Name & Email */}
                            <td className="py-3 px-4">
                              <p className="font-bold text-slate-900">{student.name}</p>
                              <p className="text-[10px] text-slate-400">{student.email}</p>
                            </td>

                            {/* Status */}
                            <td className="py-3 px-4">
                              {isPaid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                  <CheckCircle2 size={11} /> PAID
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                                  <Clock size={11} /> PENDING
                                </span>
                              )}
                            </td>

                            {/* Payment Mode */}
                            <td className="py-3 px-4">
                              {isPaid ? (
                                <div className="flex items-center gap-1.5">
                                  {isOffline ? (
                                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                      <FileText size={11} /> Offline
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold flex items-center gap-1">
                                      <CreditCard size={11} /> Online (UPI)
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">—</span>
                              )}
                            </td>

                            {/* Fee Type */}
                            <td className="py-3 px-4 text-slate-600 capitalize">
                              {student.feeType || 'Membership Fee'}
                            </td>

                            {/* Amount */}
                            <td className="py-3 px-4 font-black text-slate-900">
                              ₹{student.amount || selectedClassModal.standardFee}
                            </td>

                            {/* Enrolled Clubs */}
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {student.clubs.map((cName, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold truncate max-w-[120px]"
                                    title={cName}
                                  >
                                    {cName}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Receipt / Date */}
                            <td className="py-3 px-4">
                              {isPaid ? (
                                <div>
                                  <p className="font-mono text-[10px] font-bold text-slate-700">{student.receiptNumber || 'PAID-OK'}</p>
                                  {student.offlineDoc && (
                                    <button
                                      type="button"
                                      onClick={() => handleOpenDocViewer(student.offlineDoc)}
                                      className="text-[9px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1 mt-0.5 cursor-pointer"
                                    >
                                      <Eye size={10} /> View Source
                                    </button>
                                  )}
                                  {student.paidAt && (
                                    <p className="text-[9px] text-slate-400">
                                      {new Date(student.paidAt).toLocaleDateString('en-IN')}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-slate-400 text-[11px]">Unpaid</span>
                              )}
                            </td>

                            {/* Action Buttons */}
                            <td className="py-3 px-4 text-right">
                              {!isPaid ? (
                                <button
                                  onClick={() => openSinglePaymentModal(student)}
                                  className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition shadow-2xs cursor-pointer"
                                >
                                  Mark Paid (Offline)
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleRevertPayment(student._id, student.name)}
                                  className="px-2 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-[10px] font-bold transition"
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
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500 font-semibold">
                Showing {modalStudents.length} of {selectedClassModal.students.length} students
              </span>
              <button
                onClick={() => setSelectedClassModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SINGLE STUDENT RECORD OFFLINE PAYMENT MODAL ───────────────────────── */}
      {offlinePaymentStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  Offline Payment Verification
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Record Fee for {offlinePaymentStudent.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono">
                  Roll No: {offlinePaymentStudent.roll_no} • {selectedClassModal?.name}
                </p>
              </div>
              <button
                onClick={() => setOfflinePaymentStudent(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRecordSinglePayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Amount Received (₹)
                  </label>
                  <input
                    required
                    type="number"
                    value={singlePaymentForm.amount}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={singlePaymentForm.paymentMethod}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="Offline / Cash">Offline / Cash</option>
                    <option value="Offline / Bank Challan">Bank Challan</option>
                    <option value="Offline / UPI Direct Transfer">Offline UPI Direct</option>
                    <option value="Cash Registry Entry">Department Cash Registry</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Fee Type
                  </label>
                  <select
                    value={singlePaymentForm.paymentType}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, paymentType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="Annual Membership Fee">Annual Membership Fee</option>
                    <option value="Club Entry Fee">Club Entry Fee</option>
                    <option value="Event Registration">Event Registration</option>
                    <option value="Institutional Dues">Institutional Dues</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Assign Club
                  </label>
                  <select
                    value={singlePaymentForm.clubId}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, clubId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
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
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Link Uploaded Offline PDF List (Optional)
                  </label>
                  <select
                    value={singlePaymentForm.offlineDocId}
                    onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, offlineDocId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Receipt Number
                </label>
                <input
                  type="text"
                  value={singlePaymentForm.receiptNumber}
                  onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, receiptNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Administrative Notes / Remarks
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cash submitted to Department Office / Challan copy verified"
                  value={singlePaymentForm.notes}
                  onChange={(e) => setSinglePaymentForm({ ...singlePaymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOfflinePaymentStudent(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                  Batch Offline Processing
                </span>
                <h3 className="text-lg font-black text-slate-900 mt-1">
                  Verify {selectedStudentIds.length} Selected Students
                </h3>
                <p className="text-xs text-slate-400">
                  {selectedClassModal?.name} • All selected students will be marked as Paid Offline
                </p>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBatchPayment} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Amount per Student (₹)
                  </label>
                  <input
                    required
                    type="number"
                    value={batchPaymentForm.amount}
                    onChange={(e) => setBatchPaymentForm({ ...batchPaymentForm, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Payment Method
                  </label>
                  <select
                    value={batchPaymentForm.paymentMethod}
                    onChange={(e) => setBatchPaymentForm({ ...batchPaymentForm, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="Offline / Cash">Offline / Cash</option>
                    <option value="Offline / Bank Challan">Bank Challan</option>
                    <option value="Offline / UPI Direct Transfer">Offline UPI Direct</option>
                  </select>
                </div>
              </div>

              {offlineDocs.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Link Uploaded Offline PDF List
                  </label>
                  <select
                    value={batchPaymentForm.offlineDocId}
                    onChange={(e) => setBatchPaymentForm({ ...batchPaymentForm, offlineDocId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
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
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Batch Remarks / Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. Offline list verified from Accounts Office"
                  value={batchPaymentForm.notes}
                  onChange={(e) => setBatchPaymentForm({ ...batchPaymentForm, notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <FileSpreadsheet size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Payment Document & Spreadsheet Importer</h3>
                  <p className="text-xs text-slate-400">Upload spreadsheets or PDFs to group student classes and record fee payments.</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadPdfModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Spreadsheet Guide Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-4 text-xs">
              <div className="flex items-center gap-2 font-black text-slate-800 mb-1">
                <Layers size={15} className="text-indigo-600" />
                <span>Spreadsheet Column Structure for Automatic Class Mapping</span>
              </div>
              <p className="text-[11px] text-slate-600 mb-2 leading-relaxed">
                When collecting student fee data, include these column headers in row 1 of your Excel/CSV:
              </p>
              <div className="bg-white/80 p-2 rounded-xl border border-purple-100 font-mono text-[10px] text-purple-900 font-semibold mb-2 overflow-x-auto whitespace-nowrap">
                Roll Number, Student Name, Email, Department, Course, Year, Section, Amount, Payment Mode, Fee Type, Receipt Number
              </div>
              <div className="flex flex-wrap gap-1.5 text-[10px]">
                <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">Pharmacy 2023 A</span>
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold">B.Tech 2026 A</span>
                <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">Architecture 2023 A</span>
                <span className="bg-rose-100 text-rose-800 px-2 py-0.5 rounded-md font-bold">Medical Design 2023 A</span>
                <span className="bg-violet-100 text-violet-800 px-2 py-0.5 rounded-md font-bold">MBA 2024 A</span>
              </div>
            </div>

            <form onSubmit={handleUploadPdf} className="space-y-4">
              {/* Drag-drop upload area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-purple-200 hover:border-purple-500 bg-purple-50/30 hover:bg-purple-50/60 p-6 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf, .png, .jpg, .jpeg, .xlsx, .xls, .csv"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-800">
                    {uploadFile ? uploadFile.name : 'Click to select Excel (.xlsx, .csv) or PDF document'}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Supports .CSV, .XLSX, .XLS, .PDF, .JPG, .PNG (Up to 20MB)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Department Scope (Optional)
                  </label>
                  <select
                    value={uploadDept}
                    onChange={(e) => setUploadDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-purple-500 outline-none"
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
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Document Label / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Campus Fee Collection Batch 2026"
                    value={uploadNotes}
                    onChange={(e) => setUploadNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={uploading || !uploadFile}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <UploadCloud size={15} />
                <span>{uploading ? 'Processing & Categorizing Classes...' : 'Upload & Process Document'}</span>
              </button>
            </form>

            {/* List of previously uploaded documents */}
            {offlineDocs.length > 0 && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2.5">
                  Uploaded Offline Payment Archives ({offlineDocs.length})
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {offlineDocs.map((doc) => (
                    <div
                      key={doc._id}
                      className="p-3 bg-slate-50 hover:bg-slate-100 rounded-xl flex items-center justify-between text-xs transition"
                    >
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-slate-900 truncate">{doc.originalName}</p>
                        <p className="text-[10px] text-slate-400">
                          {doc.notes || 'Offline Document'} • {new Date(doc.createdAt).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {doc.originalName?.match(/\.(xlsx|xls|csv)$/i) && (
                          <button
                            type="button"
                            onClick={() => handleRunAiSegregate(doc._id, doc.originalName)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                            title="Process and map classes from this document"
                          >
                            <Layers size={12} /> Map Classes
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenDocViewer(doc)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Add Academic Department</h3>
                <p className="text-xs text-slate-400">e.g. Engineering, Pharmacy, Management</p>
              </div>
              <button
                onClick={() => setShowAddDeptModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateDepartment} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Department Name *
                </label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Pharmacy, Engineering, Management"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Department Code (Abbreviation)
                </label>
                <input
                  type="text"
                  placeholder="e.g. PHARM, ENG, MGMT"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Description / Disciplines
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Pharmaceutical Sciences, Clinical Pharmacy & Pharmacology"
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddDeptModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900">Create New Class Card</h3>
                <p className="text-xs text-slate-400">Generate a new class card under any department</p>
              </div>
              <button
                onClick={() => setShowAddClassModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateClass} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Department *
                </label>
                <select
                  required
                  value={classForm.department}
                  onChange={(e) => setClassForm({ ...classForm, department: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {departments.map((d) => (
                    <option key={d._id} value={d.name}>
                      {d.name} ({d.code || 'DEPT'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Course / Degree *
                  </label>
                  <select
                    value={classForm.course}
                    onChange={(e) => setClassForm({ ...classForm, course: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
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
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Academic Year / Batch
                  </label>
                  <input
                    type="text"
                    value={classForm.academicYear}
                    onChange={(e) => setClassForm({ ...classForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Year (1-4) *
                  </label>
                  <select
                    value={classForm.year}
                    onChange={(e) => setClassForm({ ...classForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value={1}>Year 1</option>
                    <option value={2}>Year 2</option>
                    <option value={3}>Year 3</option>
                    <option value={4}>Year 4</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Section *
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={3}
                    placeholder="A, B, C"
                    value={classForm.section}
                    onChange={(e) => setClassForm({ ...classForm, section: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold uppercase focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Standard Fee (₹)
                  </label>
                  <input
                    required
                    type="number"
                    value={classForm.standardFee}
                    onChange={(e) => setClassForm({ ...classForm, standardFee: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Class Card Display Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder={`e.g. ${classForm.course} - Year ${classForm.year} (Sec ${classForm.section || 'A'})`}
                  value={classForm.name}
                  onChange={(e) => setClassForm({ ...classForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
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
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl max-w-6xl w-full h-[90vh] shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 ${
                  docViewerData?.fileType === 'pdf'
                    ? 'bg-rose-50 text-rose-600'
                    : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {docViewerData?.fileType === 'pdf' ? <FileText size={22} /> : <FileSpreadsheet size={22} />}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-slate-900 truncate">
                      {viewingDoc.originalName}
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-slate-200/80 text-slate-700">
                      {docViewerData?.fileType || 'Document'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate">
                    {viewingDoc.notes || 'Payment Archive Document'} • Uploaded {new Date(viewingDoc.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* Header Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                {(docViewerData?.fileType === 'csv' || docViewerData?.fileType === 'excel') && (
                  <button
                    onClick={() => handleRunAiSegregate(viewingDoc._id, viewingDoc.originalName)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    <Layers size={14} />
                    <span>Map to Class Cards</span>
                  </button>
                )}
                <a
                  href={viewingDoc.filePath}
                  download
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <Download size={14} />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <button
                  onClick={() => {
                    setViewingDoc(null);
                    setDocViewerData(null);
                  }}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            {docViewerLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                <RefreshCw size={36} className="animate-spin text-purple-600 mb-3" />
                <p className="text-sm font-bold text-slate-700">Reading and Parsing Spreadsheet Data...</p>
                <p className="text-xs text-slate-400 mt-1">Extracting student rows, fee columns, and department metadata</p>
              </div>
            ) : docViewerData?.fileType === 'pdf' ? (
              <div className="flex-1 p-4 bg-slate-100 overflow-hidden">
                <iframe
                  src={viewingDoc.filePath}
                  className="w-full h-full rounded-2xl bg-white border border-slate-200 shadow-inner"
                  title={viewingDoc.originalName}
                />
              </div>
            ) : (docViewerData?.fileType === 'csv' || docViewerData?.fileType === 'excel') ? (
              <div className="flex-1 flex flex-col min-h-0 bg-white">
                {/* Stats Ribbon */}
                {docViewerData?.stats && (
                  <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <Users size={15} className="text-blue-600" />
                        <span>Total Rows: <strong className="text-slate-900">{docViewerData.totalRows} Students</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-700">
                        <DollarSign size={15} className="text-emerald-600" />
                        <span>Total Amount: <strong className="text-emerald-700">₹{docViewerData.stats.totalAmount?.toLocaleString('en-IN')}</strong></span>
                      </div>
                      {docViewerData.stats.uniqueDepartments?.length > 0 && (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                          <span>Departments:</span>
                          {docViewerData.stats.uniqueDepartments.map(dept => (
                            <span key={dept} className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-700 font-bold">
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
                <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                  <div className="relative w-full sm:w-96">
                    <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search by student name, roll number, receipt, mode..."
                      value={docSearchQuery}
                      onChange={(e) => setDocSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>

                  {docViewerData?.stats?.uniqueDepartments?.length > 1 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
                      <button
                        onClick={() => setDocDeptFilter('All')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          docDeptFilter === 'All'
                            ? 'bg-slate-900 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All
                      </button>
                      {docViewerData.stats.uniqueDepartments.map(d => (
                        <button
                          key={d}
                          onClick={() => setDocDeptFilter(d)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                            docDeptFilter === d
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Scrollable Data Table */}
                <div className="flex-1 overflow-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-black tracking-wider">
                      <tr>
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        {docViewerData?.headers?.map(header => (
                          <th key={header} className="py-3 px-4 whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                      {filteredDocRows.length === 0 ? (
                        <tr>
                          <td colSpan={(docViewerData?.headers?.length || 1) + 1} className="py-16 text-center text-slate-400">
                            <p className="font-bold text-sm text-slate-600">No matching student rows found</p>
                            <p className="text-xs text-slate-400 mt-1">Try clearing your search query or department filter</p>
                          </td>
                        </tr>
                      ) : (
                        filteredDocRows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-blue-50/40 transition">
                            <td className="py-2.5 px-4 text-center font-bold text-slate-400 text-[11px]">
                              {idx + 1}
                            </td>
                            {docViewerData?.headers?.map(header => {
                              const val = row[header];
                              const lowerH = header.toLowerCase();

                              // Style special columns
                              if (lowerH.includes('amount') || lowerH.includes('fee')) {
                                return (
                                  <td key={header} className="py-2.5 px-4 font-black text-emerald-600 whitespace-nowrap">
                                    ₹{val}
                                  </td>
                                );
                              }
                              if (lowerH.includes('roll') || lowerH.includes('receipt') || lowerH.includes('id')) {
                                return (
                                  <td key={header} className="py-2.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                                    {val}
                                  </td>
                                );
                              }
                              if (lowerH.includes('mode') || lowerH.includes('method')) {
                                const modeStr = String(val).toLowerCase();
                                let badgeColor = 'bg-slate-100 text-slate-700';
                                if (modeStr.includes('upi')) badgeColor = 'bg-indigo-50 text-indigo-700 border border-indigo-200';
                                else if (modeStr.includes('cash')) badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-200';
                                else if (modeStr.includes('card')) badgeColor = 'bg-purple-50 text-purple-700 border border-purple-200';
                                else if (modeStr.includes('net') || modeStr.includes('bank')) badgeColor = 'bg-cyan-50 text-cyan-700 border border-cyan-200';

                                return (
                                  <td key={header} className="py-2.5 px-4 whitespace-nowrap">
                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${badgeColor}`}>
                                      {val}
                                    </span>
                                  </td>
                                );
                              }
                              if (lowerH.includes('name')) {
                                return (
                                  <td key={header} className="py-2.5 px-4 font-bold text-slate-900 whitespace-nowrap">
                                    {val}
                                  </td>
                                );
                              }
                              return (
                                <td key={header} className="py-2.5 px-4 whitespace-nowrap text-slate-600">
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
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
                <FileText size={48} className="mb-2 text-slate-300" />
                <p className="font-bold text-slate-700">Preview not supported for this file format</p>
                <a
                  href={viewingDoc.filePath}
                  download
                  className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassFeeManagementView;
