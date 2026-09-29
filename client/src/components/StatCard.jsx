import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler
);

const StatCard = ({ title, value, icon: Icon, colorClass = 'text-primary-600', bgClass = 'bg-primary-50', chartData, chartColor = '#4F46E5' }) => {
  // Default sparkline data if none provided
  const data = chartData || [65, 59, 80, 81, 56, 55, 40];
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: false }
    },
    scales: {
      x: { display: false },
      y: { display: false, min: Math.min(...data) * 0.8 }
    },
    elements: {
      point: { radius: 0, hitRadius: 10, hoverRadius: 4 },
      line: { tension: 0.4, borderWidth: 2 }
    }
  };

  const chartDataObj = {
    labels: data.map((_, i) => i.toString()),
    datasets: [
      {
        data: data,
        borderColor: chartColor,
        backgroundColor: `${chartColor}20`, // 20% opacity hex
        fill: true,
      }
    ]
  };

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="bg-white p-6 rounded-2xl border border-gray-100 flex flex-col justify-between h-36 relative overflow-hidden"
    >
      <div className="flex justify-between items-start relative z-10">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</h3>
          <p className="text-3xl font-black text-gray-900">{value}</p>
        </div>
        <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
          <Icon size={24} strokeWidth={2.5} />
        </div>
      </div>
      
      {/* Sparkline placed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-60">
        <Line data={chartDataObj} options={chartOptions} />
      </div>
    </motion.div>
  );
};

export default StatCard;
