import Department from '../models/Department.js';
import CollegeClass from '../models/CollegeClass.js';
import OfflinePaymentDoc from '../models/OfflinePaymentDoc.js';
import Payment from '../models/Payment.js';
import User from '../models/User.js';
import Club from '../models/Club.js';
import Membership from '../models/Membership.js';
import Notification from '../models/Notification.js';
import AuditLog from '../models/AuditLog.js';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Default departments to auto-seed if database is empty
const DEFAULT_DEPARTMENTS = [
  {
    name: 'Engineering',
    code: 'ENG',
    description: 'Faculty of Engineering & Technology (CSE, IT, ECE, MECH)',
    color: 'from-blue-600 to-indigo-700'
  },
  {
    name: 'Pharmacy',
    code: 'PHARM',
    description: 'Faculty of Pharmaceutical Sciences (B.Pharm, M.Pharm)',
    color: 'from-emerald-600 to-teal-700'
  },
  {
    name: 'Management',
    code: 'MGMT',
    description: 'Department of Management Studies (MBA, BBA)',
    color: 'from-purple-600 to-violet-800'
  },
  {
    name: 'Computer Applications',
    code: 'CA',
    description: 'Department of Computer Applications (BCA, MCA)',
    color: 'from-cyan-600 to-blue-700'
  }
];

// Default classes to auto-seed if none exist
const DEFAULT_CLASSES = [
  // Engineering Department
  { name: 'CSE - Year 4 (Sec A)', department: 'Engineering', course: 'B.Tech', year: 4, section: 'A', standardFee: 500 },
  { name: 'CSE - Year 3 (Sec B)', department: 'Engineering', course: 'B.Tech', year: 3, section: 'B', standardFee: 500 },
  { name: 'IT - Year 3 (Sec A)', department: 'Engineering', course: 'B.Tech', year: 3, section: 'A', standardFee: 500 },
  { name: 'ECE - Year 2 (Sec A)', department: 'Engineering', course: 'B.Tech', year: 2, section: 'A', standardFee: 500 },
  { name: 'MECH - Year 1 (Sec B)', department: 'Engineering', course: 'B.Tech', year: 1, section: 'B', standardFee: 500 },
  // Pharmacy Department
  { name: 'B.Pharm - Year 2 (Sec A)', department: 'Pharmacy', course: 'B.Pharm', year: 2, section: 'A', standardFee: 600 },
  { name: 'B.Pharm - Year 3 (Sec B)', department: 'Pharmacy', course: 'B.Pharm', year: 3, section: 'B', standardFee: 600 },
  { name: 'M.Pharm - Year 1 (Sec A)', department: 'Pharmacy', course: 'M.Pharm', year: 1, section: 'A', standardFee: 750 },
  // Management Department
  { name: 'MBA - Year 1 (Sec A)', department: 'Management', course: 'MBA', year: 1, section: 'A', standardFee: 800 }
];

// Helper: Seed demo pharmacy students if Pharmacy has no students
const ensureDemoPharmacyStudents = async () => {
  try {
    const existingPharm = await User.findOne({ department: /pharmacy/i });
    if (!existingPharm) {
      const demoPharm = [
        { name: 'Rohan Deshmukh', roll_no: 'PH24101', email: 'rohan.pharm@campus.edu', department: 'Pharmacy', year: 2, section: 'A', course: 'B.Pharm' },
        { name: 'Sneha Kulkarni', roll_no: 'PH24102', email: 'sneha.pharm@campus.edu', department: 'Pharmacy', year: 2, section: 'A', course: 'B.Pharm' },
        { name: 'Aakash Bhatt', roll_no: 'PH24103', email: 'aakash.pharm@campus.edu', department: 'Pharmacy', year: 2, section: 'A', course: 'B.Pharm' },
        { name: 'Pooja Hegde', roll_no: 'PH23201', email: 'pooja.pharm@campus.edu', department: 'Pharmacy', year: 3, section: 'B', course: 'B.Pharm' },
        { name: 'Devendra Joshi', roll_no: 'PH23202', email: 'devendra.pharm@campus.edu', department: 'Pharmacy', year: 3, section: 'B', course: 'B.Pharm' },
        { name: 'Ankita Rao', roll_no: 'MPH2501', email: 'ankita.mpharm@campus.edu', department: 'Pharmacy', year: 1, section: 'A', course: 'M.Pharm' }
      ];

      const club = await Club.findOne();
      for (let i = 0; i < demoPharm.length; i++) {
        const d = demoPharm[i];
        let student = await User.findOne({ email: d.email });
        if (!student) {
          student = await User.create({
            name: d.name,
            username: d.roll_no.toLowerCase(),
            email: d.email,
            password: 'student123',
            role: 'student',
            roll_no: d.roll_no,
            department: d.department,
            year: d.year,
            section: d.section,
            course: d.course,
            isVerified: true
          });

          // Give half of them payments to demonstrate online & offline
          if (i === 0) {
            // Online paid
            await Payment.create({
              userId: student._id,
              clubId: club?._id,
              paymentType: 'membership_fee',
              receiptNumber: `REC-2026-PH-${1000 + i}`,
              razorpayOrderId: `ord_pharm_${Date.now()}_${i}`,
              razorpayPaymentId: `pay_pharm_${Date.now()}_${i}`,
              amount: 600,
              paymentMethod: 'UPI / Razorpay',
              status: 'success'
            });
            student.paymentStatus = true;
            await student.save();
          } else if (i === 1) {
            // Offline paid
            await Payment.create({
              userId: student._id,
              clubId: club?._id,
              paymentType: 'membership_fee',
              receiptNumber: `OFF-2026-PH-${2000 + i}`,
              amount: 600,
              paymentMethod: 'Offline / Cash',
              status: 'success',
              offlineNotes: 'Direct cash collection via Pharmacy Department Office'
            });
            student.paymentStatus = true;
            await student.save();
          }
        }
      }
    }
  } catch (err) {
    console.error('Error ensuring demo pharmacy students:', err.message);
  }
};

