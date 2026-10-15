import { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight, ShieldCheck, Download } from 'lucide-react';
import { motion } from 'framer-motion';

const DocumentImportView = ({ onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [updateDuplicates, setUpdateDuplicates] = useState(true);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreviewData(null);
    }
  };

  const handlePreflightAnalysis = async () => {
    if (!file) return toast.error('Please select an Excel or CSV file first');

    setAnalyzing(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await axios.post('/api/student-directory/import-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        withCredentials: true
      });
      setPreviewData(res.data);
      toast.success(`Analyzed ${res.data.totalRows} student rows from spreadsheet!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse file. Ensure it is a valid spreadsheet.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!previewData?.allValidatedRows) return;

    setImporting(true);
    try {
      const payload = {
        students: previewData.allValidatedRows.filter(r => r.status !== 'invalid'),
        updateDuplicates
      };
      const res = await axios.post('/api/student-directory/import-confirm', payload, {
        withCredentials: true
      });
      toast.success(res.data.message || 'Import successful!');
      setPreviewData(null);
      setFile(null);
      if (onImportSuccess) onImportSuccess();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload Header Box */}
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
        <div className="max-w-2xl">
          <h2 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <FileSpreadsheet className="text-primary-600" size={26} />
            Student Document Import & Intelligence
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Upload institutional student spreadsheets (.xlsx, .xls, .csv). The system automatically maps roll numbers, names, departments, and academic years, detects duplicates, and calculates cohort statistics before committing to the database.
          </p>
        </div>

        {/* Drag and Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="mt-6 border-2 border-dashed border-primary-200 hover:border-primary-500 bg-primary-50/30 hover:bg-primary-50/60 p-8 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-14 h-14 bg-primary-100 text-primary-600 rounded-2xl flex items-center justify-center">
            <UploadCloud size={28} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-800">
              {file ? file.name : 'Click to select spreadsheet or drag and drop here'}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supports Excel (.xlsx, .xls) and CSV lists up to 15MB
            </p>
          </div>
        </div>

        {file && !previewData && (
          <div className="mt-4 flex justify-end">
            <button
              onClick={handlePreflightAnalysis}
              disabled={analyzing}
              className="flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-sm shadow-md transition disabled:opacity-50"
            >
              {analyzing ? 'Analyzing File...' : 'Analyze & Pre-flight Validate'} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Pre-flight Validation Results */}
      {previewData && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* Intelligence KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl">
                  <CheckCircle2 size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-emerald-600">Valid Records</p>
                  <h3 className="text-2xl font-black text-emerald-950">{previewData.validCount}</h3>
                </div>
              </div>
              <p className="text-xs text-emerald-700 mt-2 font-medium">Ready for instant enrollment</p>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-amber-600">Existing In DB</p>
                  <h3 className="text-2xl font-black text-amber-950">{previewData.duplicateDbCount}</h3>
                </div>
              </div>
              <p className="text-xs text-amber-700 mt-2 font-medium">Will update branch & academic year</p>
            </div>

            <div className="bg-rose-50 border border-rose-200 p-5 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
                  <AlertCircle size={22} />
                </div>
                <div>
                  <p className="text-xs uppercase font-bold text-rose-600">Invalid / Missing</p>
                  <h3 className="text-2xl font-black text-rose-950">{previewData.invalidCount}</h3>
                </div>
              </div>
              <p className="text-xs text-rose-700 mt-2 font-medium">Missing name or roll number</p>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase font-bold text-slate-400">Total Rows Detected</p>
                <h3 className="text-2xl font-black text-white">{previewData.totalRows}</h3>
              </div>
              <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-semibold text-slate-300">
                <input
                  type="checkbox"
                  checked={updateDuplicates}
                  onChange={(e) => setUpdateDuplicates(e.target.checked)}
                  className="rounded text-primary-500"
                />
                Update duplicate records
              </label>
            </div>
          </div>

          {/* Department and Class Breakdown Summary */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-gray-900 text-sm mb-3">Extracted Cohort Demographics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Calculated Department Counts</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(previewData.departmentCounts || {}).map(([dept, count]) => (
                    <span key={dept} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800">
                      {dept}: <span className="text-primary-600">{count}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="text-xs font-bold text-gray-500 uppercase mb-2">Calculated Academic Year Counts</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(previewData.yearCounts || {}).map(([yr, count]) => (
                    <span key={yr} className="px-3 py-1 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-800">
                      Year {yr}: <span className="text-emerald-600">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold text-sm text-gray-900">Extracted Student Preview (First 100 rows)</span>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50"
              >
                <ShieldCheck size={16} />
                {importing ? 'Importing...' : `Confirm & Bulk Import ${previewData.validCount} Students`}
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="sticky top-0 bg-gray-50 border-b border-gray-200 font-black uppercase text-gray-500">
                  <tr>
                    <th className="py-2.5 px-4">Row</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Roll Number</th>
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Branch / Dept</th>
                    <th className="py-2.5 px-4">Year</th>
                    <th className="py-2.5 px-4">Email Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-medium">
                  {previewData.preview?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="py-2.5 px-4 text-gray-400">#{row._rowIndex}</td>
                      <td className="py-2.5 px-4">
                        {row.status === 'valid' && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px]">
                            VALID
                          </span>
                        )}
                        {row.status === 'db_duplicate' && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md font-bold text-[10px]">
                            DB DUPLICATE
                          </span>
                        )}
                        {row.status === 'invalid' && (
                          <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[10px]">
                            INVALID
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-primary-700">{row.roll_no || '-'}</td>
                      <td className="py-2.5 px-4 font-bold text-gray-900">{row.name || '-'}</td>
                      <td className="py-2.5 px-4">{row.department || 'GENERAL'}</td>
                      <td className="py-2.5 px-4">Year {row.year}</td>
                      <td className="py-2.5 px-4 text-gray-500">{row.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default DocumentImportView;
