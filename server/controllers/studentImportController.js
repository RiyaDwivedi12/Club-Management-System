import XLSX from 'xlsx';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import crypto from 'crypto';

// Helper to normalize column names from any college spreadsheet format
const normalizeRow = (row) => {
  const normalized = {};
  for (const [key, val] of Object.entries(row)) {
    const cleanKey = key.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanVal = val !== undefined && val !== null ? String(val).trim() : '';

    if (cleanKey.includes('roll') || cleanKey.includes('reg') || cleanKey.includes('enroll') || cleanKey === 'id' || cleanKey === 'studentid') {
      normalized.roll_no = cleanVal.toUpperCase();
    } else if (cleanKey.includes('name') || cleanKey.includes('studentname') || cleanKey === 'student') {
      normalized.name = cleanVal;
    } else if (cleanKey.includes('email') || cleanKey.includes('mail')) {
      normalized.email = cleanVal.toLowerCase();
    } else if (cleanKey.includes('dept') || cleanKey.includes('branch') || cleanKey.includes('course') || cleanKey.includes('program') || cleanKey.includes('stream')) {
      normalized.department = cleanVal.toUpperCase();
    } else if (cleanKey.includes('year') || cleanKey.includes('sem') || cleanKey.includes('academic') || cleanKey === 'class') {
      // Extract number from year (e.g. "Year 3", "3rd", "3")
      const numMatch = cleanVal.match(/\d+/);
      normalized.year = numMatch ? parseInt(numMatch[0], 10) : 1;
    } else if (cleanKey.includes('user') || cleanKey.includes('username')) {
      normalized.username = cleanVal.toLowerCase();
    }
  }

  // Fallbacks if missing
  if (normalized.roll_no && !normalized.email) {
    normalized.email = `${normalized.roll_no.toLowerCase()}@campus.edu`;
  }
  if (!normalized.username && normalized.roll_no) {
    normalized.username = normalized.roll_no.toLowerCase();
  }
  if (!normalized.year) {
    normalized.year = 1;
  }
  if (!normalized.department) {
    normalized.department = 'GENERAL';
  }

  return normalized;
};

// @desc    Pre-flight preview & validate uploaded student spreadsheet
// @route   POST /api/student-directory/import-preview
// @access  Private (Admin only)
export const previewStudentImport = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'No spreadsheet file uploaded. Please upload a .xlsx, .xls, or .csv file.' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      return res.status(400).json({ message: 'The uploaded spreadsheet is empty.' });
    }

    const worksheet = workbook.Sheets[firstSheetName];
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

    if (rawRows.length === 0) {
      return res.status(400).json({ message: 'No student records found in sheet.' });
    }

    const parsedRows = rawRows.map((r, idx) => ({
      ...normalizeRow(r),
      _rowIndex: idx + 2 // accounting for header row
    }));

    // Find duplicates inside the file itself
    const seenRolls = new Set();
    const seenEmails = new Set();
    const fileDuplicateRolls = new Set();

    for (const row of parsedRows) {
      if (row.roll_no) {
        if (seenRolls.has(row.roll_no)) fileDuplicateRolls.add(row.roll_no);
        seenRolls.add(row.roll_no);
      }
      if (row.email) {
        seenEmails.add(row.email);
      }
    }

    // Check existing database records
    const allRolls = parsedRows.map(r => r.roll_no).filter(Boolean);
    const allEmails = parsedRows.map(r => r.email).filter(Boolean);

    const existingUsers = await User.find({
      $or: [
        { roll_no: { $in: allRolls } },
        { email: { $in: allEmails } }
      ]
    }).select('roll_no email name department year');

    const dbRollSet = new Set(existingUsers.map(u => u.roll_no?.toUpperCase()).filter(Boolean));
    const dbEmailSet = new Set(existingUsers.map(u => u.email?.toLowerCase()).filter(Boolean));

    // Department & Class aggregation counts
    const departmentCounts = {};
    const yearCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    let validCount = 0;
    let duplicateDbCount = 0;
    let invalidCount = 0;

    const validatedRows = parsedRows.map(row => {
      const errors = [];
      let status = 'valid';

      if (!row.name) errors.push('Missing Student Name');
      if (!row.roll_no) errors.push('Missing Roll Number');

      const isDbDuplicate = (row.roll_no && dbRollSet.has(row.roll_no)) || (row.email && dbEmailSet.has(row.email));
      const isFileDuplicate = row.roll_no && fileDuplicateRolls.has(row.roll_no);

      if (isDbDuplicate) {
        status = 'db_duplicate';
        duplicateDbCount++;
      } else if (isFileDuplicate) {
        status = 'file_duplicate';
      }

      if (errors.length > 0) {
        status = 'invalid';
        invalidCount++;
      } else {
        validCount++;
        // Count departments and years for valid/importable rows
        const dept = row.department || 'GENERAL';
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;
        if (row.year && yearCounts[row.year] !== undefined) {
          yearCounts[row.year] += 1;
        }
      }

      return {
        ...row,
        status,
        errors,
        isExistingInDb: isDbDuplicate
      };
    });

    res.json({
      totalRows: parsedRows.length,
      validCount,
      duplicateDbCount,
      invalidCount,
      departmentCounts,
      yearCounts,
      preview: validatedRows.slice(0, 100), // First 100 preview rows
      allValidatedRows: validatedRows // full payload for confirmation
    });
  } catch (error) {
    console.error('previewStudentImport error:', error);
    res.status(500).json({ message: 'Failed to parse spreadsheet: ' + error.message });
  }
};

