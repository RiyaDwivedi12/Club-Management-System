import { useState, useEffect } from 'react';
import useAuthStore from '../store/authStore';
import { Users, Calendar, Award, Activity, Target } from 'lucide-react';
import { motion } from 'framer-motion';

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
    <p className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-1">{title}</p>
    <h4 className="text-3xl font-black text-gray-900">{value}</h4>
  </motion.div>
);

const Dashboard = () => {
  const { user } = useAuthStore();
  
  return (
    <div className="w-full">
      <div className="mb-8 p-8 rounded-[32px] bg-primary-100 text-primary-900 relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-black mb-2 flex items-center gap-2">
            Hello, {user?.name.split(' ')[0]}! <span className="text-4xl animate-bounce origin-bottom">👋</span>
          </h1>
          <p className="text-primary-700 font-medium text-lg max-w-md">What do you want to explore today?</p>
        </div>
        <div className="absolute right-0 top-0 h-full w-1/2 bg-gradient-to-l from-primary-200 to-transparent opacity-50"></div>
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white rounded-full opacity-20 blur-2xl"></div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-end mb-4">
          <h2 className="text-xl font-bold text-gray-900">Today's Goal</h2>
          <button className="text-sm font-bold text-primary-600 hover:text-primary-700">Edit Goal</button>
        </div>
        <div className="soft-card p-5 flex items-center justify-between border-2 border-primary-50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
              <Target size={24} />
            </div>
            <div>
              <p className="font-bold text-gray-900">Explore 2 new clubs</p>
              <p className="text-sm text-gray-500 font-medium">1 / 2 clubs</p>
            </div>
          </div>
          <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center">
            🎁
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Stats</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Clubs" value="12" icon={<Users size={28} />} colorClass="bg-blue-100 text-blue-600" delay={0.1} />
        <StatCard title="Events" value="5" icon={<Calendar size={28} />} colorClass="bg-red-100 text-red-500" delay={0.2} />
        <StatCard title="Members" value="1.2k" icon={<Activity size={28} />} colorClass="bg-green-100 text-green-600" delay={0.3} />
        <StatCard title="Awards" value="8" icon={<Award size={28} />} colorClass="bg-orange-100 text-orange-500" delay={0.4} />
      </div>
    </div>
  );
};

export default Dashboard;
