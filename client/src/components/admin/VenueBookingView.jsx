import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapPin, AlertTriangle, CheckCircle2, Shield, Plus, Building2, Users, X, CalendarClock } from 'lucide-react';
import PageHeader from '../ui/PageHeader';

const BOOKING_STATUS_BADGE = {
  Approved: 'badge-green',
  Rejected: 'badge-red',
  Cancelled: 'badge-slate'
};

const VenueBookingView = ({ clubs = [] }) => {
  const [venues, setVenues] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showVenueModal, setShowVenueModal] = useState(false);

  // New venue form state
  const [newVenueForm, setNewVenueForm] = useState({
    name: '',
    type: 'Auditorium',
    capacity: 100,
    location: '',
    isRestricted: false,
    features: ''
  });

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    venueId: '',
    clubId: '',
    title: '',
    startTime: '',
    endTime: '',
    purpose: '',
    equipmentRequested: ''
  });

  // Availability checker state
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);

  const fetchVenueData = async () => {
    setLoading(true);
    try {
      const [venuesRes, bookingsRes] = await Promise.all([
        axios.get('/api/venues', { withCredentials: true }),
        axios.get('/api/venues/bookings', { withCredentials: true })
      ]);
      setVenues(venuesRes.data);
      setBookings(bookingsRes.data);
    } catch (err) {
      toast.error('Failed to load campus venues and reservations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenueData();
  }, []);

  const handleCheckSlotAvailability = async () => {
    if (!bookingForm.venueId || !bookingForm.startTime || !bookingForm.endTime) {
      return toast.error('Select a venue, start time, and end time to verify availability.');
    }

    setCheckingAvailability(true);
    setAvailabilityResult(null);
    try {
      const res = await axios.post('/api/venues/check-availability', {
        venueId: bookingForm.venueId,
        startTime: bookingForm.startTime,
        endTime: bookingForm.endTime
      }, { withCredentials: true });

      setAvailabilityResult(res.data);
      if (res.data.available) {
        toast.success('Selected time slot is completely clear!');
      } else {
        toast.error(`Conflict! ${res.data.conflictCount} overlapping reservation(s) exist.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Availability check failed');
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleCreateBooking = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/venues/bookings', {
        ...bookingForm,
        equipmentRequested: bookingForm.equipmentRequested ? bookingForm.equipmentRequested.split(',').map(s => s.trim()) : []
      }, { withCredentials: true });

      toast.success(res.data.message || 'Booking registered successfully');
      setShowCreateModal(false);
      setBookingForm({ venueId: '', clubId: '', title: '', startTime: '', endTime: '', purpose: '', equipmentRequested: '' });
      setAvailabilityResult(null);
      fetchVenueData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit reservation');
    }
  };

  const handleCreateVenue = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/venues', newVenueForm, { withCredentials: true });
      toast.success('Campus venue added successfully!');
      setShowVenueModal(false);
      setNewVenueForm({ name: '', type: 'Auditorium', capacity: 100, location: '', isRestricted: false, features: '' });
      fetchVenueData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add venue');
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`/api/venues/bookings/${id}/status`, { status }, { withCredentials: true });
      toast.success(`Booking ${status.toLowerCase()} successfully`);
      fetchVenueData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update booking status');
    }
  };

  const handleReturnEquipment = async (id) => {
    try {
      await axios.put(`/api/venues/bookings/${id}/equipment-return`, {}, { withCredentials: true });
      toast.success('Equipment recorded as returned');
      fetchVenueData();
    } catch (err) {
      toast.error('Failed to update equipment status');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Building2}
        eyebrow="Facilities"
        title="Resource & Venue Booking"
        description="Reserve classrooms, auditoriums, sports grounds, and equipment with real-time overlap collision detection."
        actions={
          <>
            <button onClick={() => setShowVenueModal(true)} className="btn-secondary">
              <Plus size={15} /> Add Facility
            </button>
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <CalendarClock size={16} /> New Reservation
            </button>
          </>
        }
      />

      {/* Campus Facilities Catalog */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {venues.map((v) => (
          <div key={v._id} className="card card-hover p-5 min-w-0">
            <div className="flex justify-between items-start gap-2 mb-3">
              <span className="badge-blue">
                {v.type}
              </span>
              {v.isRestricted ? (
                <span className="badge-amber">
                  <Shield size={11} /> Restricted
                </span>
              ) : (
                <span className="badge-green">
                  Open booking
                </span>
              )}
            </div>
            <h4 className="font-bold text-dark-900 text-base break-words">{v.name}</h4>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1.5 min-w-0">
              <MapPin size={13} className="text-slate-400 shrink-0" /> <span className="truncate">{v.location}</span>
            </p>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-1">
              <Users size={13} className="text-slate-400 shrink-0" /> Capacity: <span className="font-semibold text-slate-700">{v.capacity} seats</span>
            </p>

            {v.features?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                {v.features.map((f, i) => (
                  <span key={i} className="text-[11px] bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bookings & Reservations Queue */}
      <div className="card overflow-hidden">
        <div className="card-header">
          <h3 className="card-title">Scheduled Campus Reservations <span className="text-slate-400 font-semibold">({bookings.length})</span></h3>
        </div>

        <div className="table-wrap">
          <table className="data-table text-xs">
            <thead>
              <tr>
                <th>Venue / Facility</th>
                <th>Event / Purpose</th>
                <th>Reserved By</th>
                <th>Time Slot</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b._id}>
                  <td className="font-semibold text-dark-900 min-w-[140px]">
                    {b.venueId?.name || 'Venue'}
                    <span className="block text-[11px] text-slate-400 font-normal">{b.venueId?.location}</span>
                  </td>
                  <td className="min-w-[160px]">
                    <span className="font-semibold text-slate-800">{b.title}</span>
                    {b.purpose && <span className="block text-[11px] text-slate-400">{b.purpose}</span>}
                  </td>
                  <td className="whitespace-nowrap">{b.bookedBy?.name || 'User'}</td>
                  <td className="whitespace-nowrap">
                    <span className="block font-semibold text-slate-800">
                      {new Date(b.startTime).toLocaleDateString()}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td>
                    <span className={BOOKING_STATUS_BADGE[b.status] || 'badge-amber'}>
                      {b.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                      {b.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(b._id, 'Approved')}
                            className="btn-success btn-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(b._id, 'Rejected')}
                            className="btn-danger btn-sm"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {b.status === 'Approved' && !b.equipmentReturned && (
                        <button
                          onClick={() => handleReturnEquipment(b._id)}
                          className="btn-soft btn-sm"
                        >
                          Confirm Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Reservation Modal */}
      {showCreateModal && (
        <div className="modal-overlay">
          <div className="modal-panel sm:max-w-xl p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-dark-900">Reserve Campus Venue or Facility</h3>
                <p className="text-sm text-slate-500 mt-0.5">Select venue and timeframe to execute automatic collision checking.</p>
              </div>
              <button type="button" onClick={() => setShowCreateModal(false)} className="btn-icon shrink-0" aria-label="Close">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateBooking} className="space-y-4">
              <div>
                <label className="label">Select facility</label>
                <select
                  required
                  value={bookingForm.venueId}
                  onChange={(e) => setBookingForm({ ...bookingForm, venueId: e.target.value })}
                  className="input"
                >
                  <option value="">-- Choose Venue --</option>
                  {venues.map((v) => (
                    <option key={v._id} value={v._id}>
                      {v.name} ({v.type} - Capacity: {v.capacity}) {v.isRestricted ? '[Approval Req.]' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="label">Event / booking title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Annual Tech Symposium Keynote"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Start time</label>
                  <input
                    required
                    type="datetime-local"
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="input"
                  />
                </div>
                <div>
                  <label className="label">End time</label>
                  <input
                    required
                    type="datetime-local"
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              {/* Pre-check availability button */}
              <button
                type="button"
                onClick={handleCheckSlotAvailability}
                disabled={checkingAvailability}
                className="btn-soft w-full"
              >
                {checkingAvailability ? 'Verifying Calendar...' : 'Check Time Slot Availability'}
              </button>

              {availabilityResult && (
                <div className={`p-3 rounded-xl border text-sm ${
                  availabilityResult.available ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {availabilityResult.available ? (
                    <div className="flex items-center gap-2 font-semibold">
                      <CheckCircle2 size={16} className="shrink-0" /> Slot available without any collision.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-semibold">
                      <AlertTriangle size={16} className="shrink-0" /> Overlap detected with existing reservations!
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="label">Purpose / details</label>
                <textarea
                  rows={2}
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  placeholder="State the purpose of this reservation..."
                  className="input"
                />
              </div>

              <div>
                <label className="label">Equipment requested (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Wireless Mics, HDMI Switcher, Podium"
                  value={bookingForm.equipmentRequested}
                  onChange={(e) => setBookingForm({ ...bookingForm, equipmentRequested: e.target.value })}
                  className="input"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Facility Modal */}
      {showVenueModal && (
        <div className="modal-overlay">
          <div className="modal-panel sm:max-w-md p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3 mb-5">
              <h3 className="text-lg font-bold text-dark-900">Add Campus Facility</h3>
              <button type="button" onClick={() => setShowVenueModal(false)} className="btn-icon shrink-0" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateVenue} className="space-y-4">
              <div>
                <label className="label">Facility name</label>
                <input
                  required
                  type="text"
                  value={newVenueForm.name}
                  onChange={(e) => setNewVenueForm({ ...newVenueForm, name: e.target.value })}
                  placeholder="e.g. Newton Seminar Hall 2"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select
                    value={newVenueForm.type}
                    onChange={(e) => setNewVenueForm({ ...newVenueForm, type: e.target.value })}
                    className="input"
                  >
                    <option value="Auditorium">Auditorium</option>
                    <option value="Classroom">Classroom</option>
                    <option value="Lab">Lab</option>
                    <option value="Sports Ground">Sports Ground</option>
                    <option value="Conference Hall">Conference Hall</option>
                    <option value="Equipment">Equipment</option>
                  </select>
                </div>

                <div>
                  <label className="label">Capacity</label>
                  <input
                    type="number"
                    value={newVenueForm.capacity}
                    onChange={(e) => setNewVenueForm({ ...newVenueForm, capacity: Number(e.target.value) })}
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label className="label">Campus location</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Block C, 3rd Floor"
                  value={newVenueForm.location}
                  onChange={(e) => setNewVenueForm({ ...newVenueForm, location: e.target.value })}
                  className="input"
                />
              </div>

              <div>
                <label className="label">Features (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Projector, AC, Wi-Fi"
                  value={newVenueForm.features}
                  onChange={(e) => setNewVenueForm({ ...newVenueForm, features: e.target.value })}
                  className="input"
                />
              </div>

              <label className="flex items-start gap-2.5 text-sm font-medium text-slate-700 cursor-pointer p-3 rounded-xl bg-slate-50 border border-slate-100">
                <input
                  type="checkbox"
                  checked={newVenueForm.isRestricted}
                  onChange={(e) => setNewVenueForm({ ...newVenueForm, isRestricted: e.target.checked })}
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                Restricted Venue (Requires Administrative Approval)
              </label>

              <div className="pt-4 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVenueModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  Save Facility
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VenueBookingView;
