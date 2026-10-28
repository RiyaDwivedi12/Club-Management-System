import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrendingUp,
  Award,
  Calendar,
  BarChart3
} from 'lucide-react';
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
import PageHeader from '../ui/PageHeader';
import LoadingState from '../ui/LoadingState';

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

const INSIGHT_STYLES = {
  alert: 'bg-red-50 border-red-100 text-red-900',
  forecast: 'bg-indigo-50 border-indigo-100 text-indigo-900',
  growth: 'bg-blue-50 border-blue-100 text-blue-900',
  default: 'bg-emerald-50 border-emerald-100 text-emerald-900'
};

const chartScales = {
  x: { grid: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } },
  y: { grid: { color: '#f1f5f9' }, border: { display: false }, ticks: { color: '#64748b', font: { size: 11 } } }
};

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
    return <LoadingState label="Computing deep analytics and intelligence models..." />;
  }

  const { metrics, charts, insights } = data;

  const growthChartData = {
    labels: charts.labels,
    datasets: [
      {
        label: 'Student Enrolments',
        data: charts.userGrowth,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.08)',
        pointBackgroundColor: '#2563eb',
        tension: 0.4,
        fill: true
      },
      {
        label: 'Events Hosted',
        data: charts.eventGrowth,
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.08)',
        pointBackgroundColor: '#0ea5e9',
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
          '#2563eb', '#4f46e5', '#0ea5e9', '#1e3a8a', '#6366f1', '#64748b'
        ],
        borderRadius: 8
      }
    ]
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BarChart3}
        eyebrow="Insights"
        title="Analytics & Reports"
        description="Campus growth, department distribution and engagement leaders."
      />

      {/* Operational Insights Cards */}
      {insights?.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {insights.map((item, idx) => (
            <div
              key={idx}
              className={`p-5 rounded-2xl border flex flex-col justify-between min-w-0 ${INSIGHT_STYLES[item.type] || INSIGHT_STYLES.default}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-white/70 rounded-md truncate">
                    {item.category}
                  </span>
                  <TrendingUp size={14} className="opacity-70 shrink-0" />
                </div>
                <h4 className="font-bold text-sm mt-1 break-words">{item.title}</h4>
                <p className="text-xs opacity-80 mt-1 leading-relaxed">{item.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 sm:p-6 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="font-bold text-dark-900 text-base">Campus Growth & Activity Trend</h3>
            <span className="badge-slate">12-Month Progression</span>
          </div>
          <div className="h-64">
            <Line
              data={growthChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, color: '#475569' } } },
                scales: chartScales
              }}
            />
          </div>
        </div>

        <div className="card p-5 sm:p-6 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="font-bold text-dark-900 text-base">Student Distribution by Department</h3>
            <span className="badge-blue">Live Enrollment</span>
          </div>
          <div className="h-64">
            <Bar
              data={deptChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: chartScales
              }}
            />
          </div>
        </div>
      </div>

      {/* Leaderboards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Most Active Clubs */}
        <div className="card p-5 sm:p-6 min-w-0">
          <h3 className="font-bold text-dark-900 text-base mb-4 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Award size={16} />
            </span>
            Most Active Clubs by Membership
          </h3>
          <div className="space-y-2.5">
            {charts.mostActiveClubs?.map((c, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 bg-blue-100 text-blue-700 font-bold rounded-lg text-xs flex items-center justify-center shrink-0">
                    #{i + 1}
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-dark-900 text-sm truncate">{c.name}</h5>
                    <span className="text-xs text-slate-400">{c.category}</span>
                  </div>
                </div>
                <span className="font-bold text-xs text-slate-700 shrink-0">{c.memberCount} members</span>
              </div>
            ))}
          </div>
        </div>

        {/* Popular Events */}
        <div className="card p-5 sm:p-6 min-w-0">
          <h3 className="font-bold text-dark-900 text-base mb-4 flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </span>
            Top Events by Registration
          </h3>
          <div className="space-y-2.5">
            {charts.popularEvents?.map((e, i) => (
              <div key={i} className="flex items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-100 rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs flex items-center justify-center shrink-0">
                    #{i + 1}
                  </span>
                  <div className="min-w-0">
                    <h5 className="font-semibold text-dark-900 text-sm truncate">{e.title}</h5>
                    <span className="text-xs text-slate-400 truncate block">{e.clubName}</span>
                  </div>
                </div>
                <span className="font-bold text-xs text-indigo-700 shrink-0">{e.participantCount} registrations</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsReportsView;
