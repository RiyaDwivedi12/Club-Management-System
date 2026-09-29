import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Bell, X } from 'lucide-react';

// Custom Toast Component to be rendered via toast.custom()
const CustomToast = ({ t, message, type }) => {
  let Icon = Bell;
  let iconColor = 'text-indigo-500';
  let bgColor = 'bg-white';
  let borderColor = 'border-indigo-100';

  if (type === 'success') {
    Icon = CheckCircle;
    iconColor = 'text-green-500';
    borderColor = 'border-green-100';
  } else if (type === 'error') {
    Icon = XCircle;
    iconColor = 'text-red-500';
    borderColor = 'border-red-100';
  }

  return (
    <AnimatePresence>
      {t.visible && (
        <motion.div
          initial={{ opacity: 0, x: 50, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
          className={`max-w-sm w-full shadow-lg rounded-xl pointer-events-auto flex ring-1 ring-black ring-opacity-5 ${bgColor} border-l-4 ${borderColor}`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <Icon className={`h-6 w-6 ${iconColor}`} strokeWidth={2} />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-bold text-gray-900 mt-0.5">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-gray-100">
            <button
              onClick={() => toast.dismiss(t.id)}
              className="w-full border border-transparent rounded-none rounded-r-xl p-4 flex items-center justify-center text-sm font-medium text-gray-400 hover:text-gray-600 hover:bg-gray-50 focus:outline-none transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export const showToast = (message, type = 'default') => {
  toast.custom(
    (t) => <CustomToast t={t} message={message} type={type} />,
    {
      position: 'top-right',
      duration: 4500,
    }
  );
};
