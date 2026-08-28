import User from '../models/User.js';
import Club from '../models/Club.js';
import Event from '../models/Event.js';
import Match from '../models/Match.js';
import Election from '../models/Election.js';
import Payment from '../models/Payment.js';

// @desc    Get dashboard analytics
// @route   GET /api/analytics
// @access  Private (Admin/Faculty/President)
const getAnalytics = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalClubs = await Club.countDocuments({});
    const totalEvents = await Event.countDocuments({});
    
    // Calculate total revenue (assuming payments represent successful club joins)
    const successfulPayments = await Payment.find({ status: 'success' });
    const totalRevenue = successfulPayments.reduce((acc, curr) => acc + curr.amount, 0);

    // Basic chart data (e.g. users joined per month)
    const users = await User.find({}, 'createdAt');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const userGrowth = Array(12).fill(0);
    
    users.forEach(user => {
        const monthIndex = user.createdAt.getMonth();
        userGrowth[monthIndex] += 1;
    });

    res.json({
      metrics: {
        totalUsers,
        totalClubs,
        totalEvents,
        totalRevenue
      },
      charts: {
        labels: months,
        userGrowth
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getAnalytics };