// @desc    Confirm and batch upsert validated students
// @route   POST /api/student-directory/import-confirm
// @access  Private (Admin only)
export const confirmStudentImport = async (req, res) => {
  try {
    const { students, updateDuplicates = true } = req.body;

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'No student records provided for import.' });
    }

    let createdCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const s of students) {
      if (!s.name || !s.roll_no) {
        skippedCount++;
        continue;
      }

      const existing = await User.findOne({
        $or: [
          { roll_no: s.roll_no },
          { email: s.email }
        ]
      });

      if (existing) {
        if (updateDuplicates) {
          existing.name = s.name;
          if (s.department) existing.department = s.department;
          if (s.year) existing.year = s.year;
          if (!existing.roll_no) existing.roll_no = s.roll_no;
          await existing.save();
          updatedCount++;
        } else {
          skippedCount++;
        }
      } else {
        // Generate a random temporary password
        const tempPassword = `Camp@${s.roll_no.slice(-4) || '2026'}`;
        await User.create({
          name: s.name,
          username: s.username || s.roll_no.toLowerCase(),
          email: s.email || `${s.roll_no.toLowerCase()}@campus.edu`,
          password: tempPassword,
          roll_no: s.roll_no,
          department: s.department || 'GENERAL',
          year: s.year || 1,
          role: 'student',
          isVerified: true
        });
        createdCount++;
      }
    }

    // Log to audit log
    await AuditLog.create({
      action: 'STUDENT_BULK_IMPORT',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'User',
      details: {
        totalSubmitted: students.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount
      },
      status: 'SUCCESS'
    });

    res.json({
      message: `Import complete! Created ${createdCount} new students, updated ${updatedCount} existing records.`,
      createdCount,
      updatedCount,
      skippedCount
    });
  } catch (error) {
    console.error('confirmStudentImport error:', error);
    res.status(500).json({ message: 'Batch import failed: ' + error.message });
  }
};

