import { useState, useEffect } from 'react';
import useEventStore from '../store/eventStore';
import useAuthStore from '../store/authStore';
import EventCard from '../components/EventCard';
import { Filter, Plus } from 'lucide-react';
import { motion } from 'framer-motion';

const Events = () => {
  const { events, fetchEvents, joinEvent, isLoading, error } = useEventStore();
  const { user } = useAuthStore();
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleJoin = async (eventId) => {
    await joinEvent(eventId);
  };

  const filteredEvents = filter === 'all' ? events : events.filter(e => e.status === filter);
  
  const canCreateEvent = user && (user.role === 'president' || user.role === 'faculty' || user.role === 'admin');

  return (
    <div className="p-4 md:p-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2">Campus Events</h1>
          <p className="text-gray-500 font-medium">Discover and participate in exciting activities.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white p-1 rounded-2xl shadow-sm border border-gray-100">
            <Filter size={18} className="text-primary-500 ml-3" />
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-sm font-bold text-gray-700 py-3 pl-2 pr-8 cursor-pointer rounded-2xl"
            >
              <option value="all">All Events</option>
              <option value="upcoming">Upcoming</option>
              <option value="ongoing">Ongoing</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          
          {canCreateEvent && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-2xl font-bold shadow-soft-purple transition-transform hover:-translate-y-1"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Create Event</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6 font-medium">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
        >
          {filteredEvents.length > 0 ? (
            filteredEvents.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="h-full"
              >
                <EventCard event={event} onJoin={handleJoin} />
              </motion.div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center text-gray-500 font-medium bg-white rounded-3xl shadow-sm border border-gray-100">
              No events found for this filter.
            </div>
          )}
        </motion.div>
      )}
      
      {/* Basic Create Event Modal Placeholder */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full">
             <h2 className="text-2xl font-black mb-4">Create New Event</h2>
             <p className="text-gray-500 mb-6">Event creation form goes here.</p>
             <button onClick={() => setShowCreateModal(false)} className="w-full py-3 bg-gray-100 rounded-xl font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Events;
