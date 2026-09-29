import { Link } from 'react-router-dom';
import { Users, Info, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ClubCard = ({ club }) => {
  return (
    <motion.div 
      whileHover={{ y: -8 }}
      className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.1)] overflow-hidden transition-all duration-300 border border-gray-100 group flex flex-col h-full cursor-pointer"
    >
      <div className="h-48 bg-primary-100 relative overflow-hidden">
        {club.logo ? (
          <img src={club.logo} alt={club.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-tr from-primary-400 to-primary-600 group-hover:scale-110 transition-transform duration-700 ease-in-out">
            <h3 className="text-3xl font-black text-white text-center opacity-80">{club.name.substring(0,2).toUpperCase()}</h3>
          </div>
        )}
        {/* Gradient overlay for title contrast if needed, or just a styling element */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>
      
      <div className="p-6 flex flex-col flex-1 relative bg-white">
        {/* Float badge overlapping image */}
        <div className="absolute -top-5 right-6 bg-white p-1 rounded-full shadow-sm">
          <div className="bg-green-100 text-green-600 w-8 h-8 rounded-full flex items-center justify-center">
             <Users size={16} />
          </div>
        </div>

        <h3 className="text-2xl font-black text-gray-900 mb-2 leading-tight">{club.name}</h3>
        
        <div className="flex items-center text-sm text-gray-500 font-bold mb-6">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          {club.members?.length || 0} Active Members
        </div>

        <Link 
          to={`/clubs/${club._id}`} 
          className="mt-auto flex items-center justify-center w-full py-4 bg-amber-50 text-amber-600 rounded-xl font-black hover:bg-amber-100 hover:text-amber-700 transition-colors group/btn"
        >
          <span>View Details</span>
          <ChevronRight size={18} className="ml-1 transition-transform group-hover/btn:translate-x-1" />
        </Link>
      </div>
    </motion.div>
  );
};

export default ClubCard;