// @desc    Get all Departments with counts
// @route   GET /api/class-fees/departments
// @access  Private (Admin / Faculty)
export const getDepartments = async (req, res) => {
  try {
    let departments = await Department.find().sort({ createdAt: 1 });
    if (departments.length === 0) {
      departments = await Department.insertMany(DEFAULT_DEPARTMENTS);
    }

    const classes = await CollegeClass.find({ isActive: true });
    const students = await User.find({ role: 'student' }).select('department');

    const result = departments.map(d => {
      const deptClasses = classes.filter(c => c.department?.toLowerCase() === d.name?.toLowerCase());
      const deptStudents = students.filter(s => {
        const sDept = (s.department || '').toLowerCase();
        const dName = d.name.toLowerCase();
        if (sDept === dName) return true;
        if (dName === 'engineering' && ['cse', 'it', 'ece', 'mech', 'civil'].some(b => sDept.includes(b))) return true;
        if (dName === 'pharmacy' && sDept.includes('pharm')) return true;
        if (dName === 'management' && (sDept.includes('mba') || sDept.includes('bba') || sDept.includes('mgmt'))) return true;
        return false;
      });

      return {
        _id: d._id,
        name: d.name,
        code: d.code,
        description: d.description,
        color: d.color,
        classCount: deptClasses.length,
        studentCount: deptStudents.length,
        createdAt: d.createdAt
      };
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new Department
// @route   POST /api/class-fees/departments
// @access  Private (Admin only)
export const createDepartment = async (req, res) => {
  try {
    const { name, code, description, color } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Department name is required' });
    }

    const existing = await Department.findOne({ name: new RegExp('^' + name.trim() + '$', 'i') });
    if (existing) {
      return res.status(400).json({ message: `Department '${name}' already exists` });
    }

    const dept = await Department.create({
      name: name.trim(),
      code: (code || name.slice(0, 4)).trim().toUpperCase(),
      description: description || '',
      color: color || 'from-blue-600 to-indigo-700'
    });

    await AuditLog.create({
      action: 'DEPARTMENT_CREATED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Department',
      targetId: dept._id,
      details: { name: dept.name, code: dept.code },
      status: 'SUCCESS'
    });

    res.status(201).json({ message: `Department '${dept.name}' created successfully`, department: dept });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a Department
// @route   DELETE /api/class-fees/departments/:id
// @access  Private (Admin only)
export const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) {
      return res.status(404).json({ message: 'Department not found' });
    }

    // Check if any classes exist under this department
    const classesCount = await CollegeClass.countDocuments({ department: dept.name });
    if (classesCount > 0) {
      return res.status(400).json({ 
        message: `Cannot delete department '${dept.name}'. It contains ${classesCount} active classes. Please delete or reassign classes first.` 
      });
    }

    await Department.findByIdAndDelete(req.params.id);
    res.json({ message: `Department '${dept.name}' removed successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper: Check if a student matches a class definition
const studentMatchesClass = (student, cls) => {
  // 1. Exact match by classId or className (direct binding)
  if (student.classId && cls._id && student.classId.toString() === cls._id.toString()) return true;
  if (student.className && cls.name && student.className.trim().toLowerCase() === cls.name.trim().toLowerCase()) return true;

  const sDept = (student.department || '').trim().toLowerCase();
  const sCourse = (student.course || '').trim().toLowerCase();
  const cDept = (cls.department || '').trim().toLowerCase();
  const cCourse = (cls.course || '').trim().toLowerCase();
  const sYear = Number(student.year) || 1;
  const cYear = Number(cls.year) || 1;
  const sSec = (student.section || 'A').trim().toUpperCase();
  const cSec = (cls.section || 'A').trim().toUpperCase();

  // Year and Section check
  if (sSec && cSec && sSec !== cSec) return false;

  if (sYear === cYear) {
    if (sCourse && cCourse && (sCourse === cCourse || sCourse.includes(cCourse) || cCourse.includes(sCourse))) {
      return true;
    }
    if (cls.name.toLowerCase().includes(sCourse) || (sDept && cls.name.toLowerCase().includes(sDept))) {
      return true;
    }
  }

  // Department / Course check
  if (sDept === cDept && sYear === cYear) return true;
  if (cDept === 'engineering') {
    if (['cse', 'it', 'ece', 'mech', 'civil', 'computer science', 'information technology'].some(b => sDept.includes(b))) {
      if (sYear === cYear && (cls.name.toLowerCase().includes(sDept) || cls.course.toLowerCase().includes(sDept))) return true;
    }
  }
  if (cDept === 'pharmacy') {
    if ((sDept.includes('pharm') || sCourse.includes('pharm')) && sYear === cYear) return true;
  }
  if (cDept === 'architecture') {
    if ((sDept.includes('arch') || sCourse.includes('arch')) && sYear === cYear) return true;
  }
  if (cDept === 'medical design') {
    if ((sDept.includes('design') || sCourse.includes('design')) && sYear === cYear) return true;
  }
  if (cDept === 'management') {
    if ((sDept.includes('mba') || sDept.includes('bba') || sDept.includes('mgmt') || sCourse.includes('mba') || sCourse.includes('bba')) && sYear === cYear) return true;
  }
  if (cDept === 'computer applications') {
    if ((sDept.includes('bca') || sDept.includes('mca') || sCourse.includes('bca') || sCourse.includes('mca')) && sYear === cYear) return true;
  }

  return false;
};

// @desc    Get all Classes with comprehensive Real-Time Revenue & Student Roster
// @route   GET /api/class-fees/classes
// @access  Private (Admin / Faculty)
export const getClasses = async (req, res) => {
  try {
    // 1. Ensure departments and demo data are initialized
    const deptCount = await Department.countDocuments();
    if (deptCount === 0) {
      await Department.insertMany(DEFAULT_DEPARTMENTS);
    }
    await ensureDemoPharmacyStudents();

    // 2. Fetch classes or initialize default classes
    let classes = await CollegeClass.find({ isActive: true }).sort({ department: 1, year: 1, section: 1 });
    if (classes.length === 0) {
      classes = await CollegeClass.insertMany(DEFAULT_CLASSES);
    }

    // 3. Fetch all students, payments, clubs, and offline documents in parallel
    const [students, payments, clubs, memberships, offlineDocs] = await Promise.all([
      User.find({ role: 'student' })
        .select('name roll_no email department year section course className classId clubMemberships paymentStatus createdAt')
        .populate('clubMemberships', 'name category joinFee')
        .lean(),
      Payment.find({ status: { $in: ['success', 'Paid'] } })
        .populate('clubId', 'name category')
        .populate('offlineDocId', 'originalName filePath notes')
        .lean(),
      Club.find().select('name category joinFee').lean(),
      Membership.find({ status: 'Approved' }).populate('clubId', 'name').lean(),
      OfflinePaymentDoc.find().sort({ createdAt: -1 }).lean()
    ]);

    // Map memberships by studentId for fast lookup
    const membershipMap = new Map();
    memberships.forEach(m => {
      const sId = m.studentId?.toString();
      if (sId) {
        if (!membershipMap.has(sId)) membershipMap.set(sId, []);
        if (m.clubId?.name) membershipMap.get(sId).push(m.clubId.name);
      }
    });

    // Map payments by studentId (keep latest payment)
    const paymentMap = new Map();
    payments.forEach(p => {
      if (p.userId) {
        paymentMap.set(p.userId.toString(), p);
      }
    });

    // Process each class and aggregate students
    const classCards = classes.map(cls => {
      const standardFee = cls.standardFee || 500;
      const matchedStudents = students.filter(s => studentMatchesClass(s, cls));

      let paidCount = 0;
      let onlinePaidCount = 0;
      let offlinePaidCount = 0;
      let totalCollected = 0;

      const studentRoster = matchedStudents.map(student => {
        const pmt = paymentMap.get(student._id.toString());
        const isPaid = !!pmt || student.paymentStatus === true;
        const paidAmount = pmt ? pmt.amount : (isPaid ? standardFee : 0);
        
        let paymentMode = 'None';
        if (isPaid) {
          const method = (pmt?.paymentMethod || '').toLowerCase();
          if (method.includes('offline') || method.includes('cash') || method.includes('challan') || pmt?.offlineDocId || pmt?.offlineNotes) {
            paymentMode = 'Offline';
            offlinePaidCount++;
          } else {
            paymentMode = 'Online';
            onlinePaidCount++;
          }
          paidCount++;
          totalCollected += paidAmount;
        }

        // Get student's club names
        const directClubs = (student.clubMemberships || []).map(c => c.name);
        const approvedClubs = membershipMap.get(student._id.toString()) || [];
        const studentClubs = Array.from(new Set([...directClubs, ...approvedClubs]));

        return {
          _id: student._id,
          name: student.name,
          roll_no: student.roll_no || 'N/A',
          email: student.email,
          department: student.department || cls.department,
          course: student.course || cls.course,
          year: student.year || cls.year,
          section: student.section || cls.section,
          paymentStatus: isPaid ? 'Paid' : 'Pending',
          paymentMode,
          paymentMethod: pmt ? (pmt.paymentMethod || (paymentMode === 'Offline' ? 'Offline / Cash' : 'UPI / Razorpay')) : 'None',
          feeType: pmt ? (pmt.paymentType?.replace('_', ' ') || 'Annual Membership Fee') : 'Annual Membership Fee',
          amount: isPaid ? paidAmount : standardFee,
          receiptNumber: pmt?.receiptNumber || (isPaid ? `REC-2026-${student.roll_no || 'STD'}` : null),
          paidAt: pmt?.createdAt || null,
          offlineDoc: pmt?.offlineDocId || null,
          offlineNotes: pmt?.offlineNotes || '',
          clubs: studentClubs.length > 0 ? studentClubs : ['All-Campus Societies']
        };
      });

      const totalStudents = matchedStudents.length;
      const pendingCount = Math.max(0, totalStudents - paidCount);
      const totalPendingAmount = pendingCount * standardFee;
      const collectionPercentage = totalStudents > 0 ? Math.round((paidCount / totalStudents) * 100) : 0;

      return {
        _id: cls._id,
        name: cls.name,
        department: cls.department,
        course: cls.course,
        year: cls.year,
        section: cls.section,
        standardFee,
        academicYear: cls.academicYear || '2025-2026',
        totalStudents,
        paidCount,
        onlinePaidCount,
        offlinePaidCount,
        pendingCount,
        totalCollected,
        totalPendingAmount,
        collectionPercentage,
        students: studentRoster
      };
    });

    // Sort classes by revenue collected descending
    classCards.sort((a, b) => b.totalCollected - a.totalCollected);

    // Compute Overall Executive KPI Summary for the Top Banner Cards
    const overallKPI = {
      totalNetRevenue: classCards.reduce((acc, c) => acc + c.totalCollected, 0),
      totalClasses: classCards.length,
      totalStudents: classCards.reduce((acc, c) => acc + c.totalStudents, 0),
      totalPaid: classCards.reduce((acc, c) => acc + c.paidCount, 0),
      onlineRevenue: classCards.reduce((acc, c) => {
        const onlineAmt = c.students.filter(s => s.paymentMode === 'Online').reduce((sum, s) => sum + s.amount, 0);
        return acc + onlineAmt;
      }, 0),
      offlineRevenue: classCards.reduce((acc, c) => {
        const offlineAmt = c.students.filter(s => s.paymentMode === 'Offline').reduce((sum, s) => sum + s.amount, 0);
        return acc + offlineAmt;
      }, 0),
      totalOfflinePaidStudents: classCards.reduce((acc, c) => acc + c.offlinePaidCount, 0),
      totalPendingDues: classCards.reduce((acc, c) => acc + c.totalPendingAmount, 0),
      totalPendingStudents: classCards.reduce((acc, c) => acc + c.pendingCount, 0),
      overallCollectionRate: 0,
      currency: '₹'
    };

    if (overallKPI.totalStudents > 0) {
      overallKPI.overallCollectionRate = Math.round((overallKPI.totalPaid / overallKPI.totalStudents) * 100);
    }

    res.json({
      overallKPI,
      classes: classCards,
      departments: await Department.find().sort({ createdAt: 1 }).lean(),
      offlineDocs
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a new Class Card under a Department
// @route   POST /api/class-fees/classes
// @access  Private (Admin only)
export const createClass = async (req, res) => {
  try {
    const { name, department, course, year, section, standardFee, academicYear } = req.body;

    if (!department || !department.trim()) {
      return res.status(400).json({ message: 'Department is required to create a class' });
    }

    const yr = Number(year) || 1;
    const sec = (section || 'A').trim().toUpperCase();
    const crs = (course || 'B.Tech').trim();
    const fee = Number(standardFee) || 500;
    const defaultName = `${crs} - Year ${yr} (Sec ${sec})`;
    const className = (name && name.trim()) ? name.trim() : defaultName;

    // Check if class with same department, course, year, section already exists
    const existing = await CollegeClass.findOne({
      department: department.trim(),
      course: crs,
      year: yr,
      section: sec
    });

    if (existing) {
      return res.status(400).json({ 
        message: `Class for ${department} - ${crs} Year ${yr} (Sec ${sec}) already exists!` 
      });
    }

    const newClass = await CollegeClass.create({
      name: className,
      department: department.trim(),
      course: crs,
      year: yr,
      section: sec,
      standardFee: fee,
      academicYear: academicYear || '2025-2026'
    });

    await AuditLog.create({
      action: 'CLASS_CREATED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'CollegeClass',
      targetId: newClass._id,
      details: { name: newClass.name, department: newClass.department, fee: newClass.standardFee },
      status: 'SUCCESS'
    });

    res.status(201).json({ message: `Class Card '${newClass.name}' created successfully!`, classData: newClass });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a Class
// @route   DELETE /api/class-fees/classes/:id
// @access  Private (Admin only)
export const deleteClass = async (req, res) => {
  try {
    const cls = await CollegeClass.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    await CollegeClass.findByIdAndDelete(req.params.id);
    res.json({ message: `Class card '${cls.name}' removed successfully` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Record Offline Fee Payment for a student
// @route   POST /api/class-fees/offline-payment
// @access  Private (Admin only)
export const recordOfflinePayment = async (req, res) => {
  try {
    const { studentId, amount, paymentMethod, paymentType, clubId, offlineDocId, notes, receiptNumber } = req.body;

    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const defaultClub = await Club.findOne();
    const targetClubId = clubId || defaultClub?._id;
    const finalAmount = Number(amount) || 500;
    const finalReceiptNo = (receiptNumber && receiptNumber.trim()) 
      ? receiptNumber.trim() 
      : `OFF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Create Payment Record
    const payment = await Payment.create({
      userId: student._id,
      clubId: targetClubId,
      paymentType: paymentType || 'membership_fee',
      receiptNumber: finalReceiptNo,
      amount: finalAmount,
      paymentMethod: paymentMethod || 'Offline / Cash',
      status: 'success',
      offlineDocId: offlineDocId || null,
      offlineNotes: notes || 'Verified and marked paid by Administrator',
      verifiedBy: req.user._id,
      razorpayOrderId: `OFFLINE_${Date.now()}`
    });

    // Update Student Status
    student.paymentStatus = true;
    if (targetClubId && !student.clubMemberships.includes(targetClubId)) {
      student.clubMemberships.push(targetClubId);
    }
    await student.save();

    // If club, approve membership
    if (targetClubId) {
      await Membership.findOneAndUpdate(
        { studentId: student._id, clubId: targetClubId },
        { status: 'Approved' },
        { upsert: true, new: true }
      );
      await Club.findByIdAndUpdate(targetClubId, {
        $addToSet: { members: student._id }
      });
    }

    // Increment verified count in attached offline document
    if (offlineDocId) {
      await OfflinePaymentDoc.findByIdAndUpdate(offlineDocId, {
        $inc: { verifiedCount: 1 }
      });
    }

    // Notify student
    await Notification.create({
      user: student._id,
      message: `✅ Your Offline Fee Payment of ₹${finalAmount} has been verified and recorded by Admin. Receipt #${finalReceiptNo}.`,
      type: 'payment',
      link: '/profile'
    });

    // Audit Log
    await AuditLog.create({
      action: 'OFFLINE_PAYMENT_RECORDED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'Payment',
      targetId: payment._id,
      details: {
        student: student.name,
        roll_no: student.roll_no,
        amount: finalAmount,
        receiptNumber: finalReceiptNo,
        paymentMethod: payment.paymentMethod,
        offlineDocId
      },
      status: 'SUCCESS'
    });

    res.status(201).json({
      message: `Offline payment of ₹${finalAmount} recorded for ${student.name} (${student.roll_no || 'N/A'})!`,
      payment,
      receiptNumber: finalReceiptNo
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Batch Record Offline Payments for multiple students
// @route   POST /api/class-fees/batch-offline-payment
// @access  Private (Admin only)
export const batchRecordOfflinePayment = async (req, res) => {
  try {
    const { studentIds = [], amount, paymentMethod, paymentType, clubId, offlineDocId, notes } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({ message: 'Please select at least one student' });
    }

    const defaultClub = await Club.findOne();
    const targetClubId = clubId || defaultClub?._id;
    const finalAmount = Number(amount) || 500;
    const method = paymentMethod || 'Offline / Cash';
    const finalType = paymentType || 'membership_fee';

    let successCount = 0;
    for (const sId of studentIds) {
      const student = await User.findById(sId);
      if (student) {
        const receiptNo = `OFF-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
        await Payment.create({
          userId: student._id,
          clubId: targetClubId,
          paymentType: finalType,
          receiptNumber: receiptNo,
          amount: finalAmount,
          paymentMethod: method,
          status: 'success',
          offlineDocId: offlineDocId || null,
          offlineNotes: notes || 'Batch verified via Admin Offline List',
          verifiedBy: req.user._id,
          razorpayOrderId: `OFFLINE_BATCH_${Date.now()}`
        });

        student.paymentStatus = true;
        if (targetClubId && !student.clubMemberships.includes(targetClubId)) {
          student.clubMemberships.push(targetClubId);
        }
        await student.save();

        if (targetClubId) {
          await Membership.findOneAndUpdate(
            { studentId: student._id, clubId: targetClubId },
            { status: 'Approved' },
            { upsert: true }
          );
        }

        successCount++;
      }
    }

    if (offlineDocId && successCount > 0) {
      await OfflinePaymentDoc.findByIdAndUpdate(offlineDocId, {
        $inc: { verifiedCount: successCount }
      });
    }

    res.json({ message: `Successfully verified and recorded offline payment for ${successCount} students!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Revert / Unmark Payment
// @route   POST /api/class-fees/revert-payment
// @access  Private (Admin only)
export const revertPayment = async (req, res) => {
  try {
    const { studentId } = req.body;
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Delete or mark payment refunded
    const pmt = await Payment.findOne({ userId: student._id }).sort({ createdAt: -1 });
    if (pmt) {
      await Payment.findByIdAndDelete(pmt._id);
    }

    // Check if other successful payments remain
    const remainingPmt = await Payment.findOne({ userId: student._id, status: { $in: ['success', 'Paid'] } });
    if (!remainingPmt) {
      student.paymentStatus = false;
      await student.save();
    }

    await AuditLog.create({
      action: 'PAYMENT_REVERTED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'User',
      targetId: student._id,
      details: { student: student.name, roll_no: student.roll_no },
      status: 'SUCCESS'
    });

    res.json({ message: `Payment reverted to Pending for student ${student.name}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Helper to parse Year and Batch Year
const parseYearAndBatch = (rawYear, rawCourse, rawRoll) => {
  let yearNum = 1;
  let batchYear = '';

  const str = String(rawYear || '').trim();
  
  // Look for 4-digit year like 2023, 2024, 2025, 2026
  const yearMatch = str.match(/(20\d{2})/);
  if (yearMatch) {
    batchYear = yearMatch[1];
    const currentYear = new Date().getFullYear();
    const diff = currentYear - parseInt(batchYear, 10) + 1;
    yearNum = Math.min(Math.max(diff, 1), 5);
  } else {
    // Look for numbers like "Year 1", "Year 2", "3rd", "3"
    const numMatch = str.match(/\d+/);
    if (numMatch) {
      yearNum = parseInt(numMatch[0], 10);
      batchYear = `${new Date().getFullYear() - yearNum + 1}`;
    }
  }

  // Fallback from roll number if roll has year like STU2026... or 2329...
  if (!batchYear && rawRoll) {
    const rollMatch = String(rawRoll).match(/(20\d{2})/);
    if (rollMatch) batchYear = rollMatch[1];
  }

  return { yearNum: Math.min(Math.max(yearNum, 1), 5), batchYear: batchYear || '2026' };
};

// Helper: Normalize Department and Course with intelligent category heuristics
const normalizeDepartmentAndCourse = (rawDept, rawCourse) => {
  const deptStr = String(rawDept || '').trim();
  const courseStr = String(rawCourse || '').trim();
  const combined = `${deptStr} ${courseStr}`.toLowerCase();

  let finalDept = deptStr || 'Engineering';
  let finalCourse = courseStr || deptStr || 'B.Tech';

  if (combined.includes('pharm') || combined.includes('b.pharm') || combined.includes('bpharm')) {
    finalDept = 'Pharmacy';
    finalCourse = courseStr.toLowerCase().includes('m.pharm') ? 'M.Pharm' : (courseStr.trim() || 'B.Pharm');
  } else if (combined.includes('arch') || combined.includes('b.arch') || combined.includes('barch')) {
    finalDept = 'Architecture';
    finalCourse = courseStr.trim() || 'B.Arch';
  } else if (combined.includes('medical design') || combined.includes('med design') || combined.includes('design')) {
    finalDept = 'Medical Design';
    finalCourse = courseStr.trim() || 'Medical Design';
  } else if (combined.includes('mba') || combined.includes('management') || combined.includes('bba')) {
    finalDept = 'Management';
    finalCourse = courseStr.toLowerCase().includes('bba') ? 'BBA' : 'MBA';
  } else if (combined.includes('bca') || combined.includes('mca') || combined.includes('computer app')) {
    finalDept = 'Computer Applications';
    finalCourse = courseStr.toLowerCase().includes('mca') ? 'MCA' : 'BCA';
  } else if (['cse', 'computer', 'it', 'information technology', 'ece', 'electronics', 'mechanical', 'mech', 'civil', 'electrical', 'b.tech', 'btech', 'engineering'].some(k => combined.includes(k))) {
    finalDept = 'Engineering';
    if (!finalCourse || finalCourse.toLowerCase() === 'engineering' || finalCourse.toLowerCase() === 'cse') {
      if (combined.includes('cse')) finalCourse = 'B.Tech CSE';
      else if (combined.includes('it')) finalCourse = 'B.Tech IT';
      else if (combined.includes('ece')) finalCourse = 'B.Tech ECE';
      else if (combined.includes('mech')) finalCourse = 'B.Tech Mechanical';
      else if (combined.includes('civil')) finalCourse = 'B.Tech Civil';
      else finalCourse = 'B.Tech';
    }
  } else if (deptStr) {
    // Custom department specified in sheet
    finalDept = deptStr.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
    finalCourse = courseStr || finalDept;
  }

  return {
    department: finalDept.trim(),
    course: finalCourse.trim()
  };
};

// AI-Powered Intelligent Spreadsheet Segregator & Importer
export const parseAndSegregateFile = async (absoluteFilePath, docRecord, reqUser) => {
  const workbook = XLSX.readFile(absoluteFilePath);
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) throw new Error('Spreadsheet has no sheets');

  const worksheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (rawRows.length === 0) throw new Error('Spreadsheet has no rows');

  const defaultClub = await Club.findOne();
  const targetClubId = defaultClub?._id;

  const resultSummary = {
    totalRows: rawRows.length,
    departmentsCreated: [],
    classesCreated: [],
    studentsCreated: 0,
    studentsUpdated: 0,
    paymentsRecorded: 0,
    totalRevenue: 0
  };

  const processedClassesMap = new Map();
  const processedDeptsMap = new Map();

  const existingDepts = await Department.find();
  existingDepts.forEach(d => processedDeptsMap.set(d.name.toLowerCase(), d));

  const existingClasses = await CollegeClass.find();
  existingClasses.forEach(c => processedClassesMap.set(c.name.toLowerCase(), c));

  for (let idx = 0; idx < rawRows.length; idx++) {
    const raw = rawRows[idx];

    // Normalize keys
    const row = {};
    for (const [key, val] of Object.entries(raw)) {
      const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      row[cleanKey] = val !== undefined && val !== null ? String(val).trim() : '';
    }

    const rawRoll = row.rollnumber || row.rollno || row.roll || row.regno || row.registrationno || row.enrollment || row.id || row.studentid || `STU${Date.now()}${idx}`;
    const rawName = row.studentname || row.name || row.student || 'Student';
    const rawEmail = row.email || row.mail || `${rawRoll.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
    const rawDept = row.department || row.dept || row.branch || row.faculty || row.school || '';
    const rawCourse = row.course || row.program || row.degree || row.stream || row.class || '';
    const rawYear = row.year || row.batch || row.sem || row.semester || row.academic || '';
    const rawSection = row.section || row.sec || 'A';
    const rawAmount = row.amount || row.fee || row.fees || row.paid || '500';
    const rawPaymentMode = row.paymentmode || row.paymentmethod || row.mode || row.method || 'Offline';
    const rawFeeType = row.feetype || row.type || row.description || 'Annual Membership Fee';
    const rawReceiptNo = row.receiptnumber || row.receiptno || row.receipt || row.refno || row.transactionid || `RCP-${Date.now()}-${idx + 1}`;

    const { department: deptName, course: courseName } = normalizeDepartmentAndCourse(rawDept, rawCourse);
    const { yearNum, batchYear } = parseYearAndBatch(rawYear, courseName, rawRoll);
    const sec = (rawSection || 'A').toUpperCase().slice(0, 3);
    const amountNum = Math.max(0, parseInt(String(rawAmount).replace(/[^0-9]/g, ''), 10) || 500);

    // Format Class Card Name: e.g. "B.Tech CSE 2026 A", "Pharmacy 2023 A", "Architecture 2023 A"
    let className = '';
    if (batchYear) {
      className = `${courseName} ${batchYear} ${sec}`;
    } else {
      className = `${courseName} - Year ${yearNum} ${sec}`;
    }

    // 1. Ensure Department Exists in Database
    let deptDoc = processedDeptsMap.get(deptName.toLowerCase());
    if (!deptDoc) {
      let deptColor = 'from-blue-600 to-indigo-700';
      if (deptName.toLowerCase().includes('pharm')) deptColor = 'from-emerald-600 to-teal-700';
      else if (deptName.toLowerCase().includes('arch')) deptColor = 'from-amber-600 to-orange-700';
      else if (deptName.toLowerCase().includes('design')) deptColor = 'from-rose-600 to-pink-700';
      else if (deptName.toLowerCase().includes('mgmt') || deptName.toLowerCase().includes('manage')) deptColor = 'from-purple-600 to-violet-800';

      deptDoc = await Department.findOneAndUpdate(
        { name: deptName },
        {
          name: deptName,
          code: deptName.slice(0, 5).toUpperCase(),
          description: `Department of ${deptName}`,
          color: deptColor
        },
        { upsert: true, new: true }
      );
      processedDeptsMap.set(deptName.toLowerCase(), deptDoc);
      if (!resultSummary.departmentsCreated.includes(deptName)) {
        resultSummary.departmentsCreated.push(deptName);
      }
    }

    // 2. Ensure Class Card Exists in Database
    let classDoc = processedClassesMap.get(className.toLowerCase());
    if (!classDoc) {
      classDoc = await CollegeClass.findOneAndUpdate(
        { department: deptName, name: className },
        {
          name: className,
          department: deptName,
          departmentId: deptDoc._id,
          course: courseName,
          year: yearNum,
          section: sec,
          batchYear: String(batchYear),
          standardFee: amountNum,
          academicYear: `${batchYear}-${parseInt(batchYear, 10) + 4}`
        },
        { upsert: true, new: true }
      );
      processedClassesMap.set(className.toLowerCase(), classDoc);
      if (!resultSummary.classesCreated.includes(className)) {
        resultSummary.classesCreated.push(className);
      }
    }

    // 3. Create or Update Student
    let student = await User.findOne({
      $or: [
        { roll_no: rawRoll },
        { email: rawEmail.toLowerCase() }
      ]
    });

    const isPaid = amountNum > 0 || String(rawPaymentMode).toLowerCase() !== 'unpaid';

    if (student) {
      student.name = rawName || student.name;
      student.department = deptName;
      student.course = courseName;
      student.year = yearNum;
      student.section = sec;
      student.className = className;
      student.classId = classDoc._id;
      student.paymentStatus = isPaid;
      if (targetClubId && !student.clubMemberships.includes(targetClubId)) {
        student.clubMemberships.push(targetClubId);
      }
      await student.save();
      resultSummary.studentsUpdated++;
    } else {
      student = await User.create({
        name: rawName,
        username: rawRoll.toLowerCase().replace(/[^a-z0-9]/g, '_'),
        email: rawEmail.toLowerCase(),
        password: 'student123',
        role: 'student',
        roll_no: rawRoll,
        department: deptName,
        course: courseName,
        year: yearNum,
        section: sec,
        className: className,
        classId: classDoc._id,
        paymentStatus: isPaid,
        clubMemberships: targetClubId ? [targetClubId] : [],
        isVerified: true
      });
      resultSummary.studentsCreated++;
    }

    // 4. Create Payment Record if Paid
    if (isPaid) {
      let existingPmt = await Payment.findOne({
        $or: [
          { receiptNumber: rawReceiptNo },
          { userId: student._id, offlineDocId: docRecord?._id }
        ]
      });

      if (!existingPmt) {
        existingPmt = await Payment.create({
          userId: student._id,
          clubId: targetClubId,
          paymentType: 'membership_fee',
          receiptNumber: rawReceiptNo,
          amount: amountNum,
          paymentMethod: rawPaymentMode || 'Offline / Cash',
          status: 'success',
          offlineDocId: docRecord?._id || null,
          offlineNotes: `Imported and auto-segregated from ${docRecord?.originalName || 'Spreadsheet'}`,
          verifiedBy: reqUser?._id,
          razorpayOrderId: `IMPORT_${Date.now()}_${idx}`
        });
        resultSummary.paymentsRecorded++;
        resultSummary.totalRevenue += amountNum;
      }
    }
  }

  // Update verified count on the document record
  if (docRecord) {
    docRecord.verifiedCount = resultSummary.paymentsRecorded;
    docRecord.notes = `AI Segregated: ${resultSummary.classesCreated.length} classes, ${resultSummary.totalRows} students`;
    await docRecord.save();
  }

  return resultSummary;
};

// @desc    Upload an Offline Payment PDF / Spreadsheet & Run AI Auto-Segregation
// @route   POST /api/class-fees/upload-doc
// @access  Private (Admin only)
export const uploadOfflineDoc = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a PDF or spreadsheet file' });
    }

    const { department, classId, notes } = req.body;
    const relativePath = `/uploads/offline_docs/${req.file.filename}`;
    const absolutePath = req.file.path;

    const doc = await OfflinePaymentDoc.create({
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: relativePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name || 'Admin',
      department: department || 'All Departments',
      classId: classId || '',
      notes: notes || 'Offline payment list uploaded by administrator'
    });

    // Check if uploaded file is a spreadsheet/csv (.csv, .xlsx, .xls)
    const ext = path.extname(req.file.originalname).toLowerCase();
    let aiSummary = null;

    if (['.csv', '.xlsx', '.xls'].includes(ext)) {
      try {
        aiSummary = await parseAndSegregateFile(absolutePath, doc, req.user);
      } catch (parseErr) {
        console.error('AI Spreadsheet Auto-Segregation warning:', parseErr.message);
      }
    }

    res.status(201).json({
      message: aiSummary
        ? `Document '${req.file.originalname}' uploaded & mapped into ${aiSummary.classesCreated.length} class cards (${aiSummary.totalRows} students)!`
        : `Offline Payment Document '${req.file.originalname}' uploaded successfully!`,
      document: doc,
      fileUrl: relativePath,
      aiSummary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Run Auto-Segregation on an already uploaded document
// @route   POST /api/class-fees/documents/:id/ai-segregate
// @access  Private (Admin only)
export const aiSegregateDocument = async (req, res) => {
  try {
    const doc = await OfflinePaymentDoc.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Path resolution with robust fallback
    const cleanRel = (doc.filePath || '').replace(/^[/\\]+/, '');
    let absolutePath = path.join(__dirname, '..', cleanRel);
    if (!fs.existsSync(absolutePath)) {
      absolutePath = path.resolve(__dirname, '..', 'uploads', 'offline_docs', doc.fileName || path.basename(doc.filePath));
    }
    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: `File not found on server disk (${doc.filePath})` });
    }

    const aiSummary = await parseAndSegregateFile(absolutePath, doc, req.user);

    await AuditLog.create({
      action: 'DOCUMENT_SEGREGATED',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'System',
      targetId: doc._id.toString(),
      details: {
        fileName: doc.originalName,
        classesCreated: aiSummary.classesCreated,
        studentsProcessed: aiSummary.totalRows,
        revenue: aiSummary.totalRevenue
      },
      status: 'SUCCESS'
    });

    res.json({
      message: `Data mapping complete! Analyzed ${aiSummary.totalRows} rows, categorized ${aiSummary.classesCreated.length} class cards, and verified ₹${aiSummary.totalRevenue.toLocaleString('en-IN')} in payments.`,
      aiSummary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all uploaded Offline Payment Documents
// @route   GET /api/class-fees/documents
// @access  Private (Admin / Faculty)
export const getOfflineDocuments = async (req, res) => {
  try {
    const docs = await OfflinePaymentDoc.find().sort({ createdAt: -1 });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get preview / parsed rows of an uploaded document for in-app viewing
// @route   GET /api/class-fees/documents/:id/preview
// @access  Private (Admin / Faculty)
export const getDocumentPreview = async (req, res) => {
  try {
    const doc = await OfflinePaymentDoc.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    const cleanRel = (doc.filePath || '').replace(/^[/\\]+/, '');
    let absolutePath = path.join(__dirname, '..', cleanRel);
    if (!fs.existsSync(absolutePath)) {
      absolutePath = path.resolve(__dirname, '..', 'uploads', 'offline_docs', doc.fileName || path.basename(doc.filePath));
    }

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: `File not found on server disk (${doc.filePath})` });
    }

    const ext = path.extname(doc.originalName || doc.fileName || '').toLowerCase();
    const isSpreadsheet = ['.csv', '.xlsx', '.xls'].includes(ext);

    if (isSpreadsheet) {
      const workbook = XLSX.readFile(absolutePath);
      const sheetName = workbook.SheetNames[0] || 'Sheet1';
      const worksheet = workbook.Sheets[sheetName];
      const rawRows = worksheet ? XLSX.utils.sheet_to_json(worksheet, { defval: '' }) : [];

      let headers = [];
      if (rawRows.length > 0) {
        headers = Object.keys(rawRows[0]);
      }

      let totalAmount = 0;
      const deptSet = new Set();
      const courseSet = new Set();
      const paymentModeCounts = {};

      rawRows.forEach(r => {
        for (const [k, v] of Object.entries(r)) {
          const lk = k.toLowerCase().replace(/[^a-z]/g, '');
          if (['amount', 'fee', 'fees', 'paid'].includes(lk)) {
            const num = parseInt(String(v).replace(/[^0-9]/g, ''), 10);
            if (!isNaN(num)) totalAmount += num;
          }
          if (['department', 'dept', 'branch', 'faculty'].includes(lk) && v) {
            deptSet.add(String(v).trim());
          }
          if (['course', 'program', 'degree', 'class'].includes(lk) && v) {
            courseSet.add(String(v).trim());
          }
          if (['paymentmode', 'paymentmethod', 'mode', 'method'].includes(lk) && v) {
            const mode = String(v).trim();
            paymentModeCounts[mode] = (paymentModeCounts[mode] || 0) + 1;
          }
        }
      });

      return res.json({
        fileType: ext === '.csv' ? 'csv' : 'excel',
        originalName: doc.originalName,
        fileName: doc.fileName,
        filePath: doc.filePath,
        sheetNames: workbook.SheetNames,
        headers,
        rows: rawRows,
        totalRows: rawRows.length,
        stats: {
          totalAmount,
          uniqueDepartments: Array.from(deptSet),
          uniqueCourses: Array.from(courseSet),
          paymentModeCounts
        },
        document: doc
      });
    }

    // PDF or Image
    const isPdf = ext === '.pdf';
    return res.json({
      fileType: isPdf ? 'pdf' : 'image',
      originalName: doc.originalName,
      fileName: doc.fileName,
      filePath: doc.filePath,
      document: doc
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export All Classes Breakdown & Revenue Summary in Excel (.xlsx)
// @route   GET /api/class-fees/export/excel
// @access  Private (Admin / Faculty)
export const exportClassRevenueExcel = async (req, res) => {
  try {
    const classes = await CollegeClass.find({ isActive: true }).sort({ department: 1, year: 1, section: 1 }).lean();
    const students = await User.find({ role: 'student' }).select('name roll_no email department year section course clubMemberships paymentStatus createdAt').lean();
    const payments = await Payment.find({ status: { $in: ['success', 'Paid'] } }).lean();

    const paymentMap = new Map();
    payments.forEach(p => {
      if (p.userId) paymentMap.set(p.userId.toString(), p);
    });

    const summaryRows = [];
    const detailedStudentRows = [];

    let totalAllStudents = 0;
    let totalAllPaid = 0;
    let totalAllOnline = 0;
    let totalAllOffline = 0;
    let totalAllCollected = 0;
    let totalAllPendingAmt = 0;

    classes.forEach(cls => {
      const matched = students.filter(s => studentMatchesClass(s, cls));
      const fee = cls.standardFee || 500;
      let paid = 0;
      let online = 0;
      let offline = 0;
      let collected = 0;

      matched.forEach(s => {
        const pmt = paymentMap.get(s._id.toString());
        const isPaid = !!pmt || s.paymentStatus === true;
        const pmtAmount = pmt ? pmt.amount : (isPaid ? fee : 0);
        let mode = 'Unpaid';

        if (isPaid) {
          const method = (pmt?.paymentMethod || '').toLowerCase();
          if (method.includes('offline') || method.includes('cash') || method.includes('challan') || pmt?.offlineDocId) {
            mode = 'Offline';
            offline++;
          } else {
            mode = 'Online';
            online++;
          }
          paid++;
          collected += pmtAmount;
        }

        detailedStudentRows.push({
          'Roll Number': s.roll_no || 'N/A',
          'Student Name': s.name,
          'Email': s.email,
          'Department': cls.department,
          'Class Name': cls.name,
          'Course': cls.course,
          'Year': cls.year,
          'Section': cls.section,
          'Payment Status': isPaid ? 'PAID' : 'PENDING',
          'Payment Mode': mode,
          'Payment Method': pmt ? (pmt.paymentMethod || mode) : 'N/A',
          'Amount (INR)': isPaid ? pmtAmount : fee,
          'Receipt Number': pmt?.receiptNumber || (isPaid ? 'PAID-OFFLINE' : 'N/A'),
          'Payment Date': pmt?.createdAt ? new Date(pmt.createdAt).toLocaleDateString('en-IN') : 'N/A'
        });
      });

      const pendingCount = Math.max(0, matched.length - paid);
      const pendingAmt = pendingCount * fee;

      totalAllStudents += matched.length;
      totalAllPaid += paid;
      totalAllOnline += online;
      totalAllOffline += offline;
      totalAllCollected += collected;
      totalAllPendingAmt += pendingAmt;

      summaryRows.push({
        'Class Name': cls.name,
        'Department': cls.department,
        'Course': cls.course,
        'Year': cls.year,
        'Section': cls.section,
        'Fee per Student (INR)': fee,
        'Total Students': matched.length,
        'Paid Total': paid,
        'Paid Online': online,
        'Paid Offline': offline,
        'Pending Dues Count': pendingCount,
        'Revenue Collected (INR)': collected,
        'Pending Amount (INR)': pendingAmt,
        'Collection Rate (%)': matched.length > 0 ? Math.round((paid / matched.length) * 100) : 0
      });
    });

    // Summary total row
    summaryRows.push({
      'Class Name': 'TOTAL / SUMMARY',
      'Department': 'ALL DEPARTMENTS',
      'Course': 'ALL',
      'Year': '-',
      'Section': '-',
      'Fee per Student (INR)': '-',
      'Total Students': totalAllStudents,
      'Paid Total': totalAllPaid,
      'Paid Online': totalAllOnline,
      'Paid Offline': totalAllOffline,
      'Pending Dues Count': Math.max(0, totalAllStudents - totalAllPaid),
      'Revenue Collected (INR)': totalAllCollected,
      'Pending Amount (INR)': totalAllPendingAmt,
      'Collection Rate (%)': totalAllStudents > 0 ? Math.round((totalAllPaid / totalAllStudents) * 100) : 0
    });

    const wb = XLSX.utils.book_new();
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    const wsDetails = XLSX.utils.json_to_sheet(detailedStudentRows);

    XLSX.utils.book_append_sheet(wb, wsSummary, 'Classes Revenue Summary');
    XLSX.utils.book_append_sheet(wb, wsDetails, 'Student Detailed Roster');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=CampusHub_Class_Fee_Summary_${Date.now()}.xlsx`);
    res.send(buffer);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export Institutional Classes Revenue & Fee Receipt in PDF
// @route   GET /api/class-fees/export/pdf
// @access  Private (Admin / Faculty)
export const exportClassRevenuePdf = async (req, res) => {
  try {
    const classes = await CollegeClass.find({ isActive: true }).sort({ department: 1, year: 1, section: 1 }).lean();
    const students = await User.find({ role: 'student' }).select('name roll_no email department year section course clubMemberships paymentStatus').lean();
    const payments = await Payment.find({ status: { $in: ['success', 'Paid'] } }).lean();

    const paymentMap = new Map();
    payments.forEach(p => {
      if (p.userId) paymentMap.set(p.userId.toString(), p);
    });

    // Calculate aggregated metrics
    let totalRevenue = 0;
    let totalOnline = 0;
    let totalOffline = 0;
    let totalStudents = 0;
    let totalPaid = 0;
    let totalPendingAmt = 0;

    const classStats = classes.map(cls => {
      const fee = cls.standardFee || 500;
      const matched = students.filter(s => studentMatchesClass(s, cls));
      let paid = 0;
      let online = 0;
      let offline = 0;
      let collected = 0;

      matched.forEach(s => {
        const pmt = paymentMap.get(s._id.toString());
        const isPaid = !!pmt || s.paymentStatus === true;
        if (isPaid) {
          const method = (pmt?.paymentMethod || '').toLowerCase();
          if (method.includes('offline') || method.includes('cash') || method.includes('challan') || pmt?.offlineDocId) {
            offline++;
          } else {
            online++;
          }
          paid++;
          collected += (pmt ? pmt.amount : fee);
        }
      });

      const pending = Math.max(0, matched.length - paid);
      const pendingAmt = pending * fee;

      totalStudents += matched.length;
      totalPaid += paid;
      totalOnline += online;
      totalOffline += offline;
      totalRevenue += collected;
      totalPendingAmt += pendingAmt;

      return {
        name: cls.name,
        department: cls.department,
        fee,
        count: matched.length,
        paid,
        online,
        offline,
        pending,
        collected,
        rate: matched.length > 0 ? Math.round((paid / matched.length) * 100) : 0
      };
    });

    // Create PDF with PDFKit
    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=CampusHub_Class_Fee_Report_${Date.now()}.pdf`);

    doc.pipe(res);

    // 1. Header Banner
    doc.rect(40, 40, doc.page.width - 80, 75).fill('#0B132B');

    doc.fillColor('#FFFFFF').fontSize(18).font('Helvetica-Bold')
       .text('CAMPUSHUB INSTITUTIONAL FEE LEDGER', 60, 52);
    doc.fontSize(10).font('Helvetica')
       .fillColor('#94A3B8')
       .text('Comprehensive Class-wise Revenue, Online & Offline Collections Report', 60, 76);
    doc.fontSize(9).fillColor('#38BDF8')
       .text(`Generated on: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} | Authorized by: ${req.user.name || 'Administrator'}`, 60, 92);

    // 2. Executive Summary Cards Box (in the "Total Net Revenue" card aesthetic)
    const cardY = 125;
    const cardW = 120;
    const cardH = 65;

    // Card 1: Total Net Revenue
    doc.rect(40, cardY, cardW + 10, cardH).fill('#059669'); // emerald
    doc.fillColor('#D1FAE5').fontSize(8).font('Helvetica-Bold').text('TOTAL NET REVENUE', 48, cardY + 10);
    doc.fillColor('#FFFFFF').fontSize(16).text(`Rs. ${totalRevenue.toLocaleString('en-IN')}`, 48, cardY + 24);
    doc.fontSize(7).fillColor('#D1FAE5').text(`${totalPaid} / ${totalStudents} Students Paid`, 48, cardY + 46);

    // Card 2: Active Classes
    doc.rect(180, cardY, cardW, cardH).fill('#2563EB'); // blue
    doc.fillColor('#DBEAFE').fontSize(8).font('Helvetica-Bold').text('ACTIVE CLASSES', 188, cardY + 10);
    doc.fillColor('#FFFFFF').fontSize(16).text(`${classes.length} Classes`, 188, cardY + 24);
    doc.fontSize(7).fillColor('#DBEAFE').text(`${totalStudents} Enrolled Total`, 188, cardY + 46);

    // Card 3: Offline Verified
    doc.rect(310, cardY, cardW, cardH).fill('#7C3AED'); // purple
    doc.fillColor('#EDE9FE').fontSize(8).font('Helvetica-Bold').text('OFFLINE RECEIPTS', 318, cardY + 10);
    doc.fillColor('#FFFFFF').fontSize(16).text(`${totalOffline} Students`, 318, cardY + 24);
    doc.fontSize(7).fillColor('#EDE9FE').text(`Direct Cash / Bank Challans`, 318, cardY + 46);

    // Card 4: Pending Dues
    doc.rect(440, cardY, cardW + 15, cardH).fill('#D97706'); // amber
    doc.fillColor('#FEF3C7').fontSize(8).font('Helvetica-Bold').text('PENDING DUES', 448, cardY + 10);
    doc.fillColor('#FFFFFF').fontSize(16).text(`Rs. ${totalPendingAmt.toLocaleString('en-IN')}`, 448, cardY + 24);
    doc.fontSize(7).fillColor('#FEF3C7').text(`${Math.max(0, totalStudents - totalPaid)} Students Unpaid`, 448, cardY + 46);

    // 3. Table of Classes
    doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Department & Class Breakdown', 40, cardY + 80);

    let tableY = cardY + 100;

    // Header row
    doc.rect(40, tableY, doc.page.width - 80, 20).fill('#F1F5F9');
    doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
    doc.text('CLASS NAME', 45, tableY + 6);
    doc.text('DEPARTMENT', 180, tableY + 6);
    doc.text('STUDENTS', 285, tableY + 6);
    doc.text('ONLINE', 340, tableY + 6);
    doc.text('OFFLINE', 385, tableY + 6);
    doc.text('COLLECTED (RS)', 435, tableY + 6);
    doc.text('STATUS', 510, tableY + 6);

    tableY += 22;

    // Table rows
    classStats.forEach((c, index) => {
      if (tableY > doc.page.height - 80) {
        doc.addPage();
        tableY = 50;
      }

      if (index % 2 === 1) {
        doc.rect(40, tableY - 2, doc.page.width - 80, 18).fill('#F8FAFC');
      }

      doc.fillColor('#0F172A').fontSize(8).font('Helvetica');
      doc.text(c.name.slice(0, 24), 45, tableY + 2);
      doc.fillColor('#475569').text(c.department.slice(0, 18), 180, tableY + 2);
      doc.text(`${c.count}`, 295, tableY + 2);
      doc.fillColor('#0284C7').text(`${c.online}`, 348, tableY + 2);
      doc.fillColor('#7C3AED').text(`${c.offline}`, 395, tableY + 2);
      doc.fillColor('#059669').font('Helvetica-Bold').text(`Rs. ${c.collected.toLocaleString('en-IN')}`, 435, tableY + 2);
      doc.font('Helvetica');

      if (c.rate >= 75) {
        doc.fillColor('#059669').text(`${c.rate}% Paid`, 510, tableY + 2);
      } else if (c.rate >= 40) {
        doc.fillColor('#D97706').text(`${c.rate}% Paid`, 510, tableY + 2);
      } else {
        doc.fillColor('#DC2626').text(`${c.rate}% Paid`, 510, tableY + 2);
      }

      tableY += 18;
    });

    // Total bottom row
    doc.rect(40, tableY + 4, doc.page.width - 80, 22).fill('#E2E8F0');
    doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold');
    doc.text('CONSOLIDATED TOTAL:', 45, tableY + 10);
    doc.text(`${totalStudents}`, 295, tableY + 10);
    doc.text(`${totalOnline}`, 348, tableY + 10);
    doc.text(`${totalOffline}`, 395, tableY + 10);
    doc.text(`Rs. ${totalRevenue.toLocaleString('en-IN')}`, 435, tableY + 10);
    const overallRate = totalStudents > 0 ? Math.round((totalPaid / totalStudents) * 100) : 0;
    doc.text(`${overallRate}%`, 510, tableY + 10);

    // Official Seal and Signatures
    tableY += 45;
    if (tableY > doc.page.height - 100) {
      doc.addPage();
      tableY = 60;
    }

    doc.rect(40, tableY, doc.page.width - 80, 50).stroke('#CBD5E1');
    doc.fillColor('#64748B').fontSize(8).font('Helvetica');
    doc.text('INSTITUTIONAL AUDIT VERIFICATION CERTIFICATE', 50, tableY + 8);
    doc.text('This document certifies that the class dues and fee receipts compiled herein represent reconciled live ledger balances across online payment gateways (Razorpay) and verified offline bank challan / cash registry entries.', 50, tableY + 20, { width: doc.page.width - 100 });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Export Single Class Roster & Payment Receipt in PDF
// @route   GET /api/class-fees/classes/:id/export/pdf
// @access  Private (Admin / Faculty)
export const exportSingleClassPdf = async (req, res) => {
  try {
    const cls = await CollegeClass.findById(req.params.id);
    if (!cls) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const students = await User.find({ role: 'student' }).select('name roll_no email department year section course clubMemberships paymentStatus createdAt').populate('clubMemberships', 'name').lean();
    const payments = await Payment.find({ status: { $in: ['success', 'Paid'] } }).populate('clubId', 'name').lean();

    const paymentMap = new Map();
    payments.forEach(p => {
      if (p.userId) paymentMap.set(p.userId.toString(), p);
    });

    const matched = students.filter(s => studentMatchesClass(s, cls));
    const fee = cls.standardFee || 500;

    const doc = new PDFDocument({ margin: 40, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${cls.name.replace(/[^a-zA-Z0-9]/g, '_')}_Roster.pdf`);

    doc.pipe(res);

    // Header
    doc.rect(40, 40, doc.page.width - 80, 65).fill('#0B132B');
    doc.fillColor('#FFFFFF').fontSize(16).font('Helvetica-Bold').text(cls.name, 60, 52);
    doc.fontSize(9).font('Helvetica').fillColor('#94A3B8')
       .text(`Department: ${cls.department} | Course: ${cls.course} | Section: ${cls.section} | Standard Fee: Rs. ${fee}`, 60, 72);
    doc.fontSize(8).fillColor('#38BDF8')
       .text(`Official Class Receipt & Fee Collection Record | Total Enrolled: ${matched.length}`, 60, 86);

    let y = 120;

    // Table Header
    doc.rect(40, y, doc.page.width - 80, 20).fill('#F1F5F9');
    doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
    doc.text('ROLL NO', 45, y + 6);
    doc.text('STUDENT NAME', 115, y + 6);
    doc.text('STATUS', 230, y + 6);
    doc.text('MODE', 285, y + 6);
    doc.text('AMOUNT', 345, y + 6);
    doc.text('RECEIPT NO', 400, y + 6);
    doc.text('CLUBS', 490, y + 6);

    y += 22;

    matched.forEach((s, idx) => {
      if (y > doc.page.height - 60) {
        doc.addPage();
        y = 40;
      }

      const pmt = paymentMap.get(s._id.toString());
      const isPaid = !!pmt || s.paymentStatus === true;
      let mode = 'Unpaid';
      if (isPaid) {
        const method = (pmt?.paymentMethod || '').toLowerCase();
        mode = (method.includes('offline') || method.includes('cash') || method.includes('challan')) ? 'Offline' : 'Online';
      }

      if (idx % 2 === 1) {
        doc.rect(40, y - 2, doc.page.width - 80, 18).fill('#F8FAFC');
      }

      doc.fillColor('#0F172A').fontSize(8).font('Helvetica');
      doc.text(s.roll_no || 'N/A', 45, y + 2);
      doc.text(s.name.slice(0, 20), 115, y + 2);

      if (isPaid) {
        doc.fillColor('#059669').font('Helvetica-Bold').text('PAID', 230, y + 2);
      } else {
        doc.fillColor('#DC2626').font('Helvetica-Bold').text('PENDING', 230, y + 2);
      }

      doc.font('Helvetica');
      doc.fillColor('#475569').text(mode, 285, y + 2);
      doc.text(`Rs. ${isPaid ? (pmt?.amount || fee) : fee}`, 345, y + 2);
      doc.text(pmt?.receiptNumber ? pmt.receiptNumber.slice(0, 14) : (isPaid ? 'VERIFIED' : '-'), 400, y + 2);

      const clubNames = (s.clubMemberships || []).map(c => c.name).join(', ');
      doc.text(clubNames ? clubNames.slice(0, 16) : 'Societies', 490, y + 2);

      y += 18;
    });

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
