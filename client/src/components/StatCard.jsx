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

const StatCard = ({ title, value, icon: Icon, colorClass = 'text-blue-600', bgClass = 'bg-blue-50', chartData, chartColor = '#2563eb' }) => {
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
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="card hover:border-blue-200 hover:shadow-card-hover transition-[border-color,box-shadow] p-5 flex flex-col justify-between h-36 relative overflow-hidden"
    >
      <div className="flex justify-between items-start gap-3 relative z-10">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-500 mb-1 truncate">{title}</h3>
          <p className="text-3xl font-extrabold tracking-tight text-dark-900">{value}</p>
        </div>
        <div className={`icon-tile shrink-0 ${bgClass} ${colorClass}`}>
          <Icon size={22} />
        </div>
      </div>

      {/* Sparkline placed at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-14 opacity-50 pointer-events-none">
        <Line data={chartDataObj} options={chartOptions} />
      </div>
    </motion.div>
  );
};

export default StatCard;
