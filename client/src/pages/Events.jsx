import { useState, useEffect } from 'react';
import useEventStore from '../store/eventStore';
import useAuthStore from '../store/authStore';
import EventCard from '../components/EventCard';
import { Filter, Plus, Calendar as CalendarIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      className="p-4 md:p-8 relative min-h-screen"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">Campus Events</h1>
          <p className="text-gray-500 font-medium text-lg">Discover and participate in exciting activities.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-white p-2 rounded-2xl border border-gray-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:border-primary-300 transition-colors">
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
              className="hidden md:flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-6 py-4 rounded-2xl font-black shadow-[0_8px_20px_-8px_rgba(79,70,229,0.5)] transition-all hover:-translate-y-1 hover:shadow-[0_12px_24px_-8px_rgba(79,70,229,0.6)]"
            >
              <Plus size={20} />
              <span>Create Event</span>
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
          className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6 lg:gap-8"
        >
          <AnimatePresence>
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, index) => (
                <motion.div
                  key={event._id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="h-full"
                >
                  <EventCard event={event} onJoin={handleJoin} />
                </motion.div>
              ))
            ) : (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="col-span-full py-16 text-center text-gray-500 font-medium bg-white rounded-[32px] border border-dashed border-gray-200"
              >
                <CalendarIcon size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-lg">No events found for this filter.</p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* FAB for Mobile Create Event */}
      {canCreateEvent && (
        <button 
          onClick={() => setShowCreateModal(true)}
          className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-primary-600 text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_-8px_rgba(79,70,229,0.8)] z-40 hover:bg-primary-700 hover:scale-105 transition-all"
        >
          <Plus size={24} />
        </button>
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
    </motion.div>
  );
};

export default Events;
