import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  Award,
  Users,
  Calendar,
  AlertTriangle,
  DollarSign,
  PieChart,
  BarChart3,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const AnalyticsReportsView = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await axios.get('/api/analytics', { withCredentials: true });
      setData(res.data);
    } catch (err) {
      console.error('Failed to load analytics reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return <div className="p-12 text-center text-gray-400 font-medium">Computing deep analytics and intelligence models...</div>;
  }

  const { metrics, charts, insights } = data;

  const growthChartData = {
    labels: charts.labels,
    datasets: [
      {
        label: 'Student Enrolments',
        data: charts.userGrowth,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.1)',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Events Hosted',
        data: charts.eventGrowth,
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.1)',
        tension: 0.4,
        fill: true
      }
    ]
  };

  const deptChartData = {
    labels: charts.departmentDistribution?.map(d => d._id) || [],
    datasets: [
      {
        label: 'Students by Department',
        data: charts.departmentDistribution?.map(d => d.count) || [],
        backgroundColor: [
          '#7c3aed', '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#6366f1'
        ],
        borderRadius: 8
      }
    ]
  };

  return (
    <div className="space-y-6">
      {/* AI Operational Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {insights?.map((item, idx) => (
          <div
            key={idx}
            className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between ${
              item.type === 'alert' ? 'bg-rose-50 border-rose-200 text-rose-950' :
              item.type === 'forecast' ? 'bg-indigo-50 border-indigo-200 text-indigo-950' :
              item.type === 'growth' ? 'bg-purple-50 border-purple-200 text-purple-950' :
              'bg-emerald-50 border-emerald-200 text-emerald-950'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 bg-white/70 rounded-md">
                  {item.category}
                </span>
                <TrendingUp size={14} className="opacity-70" />
              </div>
              <h4 className="font-bold text-sm mt-1">{item.title}</h4>
              <p className="text-xs opacity-80 mt-1 font-medium">{item.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-900 text-base">Campus Growth & Activity Trend</h3>
            <span className="text-xs text-gray-400 font-bold">12-Month Progression</span>
          </div>
          <div className="h-64">
            <Line
              data={growthChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom' } }
              }}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-black text-gray-900 text-base">Student Distribution by Department</h3>
            <span className="text-xs text-gray-400 font-bold">Live Enrollment</span>
          </div>
          <div className="h-64">
            <Bar
              data={deptChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } }
              }}
            />
          </div>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Active Clubs */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
            <Award className="text-primary-600" size={20} /> Most Active Clubs by Membership
          </h3>
          <div className="space-y-3">
            {charts.mostActiveClubs?.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-primary-100 text-primary-700 font-black rounded-lg text-xs flex items-center justify-center">
                    #{i + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-gray-900 text-xs">{c.name}</h5>
                    <span className="text-[10px] text-gray-400">{c.category}</span>
                  </div>
                </div>
                <span className="font-black text-xs text-gray-800">{c.memberCount} members</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Events */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-black text-gray-900 text-base mb-4 flex items-center gap-2">
            <Calendar className="text-emerald-600" size={20} /> Top Events by Registration
          </h3>
          <div className="space-y-3">
            {charts.popularEvents?.map((e, i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 bg-emerald-100 text-emerald-700 font-black rounded-lg text-xs flex items-center justify-center">
                    #{i + 1}
                  </span>
                  <div>
                    <h5 className="font-bold text-gray-900 text-xs">{e.title}</h5>
                    <span className="text-[10px] text-gray-400">{e.clubName}</span>
                  </div>
                </div>
                <span className="font-black text-xs text-emerald-700">{e.participantCount} registrations</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReportsView;
