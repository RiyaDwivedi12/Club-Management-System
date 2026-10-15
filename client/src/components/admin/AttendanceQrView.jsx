import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { QrCode, CheckCircle2, AlertTriangle, Users, Award, Search, Calendar, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AttendanceQrView = ({ events = [] }) => {
  const [selectedEventId, setSelectedEventId] = useState(events[0]?._id || '');
  const [ticketInput, setTicketInput] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loadingAttendance, setLoadingAttendance] = useState(false);
  const [issuingCerts, setIssuingCerts] = useState(false);

  useEffect(() => {
    if (events.length > 0 && !selectedEventId) {
      setSelectedEventId(events[0]._id);
    }
  }, [events]);

  const fetchAttendanceRoster = async (eventId) => {
    if (!eventId) return;
    setLoadingAttendance(true);
    try {
      const res = await axios.get(`/api/attendance/event/${eventId}`, { withCredentials: true });
      setAttendanceData(res.data);
    } catch (err) {
      console.error('Failed to load event attendance roster:', err);
    } finally {
      setLoadingAttendance(false);
    }
  };

  useEffect(() => {
    if (selectedEventId) {
      fetchAttendanceRoster(selectedEventId);
    }
  }, [selectedEventId]);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!ticketInput.trim()) return toast.error('Please scan QR or enter ticket code');

    setScanning(true);
    setScanResult(null);
    try {
      const res = await axios.post('/api/attendance/check-in', {
        ticketCode: ticketInput.trim(),
        eventId: selectedEventId || undefined
      }, { withCredentials: true });

      setScanResult({
        success: true,
        message: res.data.message,
        student: res.data.student,
        checkedInAt: res.data.attendance?.checkedInAt
      });
      toast.success(res.data.message);
      setTicketInput('');
      fetchAttendanceRoster(selectedEventId);
    } catch (err) {
      const data = err.response?.data;
      if (data?.alreadyCheckedIn) {
        setScanResult({
          success: false,
          alreadyCheckedIn: true,
          message: data.message,
          student: data.student,
          checkedInAt: data.checkedInAt
        });
        toast.error(data.message);
      } else {
        toast.error(data?.message || 'Verification failed. Invalid pass code.');
      }
    } finally {
      setScanning(false);
    }
  };

  const handleIssueCertificates = async () => {
    if (!selectedEventId) return;
    if (!window.confirm('Issue digital participation certificates to all verified attendees for this event?')) return;

    setIssuingCerts(true);
    try {
      const res = await axios.post(`/api/attendance/event/${selectedEventId}/issue-certificates`, {
        certificateTitle: 'Certificate of Verified Participation'
      }, { withCredentials: true });

      toast.success(res.data.message || 'Certificates issued successfully!');
      fetchAttendanceRoster(selectedEventId);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to issue certificates');
    } finally {
      setIssuingCerts(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Event Selection Bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <QrCode className="text-primary-600" size={24} />
            Attendance & QR Check-in Terminal
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Real-time event registration verification, duplicate check-in detection, and verified certificate qualification.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 outline-none w-full md:w-72"
          >
            <option value="">-- Choose Event --</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title} ({new Date(ev.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Scanner & Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-in Input Panel */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Scan Station</span>
              <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 font-bold text-[10px] rounded-full border border-emerald-100 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Terminal Ready
              </span>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                  Pass Code / QR Barcode Scanner Input
                </label>
                <input
                  type="text"
                  placeholder="e.g. QR-A9B4-998C-3210 or Roll No"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  autoFocus
                  className="w-full px-4 py-3 bg-gray-50 border-2 border-primary-200 focus:border-primary-600 rounded-2xl text-sm font-mono font-bold outline-none transition"
                />
              </div>

              <button
                type="submit"
                disabled={scanning}
                className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-md transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShieldCheck size={16} />
                {scanning ? 'Verifying...' : 'Validate & Mark Attendance'}
              </button>
            </form>
          </div>

          {/* Scan Feedback Result Card */}
          <AnimatePresence>
            {scanResult && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className={`mt-4 p-4 rounded-2xl border ${
                  scanResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                    : 'bg-rose-50 border-rose-200 text-rose-950'
                }`}
              >
                <div className="flex items-center gap-3">
                  {scanResult.success ? (
                    <CheckCircle2 size={24} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle size={24} className="text-rose-600 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-black text-sm">{scanResult.success ? 'Attendance Verified!' : 'Check-in Rejected'}</h4>
                    <p className="text-xs font-medium mt-0.5">{scanResult.message}</p>
                    {scanResult.student && (
                      <p className="text-xs font-bold mt-1">
                        Student: {scanResult.student.name} ({scanResult.student.roll_no || 'No Roll No'})
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Attendance KPI Cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-slate-400">Total Registered</p>
              <h3 className="text-3xl font-black mt-1 text-white">{attendanceData?.stats?.totalRegistered || 0}</h3>
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Event passes issued</p>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-emerald-600">Present / Verified</p>
              <h3 className="text-3xl font-black mt-1 text-emerald-950">{attendanceData?.stats?.totalAttended || 0}</h3>
            </div>
            <p className="text-xs text-emerald-700 mt-2 font-bold">{attendanceData?.stats?.attendanceRate || 0}% turnout rate</p>
          </div>

          <div className="bg-gradient-to-br from-indigo-600 to-primary-700 text-white p-5 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase font-bold text-indigo-100">Certificate Action</p>
              <h4 className="text-base font-black mt-1">Instant Issuance</h4>
              <p className="text-xs text-indigo-100 mt-1">Reward verified attendees with tamper-proof certificates.</p>
            </div>
            <button
              onClick={handleIssueCertificates}
              disabled={issuingCerts || !attendanceData?.stats?.totalAttended}
              className="mt-3 py-2 px-3 bg-white text-indigo-900 rounded-xl text-xs font-bold hover:bg-indigo-50 transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} />
              {issuingCerts ? 'Issuing...' : 'Issue Verified Certificates'}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Attendance Roster */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Event Roster & Real-time Check-in Log</h3>
          <span className="text-xs text-gray-400 font-medium">
            {attendanceData?.records?.length || 0} student entries recorded
          </span>
        </div>

        {loadingAttendance ? (
          <div className="p-8 text-center text-gray-400 font-medium text-xs">Loading attendee records...</div>
        ) : !attendanceData?.records?.length ? (
          <div className="p-12 text-center text-gray-400">
            <Users size={32} className="mx-auto mb-2 text-gray-300" />
            <p className="font-bold text-gray-700 text-sm">No registrations found for this event</p>
            <p className="text-xs text-gray-400 mt-1">Students will appear here once they register for the event.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-black">
                  <th className="py-3 px-6">Roll Number</th>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6">Branch</th>
                  <th className="py-3 px-6">Ticket Code</th>
                  <th className="py-3 px-6">Check-in Status</th>
                  <th className="py-3 px-6">Check-in Timestamp</th>
                  <th className="py-3 px-6">Certificate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-medium">
                {attendanceData.records.map((rec) => (
                  <tr key={rec._id} className="hover:bg-gray-50">
                    <td className="py-3 px-6 font-mono font-bold text-primary-700">
                      {rec.userId?.roll_no || rec.roll_no || 'N/A'}
                    </td>
                    <td className="py-3 px-6 font-bold text-gray-900">{rec.userId?.name || 'Student'}</td>
                    <td className="py-3 px-6">{rec.userId?.department || 'GENERAL'}</td>
                    <td className="py-3 px-6 font-mono text-gray-500">{rec.ticketCode}</td>
                    <td className="py-3 px-6">
                      {rec.status === 'Attended' ? (
                        <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[10px] flex items-center gap-1 w-fit">
                          <CheckCircle2 size={12} /> ATTENDED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded-md font-bold text-[10px] w-fit block">
                          REGISTERED
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-6 text-gray-500">
                      {rec.checkedInAt ? new Date(rec.checkedInAt).toLocaleTimeString() : '-'}
                    </td>
                    <td className="py-3 px-6">
                      {rec.certificateIssued ? (
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">
                          ISSUED
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AttendanceQrView;
