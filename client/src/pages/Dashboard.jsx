import { useState, useEffect } from 'react';
import axios from 'axios';
import useAuthStore from '../store/authStore';
import { Users, Calendar, Award, Activity, Loader2, Trophy, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

const StatCard = ({ title, value, icon, colorClass, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="soft-card p-6 flex flex-col items-center text-center hover:-translate-y-1 transition-transform duration-300"
  >
    <div className={`p-4 rounded-2xl mb-4 ${colorClass}`}>
      {icon}
    </div>
    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
    <h4 className="text-3xl font-black text-gray-900">{value}</h4>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuthStore();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memberships, setMemberships] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (user?.role === 'admin' || user?.role === 'president') {
          const { data } = await axios.get('/api/analytics', { withCredentials: true });
          setAnalytics(data);
        } else {
          const [memRes, evtRes] = await Promise.all([
            axios.get('/api/student/memberships', { withCredentials: true }),
            axios.get('/api/events', { withCredentials: true })
          ]);
          setMemberships(memRes.data || []);
          
          const now = new Date();
          const upcoming = (evtRes.data || []).filter(e => new Date(e.date) > now).slice(0, 3);
          setUpcomingEvents(upcoming);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch dashboard data');
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      fetchData();
    }
  }, [user]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: { font: { family: 'Poppins', weight: 'bold' } }
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: '#f3f4f6' } },
      x: { grid: { display: false } }
    },
    maintainAspectRatio: false
  };

  const chartData = {
    labels: analytics?.charts?.labels || [],
    datasets: [
      {
        fill: true,
        label: 'New Users Joined',
        data: analytics?.charts?.userGrowth || [],
        borderColor: 'rgb(139, 92, 246)', // primary-500
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        tension: 0.4,
      },
    ],
  };

  if (loading) {
     return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-primary-600" size={48} /></div>;
  }

  const isAdminView = user?.role === 'admin' || user?.role === 'president';

  return (
    <div className="w-full">
      <div className="mb-8 p-8 rounded-[32px] bg-primary-100 text-primary-900 relative overflow-hidden shadow-soft">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            Hello, {user?.name ? user.name.split(' ')[0] : 'User'}!
          </h1>
          <p className="text-primary-700 font-medium text-lg max-w-md">What do you want to explore today?</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary-200 to-transparent opacity-50"></div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white rounded-full opacity-20 blur-2xl"></div>
      </div>

      {isAdminView ? (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Overview</h2>
          
          {error && <div className="bg-red-50 text-red-500 font-bold p-4 rounded-xl mb-6">{error}</div>}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Total Users" value={analytics?.metrics?.totalUsers || 0} icon={<Users size={28} />} colorClass="bg-blue-100 text-blue-600" delay={0.1} />
            <StatCard title="Total Clubs" value={analytics?.metrics?.totalClubs || 0} icon={<Activity size={28} />} colorClass="bg-green-100 text-green-600" delay={0.2} />
            <StatCard title="Events" value={analytics?.metrics?.totalEvents || 0} icon={<Calendar size={28} />} colorClass="bg-red-100 text-red-500" delay={0.3} />
            <StatCard title="Revenue (₹)" value={analytics?.metrics?.totalRevenue || 0} icon={<Award size={28} />} colorClass="bg-orange-100 text-orange-500" delay={0.4} />
          </div>

          <div className="soft-card p-6 border-l-4 border-l-primary-500 mb-8">
            <h3 className="text-lg font-black text-gray-900 mb-6">User Growth (Current Year)</h3>
            <div className="h-72 w-full">
                <Line options={chartOptions} data={chartData} />
            </div>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Your Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="soft-card p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-2">Upcoming Events</h3>
              {upcomingEvents.length > 0 ? (
                <div className="space-y-4">
                  {upcomingEvents.map(event => (
                    <div key={event._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <div className="bg-primary-100 text-primary-600 p-3 rounded-xl font-bold text-center">
                        <div className="text-sm">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                        <div className="text-xl">{new Date(event.date).getDate()}</div>
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{event.title}</h4>
                        <p className="text-sm text-gray-500 line-clamp-1">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <Calendar size={48} className="text-gray-400 mb-4" />
                  <p className="text-gray-500 font-bold">No Upcoming Events</p>
                </div>
              )}
            </div>
            
            <div className="soft-card p-6">
              <h3 className="text-lg font-black text-gray-900 mb-4 border-b border-gray-100 pb-2">Your Clubs</h3>
              {memberships.length > 0 ? (
                <div className="space-y-4">
                  {memberships.map(membership => (
                    <div key={membership._id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl">
                      <div className="w-12 h-12 bg-primary-100 rounded-xl overflow-hidden shrink-0">
                        {membership.clubId?.logo ? (
                          <img src={membership.clubId.logo} alt={membership.clubId.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-600 font-bold">
                            {membership.clubId?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900">{membership.clubId?.name}</h4>
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${membership.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                          {membership.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <Users size={48} className="text-gray-400 mb-4" />
                  <p className="text-gray-500 font-bold">Not enrolled in any clubs</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
