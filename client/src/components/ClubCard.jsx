import { Link } from 'react-router-dom';
import { Users, Info, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

const ClubCard = ({ club }) => {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="soft-card overflow-hidden transition-all duration-300 p-2"
    >
      <div className="flex flex-col h-full">
        <div className="h-32 bg-primary-100 rounded-2xl relative overflow-hidden mb-4">
          {club.logo ? (
            <img src={club.logo} alt={club.name} className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center p-4 bg-gradient-to-tr from-primary-400 to-primary-600">
              <h3 className="text-xl font-bold text-white text-center">{club.name}</h3>
            </div>
          )}
        </div>
        
        <div className="px-3 pb-3 flex flex-col flex-1">
          <h3 className="text-xl font-bold text-gray-900 mb-1">{club.name}</h3>
          
          <div className="flex items-center text-sm text-gray-500 font-bold mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
            {club.members?.length || 0} Active Members
          </div>

          <Link 
            to={`/clubs/${club._id}`} 
            className="mt-auto flex items-center justify-center w-full py-3 bg-primary-50 text-primary-600 rounded-xl font-bold hover:bg-primary-100 transition-colors"
          >
            <span>View Details</span>
            <ChevronRight size={18} className="ml-1" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
};

export default ClubCard;
