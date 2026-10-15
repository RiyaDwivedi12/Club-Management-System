import AuditLog from '../models/AuditLog.js';

// @desc    Get system audit logs with filters and pagination
// @route   GET /api/audit-logs
// @access  Private (Admin only)
export const getAuditLogs = async (req, res) => {
  try {
    const { action, targetType, status, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (action && action !== 'all') {
      query.action = action;
    }
    if (targetType && targetType !== 'all') {
      query.targetType = targetType;
    }
    if (status && status !== 'all') {
      query.status = status;
    }
    if (search) {
      const s = search.trim();
      query.$or = [
        { performedByName: new RegExp(s, 'i') },
        { action: new RegExp(s, 'i') },
        { targetType: new RegExp(s, 'i') }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('performedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      logs,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get audit log statistics & recent actions
// @route   GET /api/audit-logs/stats
// @access  Private (Admin only)
export const getAuditStats = async (req, res) => {
  try {
    const totalLogs = await AuditLog.countDocuments();
    const actionsBreakdown = await AuditLog.aggregate([
      { $group: { _id: '$action', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const targetBreakdown = await AuditLog.aggregate([
      { $group: { _id: '$targetType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalLogs,
      actionsBreakdown,
      targetBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
