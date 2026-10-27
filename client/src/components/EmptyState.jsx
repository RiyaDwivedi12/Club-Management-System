import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, title, description }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center p-12 text-center"
    >
      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
        {Icon && (typeof Icon === 'function' ? <Icon size={40} className="text-slate-300" strokeWidth={1.5} /> : Icon)}
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-2">{title}</h3>
      {description && <p className="text-slate-500 max-w-md">{description}</p>}
    </motion.div>
  );
};

export default EmptyState;
