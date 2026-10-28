import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Bell, X } from 'lucide-react';

// Custom Toast Component to be rendered via toast.custom()
const CustomToast = ({ t, message, type }) => {
  let Icon = Bell;
  let iconColor = 'bg-blue-50 text-blue-600';
  let bgColor = 'bg-white';
  let borderColor = 'border-l-blue-500';

  if (type === 'success') {
    Icon = CheckCircle;
    iconColor = 'bg-emerald-50 text-emerald-600';
    borderColor = 'border-l-emerald-500';
  } else if (type === 'error') {
    Icon = XCircle;
    iconColor = 'bg-red-50 text-red-600';
    borderColor = 'border-l-red-500';
  }

  return (
    <AnimatePresence>
      {t.visible && (
        <motion.div
          initial={{ opacity: 0, x: 50, y: -20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: 50, transition: { duration: 0.2 } }}
          className={`max-w-sm w-[calc(100vw-2rem)] sm:w-full shadow-card-hover rounded-2xl pointer-events-auto flex border border-slate-200/70 overflow-hidden ${bgColor} border-l-4 ${borderColor}`}
        >
          <div className="flex-1 w-0 p-3.5">
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${iconColor}`}>
                <Icon className="h-5 w-5" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-dark-900 mt-2 break-words">{message}</p>
              </div>
            </div>
          </div>
          <div className="flex border-l border-slate-100">
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => toast.dismiss(t.id)}
              className="w-full px-3.5 flex items-center justify-center text-slate-400 hover:text-dark-900 hover:bg-slate-50 focus:outline-none transition-colors"
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
