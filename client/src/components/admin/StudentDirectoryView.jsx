import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Search, Download, Trash2, Filter, Users, Building, GraduationCap, 
  RefreshCw, Layers, BookOpen, School, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';

const CLASS_LIST = ['all', 'B.Tech', 'BCA', 'MCA', 'M.Tech', 'MBA', 'B.Sc'];
const SECTION_LIST = ['all', 'A', 'B', 'C', 'D'];

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
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users size={22} className="text-blue-600" />
            Class & Student Management
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Organize, filter, and manage students class-wise, section-wise, and department-wise.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200/90 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
          >
            <Download size={14} className="text-blue-600" />
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
            className="p-2 bg-white border border-slate-200/90 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-2xs transition"
            title="Refresh Directory"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 2. Demographic Overview Cards */}
      {demographics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Enrolled */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Total Enrolled</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{demographics.totalStudents || 0}</h3>
              </div>
              <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                <Users size={20} />
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2.5 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Verified student profiles
            </p>
          </div>

          {/* Card 2: Classes Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Classes / Programs</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{demographics.courseStats?.length || 0}</h3>
              </div>
              <div className="w-11 h-11 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center font-bold">
                <School size={20} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2.5">
              {demographics.courseStats?.slice(0, 3).map((c) => (
                <span key={c._id} className="text-[10px] font-bold px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md">
                  {c._id}: {c.count}
                </span>
              ))}
              {demographics.courseStats?.length > 3 && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 text-slate-400">
                  +{demographics.courseStats.length - 3} more
                </span>
              )}
            </div>
          </div>

          {/* Card 3: Sections Breakdown */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Sections Active</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{demographics.sectionStats?.length || 0}</h3>
              </div>
              <div className="w-11 h-11 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold">
                <Layers size={20} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2.5">
              {demographics.sectionStats?.map((s) => (
                <span key={s._id} className="text-[10px] font-bold px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md">
                  Sec {s._id}: {s.count}
                </span>
              ))}
            </div>
          </div>

          {/* Card 4: Academic Batches */}
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase font-bold tracking-wider text-slate-400">Academic Years</p>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{demographics.yearStats?.length || 0}</h3>
              </div>
              <div className="w-11 h-11 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <GraduationCap size={20} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-2.5">
              {demographics.yearStats?.map((y) => (
                <span key={y._id} className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                  Yr {y._id}: {y.count}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Class-wise Interactive Tabs */}
      <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)]">
        <div className="flex items-center justify-between px-2 pb-2.5 border-b border-slate-100 mb-3">
          <div className="flex items-center gap-2">
            <School size={16} className="text-blue-600" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Class / Degree Programs</span>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {selectedCourse === 'all' ? 'All Classes Selected' : `Filtering by: ${selectedCourse}`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
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
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 ring-2 ring-blue-600/20'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/80'
                }`}
              >
                <span>{cls === 'all' ? 'All Classes' : cls}</span>
                {count !== null && count !== undefined && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
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

      {/* 4. Section & Advanced Academic Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_10px_rgba(0,0,0,0.02)] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-80">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search Roll No, Name, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            Search
          </button>
        </form>

        {/* Section, Dept, and Year Selectors */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Section Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500">Section:</span>
            <select
              value={selectedSection}
              onChange={(e) => { setSelectedSection(e.target.value); setPage(1); }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Sections</option>
              {SECTION_LIST.filter(s => s !== 'all').map(sec => (
                <option key={sec} value={sec}>Section {sec}</option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500">Dept:</span>
            <select
              value={selectedDept}
              onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer max-w-[120px] truncate"
            >
              <option value="all">All Depts</option>
              {demographics?.departmentStats?.map(d => (
                <option key={d._id} value={d._id}>{d._id}</option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500">Year:</span>
            <select
              value={selectedYear}
              onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
              className="bg-transparent text-xs font-bold text-slate-800 focus:outline-none cursor-pointer"
            >
              <option value="all">All Years</option>
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

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
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition"
            title="Reset Filters"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* 5. Students Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-sm text-slate-900">
              Students List {selectedCourse !== 'all' ? `• ${selectedCourse}` : ''} {selectedSection !== 'all' ? `• Sec ${selectedSection}` : ''}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Showing {students.length} of {totalCount} total students</p>
          </div>
          <span className="text-xs text-slate-500 font-bold bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200">
            Page {page} of {totalPages}
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium text-xs">
            <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-blue-500" />
            Loading class students...
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Users size={36} className="mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-600 text-sm">No students found matching your filters</p>
            <p className="text-xs text-slate-400 mt-1">Try switching class tabs or clearing filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/75 text-[10px] uppercase tracking-wider text-slate-500 font-black border-b border-slate-100">
                  <th className="py-3 px-6">Roll Number</th>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6">Class / Program</th>
                  <th className="py-3 px-6">Section</th>
                  <th className="py-3 px-6">Branch / Dept</th>
                  <th className="py-3 px-6">Academic Year</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-6 font-mono font-bold text-blue-700">
                      {s.roll_no || 'N/A'}
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 border border-slate-200">
                          {s.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <span className="font-bold text-slate-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[11px] font-bold border border-blue-100">
                        {s.course || 'B.Tech'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md text-[11px] font-black border border-amber-200/60">
                        Sec {s.section || 'A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[11px] font-semibold">
                        {s.department || 'GENERAL'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[11px] font-bold">
                        Year {s.year || 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-[11px] text-slate-500 font-medium">
                      {s.email}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDelete(s._id, s.name)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
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
          <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-slate-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg disabled:opacity-40 hover:bg-slate-200 transition"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDirectoryView;
