import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { motion } from 'framer-motion';
import useAuthStore from '../store/authStore';

const EventCard = ({ event, onJoin }) => {
  const { user } = useAuthStore();
  
  const formattedDate = new Date(event.date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
  
  const statusColors = {
    upcoming: 'bg-primary-100 text-primary-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
  };

  const isJoined = user && event.participants?.includes(user._id);

  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="soft-card p-5 flex flex-col h-full"
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-xs font-black uppercase tracking-wider text-gray-400">
          {event.category}
        </span>
        <span className={`text-xs font-bold px-3 py-1 rounded-full ${statusColors[event.status] || statusColors.upcoming}`}>
          {event.status}
        </span>
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
      <p className="text-gray-500 text-sm mb-6 line-clamp-2 flex-grow font-medium">{event.description}</p>
      
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex items-center text-sm font-bold text-gray-700 bg-gray-50 p-2.5 rounded-xl">
          <Calendar size={18} className="mr-3 text-primary-500" />
          <span>{formattedDate}</span>
        </div>
        <div className="flex items-center text-sm font-bold text-gray-700 bg-gray-50 p-2.5 rounded-xl">
          <Users size={18} className="mr-3 text-primary-500" />
          <span>{event.participants?.length || 0} / {event.maxParticipants === 0 ? 'Unlimited' : event.maxParticipants} Attendees</span>
        </div>
      </div>
      
      {user && user.role === 'student' && event.status === 'upcoming' && (
        <button 
          onClick={() => onJoin && onJoin(event._id)}
          disabled={isJoined}
          className={`w-full py-3.5 rounded-2xl font-bold transition-all ${
            isJoined 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-primary-500 text-white hover:bg-primary-600 shadow-soft-purple hover:-translate-y-1'
          }`}
        >
          {isJoined ? 'Already Joined' : 'Join Event'}
        </button>
      )}
    </motion.div>
  );
};

export default EventCard;