// @desc    Export filtered student directory to Excel (.xlsx)
// @route   GET /api/student-directory/export
// @access  Private (Admin / Faculty)
export const exportStudentDirectory = async (req, res) => {
  try {
    const { course, section, department, year, search } = req.query;

    const query = { role: 'student' };

    if (course && course !== 'all') {
      query.course = new RegExp('^' + course + '$', 'i');
    }
    if (section && section !== 'all') {
      query.section = new RegExp('^' + section + '$', 'i');
    }
    if (department && department !== 'all') {
      query.department = department;
    }
    if (year && year !== 'all') {
      query.year = parseInt(year, 10);
    }
    if (search) {
      const s = search.trim();
      query.$or = [
        { name: new RegExp(s, 'i') },
        { roll_no: new RegExp(s, 'i') },
        { email: new RegExp(s, 'i') },
        { course: new RegExp(s, 'i') },
        { section: new RegExp(s, 'i') }
      ];
    }

    const students = await User.find(query).select('roll_no name email course section department year isVerified createdAt').sort({ course: 1, section: 1, roll_no: 1 });

    const exportData = students.map((s, index) => ({
      'S.No': index + 1,
      'Roll Number': s.roll_no || 'N/A',
      'Student Name': s.name,
      'Email Address': s.email,
      'Class / Course': s.course || 'B.Tech',
      'Section': s.section || 'A',
      'Branch / Department': s.department || 'GENERAL',
      'Academic Year': s.year ? `Year ${s.year}` : 'Year 1',
      'Verified': s.isVerified ? 'YES' : 'NO',
      'Enrolled Date': s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="CampusHub-Student-Directory-${Date.now()}.xlsx"`);
    res.send(buffer);
  } catch (error) {
    console.error('exportStudentDirectory error:', error);
    res.status(500).json({ message: 'Failed to export directory: ' + error.message });
  }
};

// @desc    Get demographic and department counts
// @route   GET /api/student-directory/demographics
// @access  Private (Admin / Faculty)
export const getStudentDemographics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    // Aggregation by Course / Class
    const courseStats = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: { $ifNull: ['$course', 'B.Tech'] }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Aggregation by Section
    const sectionStats = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: { $ifNull: ['$section', 'A'] }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Aggregation by Department
    const departmentStats = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: { $toUpper: '$department' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Aggregation by Academic Year
    const yearStats = await User.aggregate([
      { $match: { role: 'student' } },
      { $group: { _id: '$year', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalStudents,
      courseStats,
      sectionStats,
      departmentStats,
      yearStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get list of students with filtering and pagination
// @route   GET /api/student-directory
// @access  Private (Admin / Faculty)
export const getStudentsList = async (req, res) => {
  try {
    const { course, section, department, year, search, page = 1, limit = 50 } = req.query;
    const query = { role: 'student' };

    if (course && course !== 'all') {
      query.course = new RegExp('^' + course + '$', 'i');
    }
    if (section && section !== 'all') {
      query.section = new RegExp('^' + section + '$', 'i');
    }
    if (department && department !== 'all') {
      query.department = department;
    }
    if (year && year !== 'all') {
      query.year = parseInt(year, 10);
    }
    if (search) {
      const s = search.trim();
      query.$or = [
        { name: new RegExp(s, 'i') },
        { roll_no: new RegExp(s, 'i') },
        { email: new RegExp(s, 'i') },
        { course: new RegExp(s, 'i') },
        { section: new RegExp(s, 'i') }
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [students, total] = await Promise.all([
      User.find(query)
        .select('name roll_no email course section department year isVerified createdAt')
        .sort({ course: 1, section: 1, roll_no: 1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum),
      User.countDocuments(query)
    ]);

    res.json({
      students,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      total
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a student record
// @route   DELETE /api/student-directory/:id
// @access  Private (Admin only)
export const deleteStudent = async (req, res) => {
  try {
    const student = await User.findById(req.params.id);
    if (!student || student.role !== 'student') {
      return res.status(404).json({ message: 'Student record not found' });
    }

    await User.findByIdAndDelete(req.params.id);

    await AuditLog.create({
      action: 'STUDENT_DELETE',
      performedBy: req.user._id,
      performedByName: req.user.name,
      performedByRole: req.user.role,
      targetType: 'User',
      targetId: req.params.id,
      details: { roll_no: student.roll_no, name: student.name },
      status: 'SUCCESS'
    });

    res.json({ message: 'Student record removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

