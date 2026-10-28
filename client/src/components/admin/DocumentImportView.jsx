import { useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight, ShieldCheck, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import PageHeader from '../ui/PageHeader';
import StatTile from '../ui/StatTile';

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
      <PageHeader
        icon={FileSpreadsheet}
        eyebrow="Bulk import"
        title="Student Document Import"
        description="Upload institutional student spreadsheets (.xlsx, .xls, .csv). The system automatically maps roll numbers, names, departments, and academic years, detects duplicates, and calculates cohort statistics before committing to the database."
      />

      {/* Upload Box */}
      <div className="card p-5 sm:p-6">
        {/* Drag and Drop Zone */}
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50 p-6 sm:p-8 rounded-2xl text-center cursor-pointer transition flex flex-col items-center justify-center gap-3"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-md shadow-blue-600/25">
            <UploadCloud size={26} />
          </div>
          <div className="min-w-0 max-w-full">
            <p className="text-sm font-semibold text-dark-900 break-all">
              {file ? file.name : 'Click to select spreadsheet or drag and drop here'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports Excel (.xlsx, .xls) and CSV lists up to 15MB
            </p>
          </div>
        </div>

        {file && !previewData && (
          <div className="mt-4 flex sm:justify-end">
            <button
              onClick={handlePreflightAnalysis}
              disabled={analyzing}
              className="btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {analyzing ? 'Analyzing File...' : 'Analyze & Pre-flight Validate'} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>

      {/* Pre-flight Validation Results */}
      {previewData && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatTile icon={CheckCircle2} label="Valid records" value={previewData.validCount} hint="Ready for instant enrollment" tint="emerald" />
            <StatTile icon={AlertTriangle} label="Existing in DB" value={previewData.duplicateDbCount} hint="Will update branch & academic year" tint="amber" />
            <StatTile icon={AlertCircle} label="Invalid / missing" value={previewData.invalidCount} hint="Missing name or roll number" tint="rose" />

            <div className="card p-4 sm:p-5 flex flex-col justify-between gap-3 min-w-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="icon-tile bg-blue-50 text-blue-600">
                  <Layers size={20} />
                </div>
                <div className="min-w-0">
                  <p className="text-xl sm:text-2xl font-extrabold tracking-tight text-dark-900">{previewData.totalRows}</p>
                  <p className="text-xs font-medium text-slate-500">Total rows detected</p>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={updateDuplicates}
                  onChange={(e) => setUpdateDuplicates(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Update duplicate records
              </label>
            </div>
          </div>

          {/* Department and Class Breakdown Summary */}
          <div className="card p-5 sm:p-6">
            <h4 className="card-title mb-4">Extracted Cohort Demographics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Calculated department counts</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(previewData.departmentCounts || {}).map(([dept, count]) => (
                    <span key={dept} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                      {dept}: <span className="text-blue-600 font-bold">{count}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2.5">Calculated academic year counts</p>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(previewData.yearCounts || {}).map(([yr, count]) => (
                    <span key={yr} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700">
                      Year {yr}: <span className="text-indigo-600 font-bold">{count}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Preview Table */}
          <div className="card overflow-hidden">
            <div className="card-header">
              <span className="card-title">Extracted Student Preview <span className="text-slate-400 font-medium text-sm">(first 100 rows)</span></span>
              <button
                onClick={handleConfirmImport}
                disabled={importing}
                className="btn-success btn-sm w-full sm:w-auto disabled:opacity-50"
              >
                <ShieldCheck size={16} />
                {importing ? 'Importing...' : `Confirm & Bulk Import ${previewData.validCount} Students`}
              </button>
            </div>

            <div className="table-wrap max-h-96 overflow-y-auto">
              <table className="data-table text-xs">
                <thead className="sticky top-0 z-10">
                  <tr>
                    <th>Row</th>
                    <th>Status</th>
                    <th>Roll Number</th>
                    <th>Student Name</th>
                    <th>Branch / Dept</th>
                    <th>Year</th>
                    <th>Email Address</th>
                  </tr>
                </thead>
                <tbody>
                  {previewData.preview?.map((row, idx) => (
                    <tr key={idx}>
                      <td className="text-slate-400">#{row._rowIndex}</td>
                      <td className="whitespace-nowrap">
                        {row.status === 'valid' && (
                          <span className="badge-green">Valid</span>
                        )}
                        {row.status === 'db_duplicate' && (
                          <span className="badge-amber">DB duplicate</span>
                        )}
                        {row.status === 'invalid' && (
                          <span className="badge-red">Invalid</span>
                        )}
                      </td>
                      <td className="font-mono font-semibold text-blue-700 whitespace-nowrap">{row.roll_no || '-'}</td>
                      <td className="font-semibold text-dark-900 whitespace-nowrap">{row.name || '-'}</td>
                      <td>{row.department || 'GENERAL'}</td>
                      <td className="whitespace-nowrap">Year {row.year}</td>
                      <td className="text-slate-500">{row.email}</td>
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
