import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Search, Download, Trash2, Users, GraduationCap,
  RefreshCw, Layers, School, ChevronLeft, ChevronRight
} from 'lucide-react';
import PageHeader from '../ui/PageHeader';

const CLASS_LIST = ['all', 'B.Tech', 'BCA', 'MCA', 'M.Tech', 'MBA', 'B.Sc'];
const SECTION_LIST = ['all', 'A', 'B', 'C', 'D'];

// KPI card with a breakdown chip row underneath (values come from demographics).
const DemographicCard = ({ icon: Icon, tint, label, value, children }) => (
  <div className="card p-4 sm:p-5 min-w-0">
    <div className="flex items-center gap-3.5">
      <div className={`icon-tile ${tint}`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-dark-900">{value}</p>
        <p className="text-xs font-medium text-slate-500 truncate">{label}</p>
      </div>
    </div>
    {children && <div className="flex flex-wrap gap-1.5 mt-3">{children}</div>}
  </div>
);

const StudentDirectoryView = () => {
  const [students, setStudents] = useState([]);
  const [demographics, setDemographics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedSection, setSelectedSection] = useState('all');
  const [selectedDept, setSelectedDept] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchDemographics = async () => {
    try {
      const res = await axios.get('/api/student-directory/demographics', { withCredentials: true });
      setDemographics(res.data);
    } catch (err) {
      console.error('Failed to load demographics:', err);
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const params = {
        page,
        limit: 25,
        search: search.trim() || undefined,
        course: selectedCourse !== 'all' ? selectedCourse : undefined,
        section: selectedSection !== 'all' ? selectedSection : undefined,
        department: selectedDept !== 'all' ? selectedDept : undefined,
        year: selectedYear !== 'all' ? selectedYear : undefined
      };
      const res = await axios.get('/api/student-directory', { params, withCredentials: true });
      setStudents(res.data.students || []);
      setTotalPages(res.data.totalPages || 1);
      setTotalCount(res.data.total || 0);
    } catch (err) {
      toast.error('Failed to fetch student directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemographics();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [page, selectedCourse, selectedSection, selectedDept, selectedYear]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleExport = () => {
    const query = new URLSearchParams();
    if (selectedCourse !== 'all') query.append('course', selectedCourse);
    if (selectedSection !== 'all') query.append('section', selectedSection);
    if (selectedDept !== 'all') query.append('department', selectedDept);
    if (selectedYear !== 'all') query.append('year', selectedYear);
    if (search.trim()) query.append('search', search.trim());

    window.open(`/api/student-directory/export?${query.toString()}`, '_blank');
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the student directory?`)) return;
    try {
      await axios.delete(`/api/student-directory/${id}`, { withCredentials: true });
      toast.success('Student record removed');
      fetchStudents();
      fetchDemographics();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove student');
    }
  };

  // Helper to get count for a course from demographics
  const getCourseCount = (courseName) => {
    if (!demographics?.courseStats) return null;
    const found = demographics.courseStats.find(
      (c) => c._id?.toLowerCase() === courseName.toLowerCase()
    );
    return found ? found.count : 0;
  };

  // Helper to get count for a section from demographics
  const getSectionCount = (sectionName) => {
    if (!demographics?.sectionStats) return null;
    const found = demographics.sectionStats.find(
      (s) => s._id?.toUpperCase() === sectionName.toUpperCase()
    );
    return found ? found.count : 0;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <PageHeader
        icon={Users}
        eyebrow="Directory"
        title="Class & Student Management"
        description="Organize, filter, and manage students class-wise, section-wise, and department-wise."
        actions={
          <>
            <button onClick={handleExport} className="btn-secondary">
              <Download size={15} className="text-blue-600" />
              <span>Export XLSX</span>
            </button>
            <button
              onClick={() => {
                setSearch('');
                setSelectedCourse('all');
                setSelectedSection('all');
                setSelectedDept('all');
                setSelectedYear('all');
                setPage(1);
                fetchStudents();
                fetchDemographics();
              }}
              className="btn-icon-outline"
              title="Refresh Directory"
            >
              <RefreshCw size={15} />
            </button>
          </>
        }
      />

      {/* 2. Demographic Overview Cards */}
      {demographics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DemographicCard icon={Users} tint="bg-blue-50 text-blue-600" label="Total enrolled" value={demographics.totalStudents || 0}>
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Verified student profiles
            </span>
          </DemographicCard>

          <DemographicCard icon={School} tint="bg-indigo-50 text-indigo-600" label="Classes / programs" value={demographics.courseStats?.length || 0}>
            {demographics.courseStats?.slice(0, 3).map((c) => (
              <span key={c._id} className="badge-indigo">
                {c._id}: {c.count}
              </span>
            ))}
            {demographics.courseStats?.length > 3 && (
              <span className="text-[11px] font-semibold px-1.5 py-0.5 text-slate-400">
                +{demographics.courseStats.length - 3} more
              </span>
            )}
          </DemographicCard>

          <DemographicCard icon={Layers} tint="bg-sky-50 text-sky-600" label="Sections active" value={demographics.sectionStats?.length || 0}>
            {demographics.sectionStats?.map((s) => (
              <span key={s._id} className="badge-blue">
                Sec {s._id}: {s.count}
              </span>
            ))}
          </DemographicCard>

          <DemographicCard icon={GraduationCap} tint="bg-emerald-50 text-emerald-600" label="Academic years" value={demographics.yearStats?.length || 0}>
            {demographics.yearStats?.map((y) => (
              <span key={y._id} className="badge-green">
                Yr {y._id}: {y.count}
              </span>
            ))}
          </DemographicCard>
        </div>
      )}

      {/* 3. Class-wise Tabs */}
      <div className="card p-3 sm:p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pb-3 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <School size={16} className="text-blue-600" />
            <span className="text-sm font-bold text-dark-900">Class / Degree Programs</span>
          </div>
          <span className="text-xs font-medium text-slate-400">
            {selectedCourse === 'all' ? 'All Classes Selected' : `Filtering by: ${selectedCourse}`}
          </span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar">
          {CLASS_LIST.map((cls) => {
            const count = cls === 'all' ? demographics?.totalStudents : getCourseCount(cls);
            const isSelected = selectedCourse === cls;
            return (
              <button
                key={cls}
                onClick={() => {
                  setSelectedCourse(cls);
                  setPage(1);
                }}
                className={`tab flex items-center gap-2 ${isSelected ? 'tab-active' : 'bg-slate-50 border border-slate-200'}`}
              >
                <span>{cls === 'all' ? 'All Classes' : cls}</span>
                {count !== null && count !== undefined && (
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Search & Filters */}
      <div className="card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full lg:max-w-sm">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search Roll No, Name, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-icon"
            />
          </div>
          <button type="submit" className="btn-primary shrink-0">
            Search
          </button>
        </form>

        {/* Section, Dept, and Year Selectors */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full lg:w-auto">
          <select
            value={selectedSection}
            onChange={(e) => { setSelectedSection(e.target.value); setPage(1); }}
            className="input sm:w-40"
            aria-label="Section"
          >
            <option value="all">All Sections</option>
            {SECTION_LIST.filter(s => s !== 'all').map(sec => (
              <option key={sec} value={sec}>Section {sec}</option>
            ))}
          </select>

          <select
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
            className="input sm:w-40 truncate"
            aria-label="Department"
          >
            <option value="all">All Depts</option>
            {demographics?.departmentStats?.map(d => (
              <option key={d._id} value={d._id}>{d._id}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
            className="input sm:w-36"
            aria-label="Year"
          >
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <button
            onClick={() => {
              setSearch('');
              setSelectedCourse('all');
              setSelectedSection('all');
              setSelectedDept('all');
              setSelectedYear('all');
              setPage(1);
              fetchStudents();
            }}
            className="btn-secondary"
            title="Reset Filters"
          >
            <RefreshCw size={14} /> <span className="sm:hidden">Reset</span>
          </button>
        </div>
      </div>

      {/* 5. Students Table */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <div className="min-w-0">
            <h3 className="card-title">
              Students List {selectedCourse !== 'all' ? `• ${selectedCourse}` : ''} {selectedSection !== 'all' ? `• Sec ${selectedSection}` : ''}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Showing {students.length} of {totalCount} total students</p>
          </div>
          <span className="badge-slate">
            Page {page} of {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="p-12 flex flex-col items-center gap-3 text-slate-400 text-sm">
            <div className="spinner" />
            Loading class students...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center">
            <div className="icon-tile bg-slate-100 text-slate-400 mx-auto mb-3">
              <Users size={20} />
            </div>
            <p className="font-bold text-dark-900 text-sm">No students found matching your filters</p>
            <p className="text-xs text-slate-500 mt-1">Try switching class tabs or clearing filters</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Class / Program</th>
                  <th>Section</th>
                  <th>Branch / Dept</th>
                  <th>Academic Year</th>
                  <th>Email Address</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td className="font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {s.roll_no || 'N/A'}
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 ring-1 ring-blue-100">
                          {s.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-semibold text-dark-900 whitespace-nowrap">{s.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className="badge-blue whitespace-nowrap">
                        {s.course || 'B.Tech'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-amber whitespace-nowrap">
                        Sec {s.section || 'A'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-slate">
                        {s.department || 'GENERAL'}
                      </span>
                    </td>
                    <td>
                      <span className="badge-green whitespace-nowrap">
                        Year {s.year || 1}
                      </span>
                    </td>
                    <td className="text-slate-500">
                      {s.email}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => handleDelete(s._id, s.name)}
                        className="btn-icon hover:text-red-600 hover:bg-red-50"
                        title="Delete student"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <span className="text-xs font-semibold text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="btn-secondary btn-sm disabled:opacity-40"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDirectoryView;
