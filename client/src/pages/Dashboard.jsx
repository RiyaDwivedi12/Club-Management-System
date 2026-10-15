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
import StatCard from '../components/StatCard';

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
        if (user?.role === 'admin' || user?.role === 'president' || user?.role === 'faculty') {
          const { data } = await axios.get('/api/analytics', { withCredentials: true });
          setAnalytics(data);
        } else {
          const promises = [axios.get('/api/events', { withCredentials: true })];
          if (user?.role === 'student') {
            promises.push(axios.get('/api/student/memberships', { withCredentials: true }));
          }

          const results = await Promise.all(promises);
          const evtRes = results[0];
          const memRes = user?.role === 'student' ? results[1] : null;

          if (memRes) {
            setMemberships(memRes.data || []);
          }
          
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

  const isAdminView = user?.role === 'admin' || user?.role === 'president' || user?.role === 'faculty';

  return (
    <div className="w-full">
      <div className="mb-8 p-8 rounded-[32px] bg-primary-900 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-800 to-primary-900 opacity-90 z-0"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-black mb-2 flex items-center gap-2 tracking-tight">
            Hello, {user?.name ? user.name.split(' ')[0] : 'User'}!
          </h1>
          <p className="text-primary-100 font-medium text-lg max-w-md">What do you want to explore today?</p>
        </div>
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 45, 0] }} 
          transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
          className="absolute -right-20 -top-20 w-80 h-80 bg-primary-500 rounded-full mix-blend-multiply filter blur-[80px] opacity-60 z-0"
        />
        <div className="absolute right-10 bottom-0 h-full w-1/3 bg-gradient-to-l from-white/10 to-transparent z-0"></div>
      </div>

      {isAdminView ? (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Platform Overview</h2>
          
          {error && <div className="bg-red-50 text-red-500 font-bold p-4 rounded-xl mb-6">{error}</div>}
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            <StatCard title="Total Users" value={analytics?.metrics?.totalUsers || 0} icon={Users} colorClass="text-blue-600" bgClass="bg-blue-50" chartColor="#2563eb" />
            <StatCard title="Total Clubs" value={analytics?.metrics?.totalClubs || 0} icon={Activity} colorClass="text-green-600" bgClass="bg-green-50" chartColor="#16a34a" />
            <StatCard title="Events" value={analytics?.metrics?.totalEvents || 0} icon={Calendar} colorClass="text-red-500" bgClass="bg-red-50" chartColor="#ef4444" />
            <StatCard title="Revenue (₹)" value={analytics?.metrics?.totalRevenue || 0} icon={Award} colorClass="text-orange-500" bgClass="bg-orange-50" chartColor="#f97316" />
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
          
          <div className="grid grid-cols-1 gap-8 mb-8">
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Calendar className="text-primary-500" /> Upcoming Events</h3>
              {upcomingEvents.length > 0 ? (
                <div className="flex overflow-x-auto gap-6 pb-4 hide-scrollbar snap-x">
                  {upcomingEvents.map(event => (
                    <motion.div whileHover={{ y: -5 }} key={event._id} className="min-w-[280px] md:min-w-[320px] bg-gray-50 border border-gray-100 rounded-2xl p-4 snap-start shadow-sm transition-all hover:shadow-md cursor-pointer">
                      <div className="flex gap-4 items-start">
                        <div className="bg-white border border-gray-100 text-center rounded-xl overflow-hidden shadow-sm shrink-0 flex flex-col w-16">
                          <div className="bg-primary-600 text-white text-[10px] font-black uppercase py-1 tracking-wider">{new Date(event.date).toLocaleString('default', { month: 'short' })}</div>
                          <div className="text-xl font-black text-gray-900 py-2">{new Date(event.date).getDate()}</div>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg leading-tight mb-1">{event.title}</h4>
                          <p className="text-sm text-gray-500 line-clamp-2">{event.description}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Calendar size={48} className="text-gray-400 mb-4" />
                  <p className="text-gray-500 font-bold">No Upcoming Events</p>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
              <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-2"><Users className="text-primary-500" /> My Clubs</h3>
              {memberships.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {memberships.map((membership, idx) => (
                    <motion.div 
                      key={membership._id} 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex flex-col items-center p-6 bg-gray-50 hover:bg-primary-50 hover:border-primary-100 border border-gray-100 rounded-2xl text-center transition-colors cursor-pointer group"
                    >
                      <div className="w-16 h-16 bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden mb-3 group-hover:scale-110 transition-transform">
                        {membership.clubId?.logo ? (
                          <img src={membership.clubId.logo} alt={membership.clubId.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary-600 font-black text-2xl">
                            {membership.clubId?.name?.charAt(0)}
                          </div>
                        )}
                      </div>
                      <h4 className="font-bold text-gray-900 text-sm mb-2">{membership.clubId?.name}</h4>
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${membership.status === 'Approved' ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {membership.status}
                      </span>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 opacity-50 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
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
