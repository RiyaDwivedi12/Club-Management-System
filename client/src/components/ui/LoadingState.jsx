const LoadingState = ({ label = 'Loading…', className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-16 ${className}`}>
    <div className="spinner mb-3" />
    <p className="text-sm font-medium text-slate-500">{label}</p>
  </div>
);

export default LoadingState;
