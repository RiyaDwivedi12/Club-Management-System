import { isValidElement } from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ icon: Icon, title, description, action, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center justify-center px-6 py-12 text-center ${className}`}
    >
      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-5 text-blue-600">
        {Icon && (isValidElement(Icon) ? Icon : <Icon size={30} strokeWidth={1.75} />)}
      </div>
      <h3 className="text-lg font-bold text-dark-900 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-slate-500 max-w-md">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </motion.div>
  );
};

export default EmptyState;
