import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Download, Trash2, Filter, Users, Building, GraduationCap, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

const StudentDirectoryView = () => {
  const [students, setStudents] = useState([]);
  const [demographics, setDemographics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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
  }, [page, selectedDept, selectedYear]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  const handleExport = () => {
    const query = new URLSearchParams();
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

  return (
    <div className="space-y-6">
      {/* Demographic Summary Cards */}
      {demographics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-slate-400">Total Enrolled</p>
                <h3 className="text-3xl font-black mt-1">{demographics.totalStudents}</h3>
              </div>
              <div className="w-12 h-12 bg-primary-600/30 text-primary-400 rounded-xl flex items-center justify-center font-bold">
                <Users size={24} />
              </div>
            </div>
            <p className="text-xs text-slate-400 mt-3 font-medium">Verified student profiles</p>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Departments</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{demographics.departmentStats?.length || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold">
                <Building size={24} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {demographics.departmentStats?.slice(0, 3).map((d) => (
                <span key={d._id} className="text-[10px] font-bold px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">
                  {d._id}: {d.count}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase font-bold tracking-wider text-gray-500">Academic Batches</p>
                <h3 className="text-3xl font-black text-gray-900 mt-1">{demographics.yearStats?.length || 0}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                <GraduationCap size={24} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mt-3">
              {demographics.yearStats?.map((y) => (
                <span key={y._id} className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md">
                  Yr {y._id}: {y.count}
                </span>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-primary-600 to-indigo-700 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase font-bold tracking-wider text-primary-200">Data Actions</p>
              <h4 className="text-lg font-black mt-1">Excel Export Ready</h4>
              <p className="text-xs text-primary-100 mt-1">Export filtered lists with academic years and departments.</p>
            </div>
            <button
              onClick={handleExport}
              className="mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-white text-primary-900 rounded-xl font-bold text-xs hover:bg-primary-50 transition shadow-sm"
            >
              <Download size={14} /> Download .XLSX
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full md:w-96">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by Roll No, Name, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button type="submit" className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition">
            Search
          </button>
        </form>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedDept}
            onChange={(e) => { setSelectedDept(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
          >
            <option value="all">All Departments</option>
            {demographics?.departmentStats?.map(d => (
              <option key={d._id} value={d._id}>{d._id}</option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => { setSelectedYear(e.target.value); setPage(1); }}
            className="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 focus:outline-none"
          >
            <option value="all">All Years</option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>

          <button
            onClick={() => { setSearch(''); setSelectedDept('all'); setSelectedYear('all'); setPage(1); fetchStudents(); }}
            className="p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition"
            title="Reset Filters"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900">Enrolled Students ({totalCount})</h3>
          <span className="text-xs text-gray-500 font-semibold">Page {page} of {totalPages}</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-400 font-medium">Loading student records...</div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={36} className="mx-auto mb-2 text-gray-300" />
            <p className="font-bold text-gray-600">No students found matching your filters</p>
            <p className="text-xs text-gray-400 mt-1">Try resetting search filters or import students via Excel</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/75 text-[11px] uppercase tracking-wider text-gray-500 font-black border-b border-gray-100">
                  <th className="py-3 px-6">Roll Number</th>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6">Course / Branch</th>
                  <th className="py-3 px-6">Year</th>
                  <th className="py-3 px-6">Email Address</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {students.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-6 font-mono font-black text-primary-700">
                      {s.roll_no || 'N/A'}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-gray-900">
                      {s.name}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg text-xs font-bold border border-purple-100">
                        {s.department || 'GENERAL'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                        Year {s.year || 1}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-gray-500 font-medium">
                      {s.email}
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      <button
                        onClick={() => handleDelete(s._id, s.name)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete student"
                      >
                        <Trash2 size={16} />
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
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 rounded-lg disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs font-semibold text-gray-500">
              Page {page} of {totalPages}
            </span>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 text-xs font-bold bg-gray-100 text-gray-700 rounded-lg disabled:opacity-40"
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
