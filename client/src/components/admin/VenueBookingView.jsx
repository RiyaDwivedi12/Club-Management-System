import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { MapPin, Calendar, Clock, AlertTriangle, CheckCircle2, XCircle, Shield, Plus, Building2, Radio } from 'lucide-react';
import { motion } from 'framer-motion';

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
      {/* Header bar */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
            <Building2 className="text-primary-600" size={24} />
            Resource & Venue Booking Console
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Reserve classrooms, auditoriums, sports grounds, and equipment with real-time overlap collision detection.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowVenueModal(true)}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition"
          >
            + Add Facility
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center gap-1.5"
          >
            <Plus size={16} /> New Reservation
          </button>
        </div>
      </div>

      {/* Campus Facilities Catalog */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {venues.map((v) => (
          <div key={v._id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
            <div className="flex justify-between items-start mb-2">
              <span className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-md font-bold text-[10px]">
                {v.type}
              </span>
              {v.isRestricted ? (
                <span className="px-2 py-0.5 bg-amber-50 text-amber-800 rounded-md font-bold text-[10px] flex items-center gap-1">
                  <Shield size={10} /> RESTRICTED
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-bold text-[10px]">
                  OPEN BOOKING
                </span>
              )}
            </div>
            <h4 className="font-bold text-gray-900 text-sm">{v.name}</h4>
            <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
              <MapPin size={12} className="text-gray-400" /> {v.location}
            </p>
            <p className="text-xs text-gray-600 mt-1">Capacity: <span className="font-bold">{v.capacity} seats</span></p>

            <div className="flex flex-wrap gap-1 mt-3">
              {v.features?.map((f, i) => (
                <span key={i} className="text-[10px] bg-gray-50 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                  {f}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bookings & Reservations Queue */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-900 text-sm">Scheduled Campus Reservations ({bookings.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50/75 border-b border-gray-100 text-gray-500 uppercase tracking-wider font-black">
                <th className="py-3 px-6">Venue / Facility</th>
                <th className="py-3 px-6">Event / Purpose</th>
                <th className="py-3 px-6">Reserved By</th>
                <th className="py-3 px-6">Time Slot</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-medium">
              {bookings.map((b) => (
                <tr key={b._id} className="hover:bg-gray-50">
                  <td className="py-3 px-6 font-bold text-gray-900">
                    {b.venueId?.name || 'Venue'}
                    <span className="block text-[10px] text-gray-400 font-normal">{b.venueId?.location}</span>
                  </td>
                  <td className="py-3 px-6">
                    <span className="font-semibold text-gray-800">{b.title}</span>
                    {b.purpose && <span className="block text-[10px] text-gray-400">{b.purpose}</span>}
                  </td>
                  <td className="py-3 px-6">{b.bookedBy?.name || 'User'}</td>
                  <td className="py-3 px-6">
                    <span className="block font-semibold">
                      {new Date(b.startTime).toLocaleDateString()}
                    </span>
                    <span className="text-[10px] text-gray-500">
                      {new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </td>
                  <td className="py-3 px-6">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      b.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                      b.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                      b.status === 'Cancelled' ? 'bg-gray-100 text-gray-600' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {b.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-6 text-right space-x-2">
                    {b.status === 'Pending' && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(b._id, 'Approved')}
                          className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-bold"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(b._id, 'Rejected')}
                          className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {b.status === 'Approved' && !b.equipmentReturned && (
                      <button
                        onClick={() => handleReturnEquipment(b._id)}
                        className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg text-[10px] font-bold"
                      >
                        Confirm Return
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Reservation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-gray-900 mb-1">Reserve Campus Venue or Facility</h3>
            <p className="text-xs text-gray-500 mb-4">Select venue and timeframe to execute automatic collision checking.</p>

            <form onSubmit={handleCreateBooking} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Select Facility</label>
                <select
                  required
                  value={bookingForm.venueId}
                  onChange={(e) => setBookingForm({ ...bookingForm, venueId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none"
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
                <label className="block font-bold text-gray-700 uppercase mb-1">Event / Booking Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Annual Tech Symposium Keynote"
                  value={bookingForm.title}
                  onChange={(e) => setBookingForm({ ...bookingForm, title: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Start Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={bookingForm.startTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">End Time</label>
                  <input
                    required
                    type="datetime-local"
                    value={bookingForm.endTime}
                    onChange={(e) => setBookingForm({ ...bookingForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  />
                </div>
              </div>

              {/* Pre-check availability button */}
              <button
                type="button"
                onClick={handleCheckSlotAvailability}
                disabled={checkingAvailability}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition"
              >
                {checkingAvailability ? 'Verifying Calendar...' : 'Check Time Slot Availability'}
              </button>

              {availabilityResult && (
                <div className={`p-3 rounded-xl border text-xs ${
                  availabilityResult.available ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  {availabilityResult.available ? (
                    <div className="flex items-center gap-2 font-bold">
                      <CheckCircle2 size={16} /> Slot available without any collision.
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 font-bold">
                      <AlertTriangle size={16} /> Overlap detected with existing reservations!
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Purpose / Details</label>
                <textarea
                  rows={2}
                  value={bookingForm.purpose}
                  onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                  placeholder="State the purpose of this reservation..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Equipment Requested (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Wireless Mics, HDMI Switcher, Podium"
                  value={bookingForm.equipmentRequested}
                  onChange={(e) => setBookingForm({ ...bookingForm, equipmentRequested: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md"
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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-gray-900 mb-4">Add Campus Facility</h3>
            <form onSubmit={handleCreateVenue} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Facility Name</label>
                <input
                  required
                  type="text"
                  value={newVenueForm.name}
                  onChange={(e) => setNewVenueForm({ ...newVenueForm, name: e.target.value })}
                  placeholder="e.g. Newton Seminar Hall 2"
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Type</label>
                  <select
                    value={newVenueForm.type}
                    onChange={(e) => setNewVenueForm({ ...newVenueForm, type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none"
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
                  <label className="block font-bold text-gray-700 uppercase mb-1">Capacity</label>
                  <input
                    type="number"
                    value={newVenueForm.capacity}
                    onChange={(e) => setNewVenueForm({ ...newVenueForm, capacity: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Campus Location</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Block C, 3rd Floor"
                  value={newVenueForm.location}
                  onChange={(e) => setNewVenueForm({ ...newVenueForm, location: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Features (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Projector, AC, Wi-Fi"
                  value={newVenueForm.features}
                  onChange={(e) => setNewVenueForm({ ...newVenueForm, features: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                />
              </div>

              <label className="flex items-center gap-2 font-bold text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newVenueForm.isRestricted}
                  onChange={(e) => setNewVenueForm({ ...newVenueForm, isRestricted: e.target.checked })}
                  className="rounded text-primary-500"
                />
                Restricted Venue (Requires Administrative Approval)
              </label>

              <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowVenueModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-md"
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
