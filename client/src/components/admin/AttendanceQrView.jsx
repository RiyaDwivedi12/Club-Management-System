import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { QrCode, CheckCircle2, AlertTriangle, Users, Award, ShieldCheck, Ticket } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../ui/PageHeader';
import StatTile from '../ui/StatTile';

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
      <PageHeader
        icon={QrCode}
        eyebrow="Check-in"
        title="Attendance & QR Check-in"
        description="Real-time event registration verification, duplicate check-in detection, and verified certificate qualification."
        actions={
          <select
            value={selectedEventId}
            onChange={(e) => setSelectedEventId(e.target.value)}
            className="input w-full sm:w-72"
            aria-label="Choose event"
          >
            <option value="">-- Choose Event --</option>
            {events.map((ev) => (
              <option key={ev._id} value={ev._id}>
                {ev.title} ({new Date(ev.date).toLocaleDateString()})
              </option>
            ))}
          </select>
        }
      />

      {/* Main Scanner & Statistics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-in Input Panel */}
        <div className="card p-5 sm:p-6 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center justify-between gap-2 mb-4">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Scan station</span>
              <span className="badge-green">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Terminal Ready
              </span>
            </div>

            <form onSubmit={handleScanSubmit} className="space-y-4">
              <div>
                <label className="label">
                  Pass code / QR barcode scanner input
                </label>
                <input
                  type="text"
                  placeholder="e.g. QR-A9B4-998C-3210 or Roll No"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  autoFocus
                  className="input font-mono font-semibold py-3"
                />
              </div>

              <button
                type="submit"
                disabled={scanning}
                className="btn-primary w-full py-3 disabled:opacity-50"
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
                className={`mt-4 p-4 rounded-xl border ${
                  scanResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-red-50 border-red-200 text-red-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  {scanResult.success ? (
                    <CheckCircle2 size={22} className="text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle size={22} className="text-red-600 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm">{scanResult.success ? 'Attendance Verified!' : 'Check-in Rejected'}</h4>
                    <p className="text-xs mt-0.5 break-words">{scanResult.message}</p>
                    {scanResult.student && (
                      <p className="text-xs font-semibold mt-1 break-words">
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
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4 content-start">
          <StatTile
            icon={Ticket}
            label="Total registered"
            value={attendanceData?.stats?.totalRegistered || 0}
            hint="Event passes issued"
            tint="blue"
          />
          <StatTile
            icon={CheckCircle2}
            label="Present / verified"
            value={attendanceData?.stats?.totalAttended || 0}
            hint={`${attendanceData?.stats?.attendanceRate || 0}% turnout rate`}
            tint="emerald"
          />

          <div className="relative overflow-hidden rounded-2xl bg-brand-gradient text-white p-5 shadow-brand flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-200">Certificate action</p>
              <h4 className="text-base font-bold mt-1">Instant Issuance</h4>
              <p className="text-xs text-blue-100/85 mt-1 leading-relaxed">Reward verified attendees with tamper-proof certificates.</p>
            </div>
            <button
              onClick={handleIssueCertificates}
              disabled={issuingCerts || !attendanceData?.stats?.totalAttended}
              className="btn btn-sm mt-3 bg-white text-blue-700 hover:bg-blue-50 shadow-sm disabled:opacity-50"
            >
              <Award size={14} />
              {issuingCerts ? 'Issuing...' : 'Issue Verified Certificates'}
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Attendance Roster */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="card-title">Event Roster & Check-in Log</h3>
          <span className="text-xs text-slate-400 font-medium">
            {attendanceData?.records?.length || 0} student entries recorded
          </span>
        </div>

        {loadingAttendance ? (
          <div className="p-10 flex flex-col items-center gap-3 text-slate-400 text-sm">
            <div className="spinner" />
            Loading attendee records...
          </div>
        ) : !attendanceData?.records?.length ? (
          <div className="p-12 text-center">
            <div className="icon-tile bg-slate-100 text-slate-400 mx-auto mb-3">
              <Users size={20} />
            </div>
            <p className="font-bold text-dark-900 text-sm">No registrations found for this event</p>
            <p className="text-xs text-slate-500 mt-1">Students will appear here once they register for the event.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="data-table text-xs">
              <thead>
                <tr>
                  <th>Roll Number</th>
                  <th>Student Name</th>
                  <th>Branch</th>
                  <th>Ticket Code</th>
                  <th>Check-in Status</th>
                  <th>Check-in Timestamp</th>
                  <th>Certificate</th>
                </tr>
              </thead>
              <tbody>
                {attendanceData.records.map((rec) => (
                  <tr key={rec._id}>
                    <td className="font-mono font-semibold text-blue-700 whitespace-nowrap">
                      {rec.userId?.roll_no || rec.roll_no || 'N/A'}
                    </td>
                    <td className="font-semibold text-dark-900 whitespace-nowrap">{rec.userId?.name || 'Student'}</td>
                    <td>{rec.userId?.department || 'GENERAL'}</td>
                    <td className="font-mono text-slate-500 whitespace-nowrap">{rec.ticketCode}</td>
                    <td className="whitespace-nowrap">
                      {rec.status === 'Attended' ? (
                        <span className="badge-green">
                          <CheckCircle2 size={12} /> Attended
                        </span>
                      ) : (
                        <span className="badge-slate">
                          Registered
                        </span>
                      )}
                    </td>
                    <td className="text-slate-500 whitespace-nowrap">
                      {rec.checkedInAt ? new Date(rec.checkedInAt).toLocaleTimeString() : '-'}
                    </td>
                    <td>
                      {rec.certificateIssued ? (
                        <span className="badge-indigo">
                          Issued
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
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
