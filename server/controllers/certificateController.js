import Certificate from '../models/Certificate.js';
import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import Notification from '../models/Notification.js';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to generate elegant PDF Certificate with Game and Match Won details
const createCertificatePDF = (certData, filePath) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
      margin: 0
    });

    const writeStream = fs.createWriteStream(filePath);
    doc.pipe(writeStream);

    const W = doc.page.width;  // 841.89
    const H = doc.page.height; // 595.28
    const rightBarW = 50;
    const contentW = W - rightBarW;

    // 1. Clean Canvas Background
    doc.rect(0, 0, W, H).fill('#FFFFFF');

    // 2. Right Deep Crimson Pattern Bar (#7E1522)
    doc.rect(contentW, 0, rightBarW, H).fill('#7E1522');
    
    // White Chevron/Zigzag motif down the right bar
    doc.strokeColor('#FFFFFF').lineWidth(1.8).lineCap('round');
    for (let y = 10; y < H - 15; y += 18) {
      doc.moveTo(contentW + 12, y)
         .lineTo(contentW + 25, y + 9)
         .lineTo(contentW + 12, y + 18)
         .stroke();
      doc.moveTo(contentW + 25, y)
         .lineTo(contentW + 38, y + 9)
         .lineTo(contentW + 25, y + 18)
         .stroke();
    }
    // Thin gold divider line
    doc.rect(contentW - 2, 0, 2, H).fill('#C59B27');

    // 3. Laurel Wreath Watermark
    const cx = contentW / 2;
    const cy = H / 2 - 12;
    doc.save();
    doc.strokeColor('#F1F5F9').lineWidth(3);
    doc.arc(cx - 145, cy, 135, -Math.PI / 2.3, Math.PI / 2.3).stroke();
    doc.arc(cx + 145, cy, 135, Math.PI - Math.PI / 2.3, Math.PI + Math.PI / 2.3).stroke();
    doc.restore();

    // 4. Top Sports Flame/Ball Emblem
    doc.save();
    const iconX = cx;
    const iconY = 46;
    doc.fillColor('#991B1B').circle(iconX, iconY, 14).fill();
    doc.fillColor('#DC2626').circle(iconX + 6, iconY - 5, 8).fill();
    doc.strokeColor('#FFFFFF').lineWidth(1.4)
       .moveTo(iconX - 12, iconY).lineTo(iconX + 12, iconY).stroke()
       .moveTo(iconX, iconY - 12).lineTo(iconX, iconY + 12).stroke();
    doc.restore();

    // 5. Association Header
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor('#1E293B')
       .text('CAMPUSHUB ELITE SPORTS & ATHLETICS COUNCIL', 0, 72, {
         width: contentW,
         align: 'center',
         characterSpacing: 2
       });

    // 6. CERTIFICATE Main Title
    doc.font('Times-Bold')
       .fontSize(38)
       .fillColor('#1B365D')
       .text('CERTIFICATE OF ACHIEVEMENT', 0, 96, {
         width: contentW,
         align: 'center',
         characterSpacing: 2
       });

    // 7. Subtitle
    doc.font('Helvetica-Bold')
       .fontSize(9)
       .fillColor('#7E1522')
       .text('OFFICIAL VICTORY & MERIT RECOGNITION', 0, 142, {
         width: contentW,
         align: 'center',
         characterSpacing: 3
       });

    // 8. This is proudly presented to
    doc.font('Times-Italic')
       .fontSize(14)
       .fillColor('#64748B')
       .text('This is proudly presented to', 0, 168, {
         width: contentW,
         align: 'center'
       });

    // 9. Recipient Name
    const recipient = (certData.userName || certData.recipientName || 'Student Athlete').toUpperCase();
    doc.font('Times-Bold')
       .fontSize(30)
       .fillColor('#0F172A')
       .text(recipient, 0, 192, {
         width: contentW,
         align: 'center'
       });

    // Name Underline
    doc.strokeColor('#C59B27').lineWidth(2);
    doc.moveTo(cx - 150, 230).lineTo(cx + 150, 230).stroke();

    // 10. Roll Number & Department Badge
    const rollText = certData.roll_no ? `ROLL NO: ${certData.roll_no}` : '';
    const deptText = certData.department ? ` • ${certData.department.toUpperCase()}` : '';
    if (rollText) {
      doc.font('Helvetica-Bold')
         .fontSize(10)
         .fillColor('#475569')
         .text(`${rollText}${deptText}`, 0, 238, {
           width: contentW,
           align: 'center',
           characterSpacing: 1
         });
    }

    // 11. Body Text with Game & Match Details
    const game = certData.game || 'Sports Tournament';
    const match = certData.matchDetails || certData.achievement || 'Match Victory';
    const tournament = certData.tournamentName || certData.title || 'Inter-Department Annual Championship';

    doc.font('Helvetica')
       .fontSize(12)
       .fillColor('#334155')
       .text(
         `In recognition of outstanding performance, sportsmanship, and triumph in ${game}. `,
         cx - 240,
         265,
         {
           width: 480,
           align: 'center',
           lineGap: 4
         }
       );

    // Prominent Match Won highlight banner
    doc.font('Helvetica-Bold')
       .fontSize(14)
       .fillColor('#7E1522')
       .text(`VICTORY: ${match.toUpperCase()}`, 0, 305, {
         width: contentW,
         align: 'center',
         characterSpacing: 1
       });

    doc.font('Helvetica-Oblique')
       .fontSize(11)
       .fillColor('#64748B')
       .text(`Event: ${tournament}`, 0, 328, {
         width: contentW,
         align: 'center'
       });

    // Date
    const dateObj = new Date(certData.issueDate || Date.now());
    const formattedDate = dateObj.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
    doc.font('Helvetica')
       .fontSize(10)
       .fillColor('#64748B')
       .text(`Date of Issuance: ${formattedDate}`, 0, 355, {
         width: contentW,
         align: 'center'
       });

    // 12. Signatures Section
    const signY = 410;
    // Left Signatory (Admin / Sports President)
    doc.strokeColor('#CBD5E1').lineWidth(1);
    doc.moveTo(cx - 210, signY).lineTo(cx - 50, signY).stroke();
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor('#1E293B')
       .text(certData.issuedByName || 'Kenneth Dorsen', cx - 210, signY + 6, { width: 160, align: 'center' });
    doc.font('Helvetica')
       .fontSize(8)
       .fillColor('#64748B')
       .text(certData.issuedByRole ? certData.issuedByRole.toUpperCase() : 'SPORTS AUTHORITY', cx - 210, signY + 20, { width: 160, align: 'center' });

    // Right Signatory (Dean / Faculty Coordinator)
    doc.moveTo(cx + 50, signY).lineTo(cx + 210, signY).stroke();
    doc.font('Helvetica-Bold')
       .fontSize(10)
       .fillColor('#1E293B')
       .text('Director of Athletics', cx + 50, signY + 6, { width: 160, align: 'center' });
    doc.font('Helvetica')
       .fontSize(8)
       .fillColor('#64748B')
       .text('CAMPUS SPORTS BOARD', cx + 50, signY + 20, { width: 160, align: 'center' });

    // Authenticity Code
    doc.font('Courier')
       .fontSize(8)
       .fillColor('#94A3B8')
       .text(`CREDENTIAL ID: ${certData.verificationHash || 'VERIFIED-RECORD'}`, 0, signY + 45, {
         width: contentW,
         align: 'center'
       });

    doc.end();

    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
};

// @desc    Preview Excel / CSV Certificate Upload
// @route   POST /api/certificates/bulk-preview
// @access  Private (Admin/Faculty/President)
export const bulkPreviewCertificates = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Please select an Excel (.xlsx, .xls) or CSV file to upload' });
    }

    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return res.status(400).json({ message: 'The uploaded spreadsheet is empty' });
    }

    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });
    if (!rawRows || rawRows.length === 0) {
      return res.status(400).json({ message: 'No data rows found in the uploaded file' });
    }

    // Helper: fuzzy match column key
    const findCol = (row, candidates) => {
      const keys = Object.keys(row);
      for (const c of candidates) {
        const found = keys.find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === c.toLowerCase().replace(/[^a-z0-9]/g, ''));
        if (found && row[found] !== undefined && row[found] !== '') return String(row[found]).trim();
      }
      return '';
    };

    const parsedRows = [];
    for (let i = 0; i < rawRows.length; i++) {
      const row = rawRows[i];
      const roll_no = findCol(row, ['roll_no', 'rollno', 'rollnumber', 'roll', 'studentid', 'id']);
      const name = findCol(row, ['name', 'studentname', 'student_name', 'playername', 'recipient']);
      const game = findCol(row, ['game', 'sport', 'gamename', 'event', 'activity', 'sportname']) || 'Sports Championship';
      const match = findCol(row, ['matchwon', 'match', 'matchdetails', 'achievement', 'won', 'position', 'result']) || 'Winner';
      const department = findCol(row, ['department', 'dept', 'branch', 'course']) || '';
      const achievement = findCol(row, ['achievement', 'title', 'medal', 'award']) || 'Winner';

      if (!roll_no && !name) continue; // skip blank rows

      // Try finding user in DB by roll_no
      let matchedUser = null;
      if (roll_no) {
        matchedUser = await User.findOne({ roll_no: new RegExp('^' + roll_no + '$', 'i') }).select('name email roll_no department year');
      }
      if (!matchedUser && name) {
        matchedUser = await User.findOne({ name: new RegExp('^' + name + '$', 'i') }).select('name email roll_no department year');
      }

      parsedRows.push({
        rowIndex: i + 1,
        roll_no: roll_no || (matchedUser ? matchedUser.roll_no : 'N/A'),
        recipientName: name || (matchedUser ? matchedUser.name : 'Unknown Student'),
        game,
        matchDetails: match,
        achievement,
        department: department || (matchedUser ? matchedUser.department : ''),
        isMatched: Boolean(matchedUser),
        matchedUser: matchedUser || null
      });
    }

    if (parsedRows.length === 0) {
      return res.status(400).json({ message: 'Could not extract valid student records. Please ensure your file has Roll Number, Name, Game, and Match columns.' });
    }

    const matchedCount = parsedRows.filter(r => r.isMatched).length;

    res.json({
      totalRows: parsedRows.length,
      matchedCount,
      rows: parsedRows
    });
  } catch (error) {
    console.error('bulkPreviewCertificates error:', error);
    res.status(500).json({ message: error.message || 'Failed to parse spreadsheet file' });
  }
};

// @desc    Bulk Issue Certificates from Parsed Excel / CSV data
// @route   POST /api/certificates/bulk-issue
// @access  Private (Admin/Faculty/President)
export const bulkIssueCertificates = async (req, res) => {
  try {
    const { certificates, issuedByName, issuedByRole, tournamentName } = req.body;

    if (!Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({ message: 'Please provide valid certificate records to issue' });
    }

    const uploadDir = path.join(__dirname, '../uploads/certificates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const issuedCertificates = [];
    const signerName = issuedByName || req.user.name || 'Athletic Director';
    const signerRole = issuedByRole || req.user.role || 'admin';

    for (const item of certificates) {
      const cleanRoll = (item.roll_no || '').trim();
      const cleanName = (item.recipientName || '').trim();
      const cleanGame = (item.game || 'Sports Tournament').trim();
      const cleanMatch = (item.matchDetails || item.achievement || 'Final Match Won').trim();
      const cleanAchievement = (item.achievement || 'Winner').trim();

      // Find user if registered
      let user = null;
      if (cleanRoll && cleanRoll !== 'N/A') {
        user = await User.findOne({ roll_no: new RegExp('^' + cleanRoll + '$', 'i') });
      }
      if (!user && cleanName) {
        user = await User.findOne({ name: new RegExp('^' + cleanName + '$', 'i') });
      }

      const verificationHash = 'CERT-' + crypto.randomBytes(4).toString('hex').toUpperCase();

      const certDoc = await Certificate.create({
        userId: user ? user._id : undefined,
        roll_no: cleanRoll || (user ? user.roll_no : ''),
        recipientName: cleanName || (user ? user.name : 'Student Athlete'),
        game: cleanGame,
        matchDetails: cleanMatch,
        achievement: cleanAchievement,
        title: `${cleanGame} - ${cleanMatch}`,
        tournamentName: tournamentName || item.tournamentName || 'Annual Sports Championship',
        department: item.department || (user ? user.department : ''),
        year: user ? user.year : 1,
        type: cleanAchievement.toLowerCase().includes('runner') ? 'runner-up' : 'winner',
        verificationHash,
        status: 'approved',
        issuedByName: signerName,
        issuedByRole: signerRole,
        issueDate: new Date()
      });

      // Send real-time in-app notification if user account exists
      if (user) {
        try {
          await Notification.create({
            user: user._id,
            message: `🏆 Certificate Approved! You won in ${cleanGame} (${cleanMatch}). Your official certificate is now ready on your Profile & Certificates tab.`,
            type: 'general',
            link: '/certificates'
          });
        } catch (notifErr) {
          console.error('Notification error (non-fatal):', notifErr.message);
        }
      }

      issuedCertificates.push(certDoc);
    }

    res.status(201).json({
      message: `Successfully issued and approved ${issuedCertificates.length} certificates!`,
      count: issuedCertificates.length,
      certificates: issuedCertificates
    });
  } catch (error) {
    console.error('bulkIssueCertificates error:', error);
    res.status(500).json({ message: error.message || 'Failed to issue bulk certificates' });
  }
};

// @desc    Download sample CSV / Excel template
// @route   GET /api/certificates/template/download
// @access  Public
export const downloadCertificateTemplate = (req, res) => {
  const sampleHeaders = 'Roll Number,Student Name,Game,Match Won / Achievement,Department\n';
  const sampleData = [
    '23CS012,Riya Dwivedi,Badminton,Final Match Won (Gold Medal),Computer Science',
    'PH24101,Rohan Deshmukh,Cricket,Champions - Inter-Branch Final,Pharmacy',
    '24IT005,Aarav Sharma,Chess,Tournament Winner (Rapid Chess),Information Technology',
    '22ME034,Karan Patel,Football,Best Striker - Championship Won,Mechanical'
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="Sports_Certificates_Template.csv"');
  res.status(200).send(sampleHeaders + sampleData);
};

// @desc    Get certificates for logged in student (matching userId OR roll_no)
// @route   GET /api/certificates/my-certificates
// @access  Private
export const getMyCertificates = async (req, res) => {
  try {
    const userRoll = req.user.roll_no ? req.user.roll_no.trim() : null;
    const query = {
      $or: [
        { userId: req.user._id },
        ...(userRoll ? [{ roll_no: new RegExp('^' + userRoll + '$', 'i') }] : [])
      ]
    };
    const certs = await Certificate.find(query)
      .populate('tournamentId', 'name wing clubId')
      .sort({ createdAt: -1 });

    res.json(certs);
  } catch (error) {
    console.error('getMyCertificates error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all certificates (Admin/Faculty/President)
// @route   GET /api/certificates
// @access  Private (Admin/Faculty/President)
export const getAllCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({})
      .populate('userId', 'name email roll_no')
      .populate('tournamentId', 'name')
      .sort({ createdAt: -1 });
    res.json(certs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Verify certificate by hash
// @route   GET /api/certificates/verify/:hash
// @access  Public
export const verifyCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findOne({ verificationHash: req.params.hash.toUpperCase() })
      .populate('userId', 'name email department year roll_no')
      .populate('tournamentId', 'name clubId');

    if (!cert) {
      return res.status(404).json({ valid: false, message: 'Invalid certificate verification code.' });
    }

    res.json({
      valid: true,
      certificate: cert
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Download certificate PDF by ID
// @route   GET /api/certificates/:id/download
// @access  Public
export const downloadCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findById(req.params.id)
      .populate('userId', 'name email roll_no')
      .populate('tournamentId', 'name');

    if (!cert) {
      return res.status(404).json({ message: 'Certificate not found' });
    }

    const uploadDir = path.join(__dirname, '../uploads/certificates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `cert-${cert._id}.pdf`;
    const filePath = path.join(uploadDir, fileName);

    // If PDF does not exist on disk, render on demand
    if (!fs.existsSync(filePath)) {
      await createCertificatePDF({
        userName: cert.recipientName || cert.userId?.name || 'Student Athlete',
        roll_no: cert.roll_no || cert.userId?.roll_no || '',
        game: cert.game || 'Sports Tournament',
        matchDetails: cert.matchDetails || cert.achievement || 'Match Victory',
        tournamentName: cert.tournamentName || cert.title || cert.tournamentId?.name || 'Campus Sports Championship',
        department: cert.department || cert.userId?.department || '',
        issueDate: cert.issueDate || cert.createdAt,
        verificationHash: cert.verificationHash,
        issuedByName: cert.issuedByName,
        issuedByRole: cert.issuedByRole
      }, filePath);

      cert.pdfUrl = `/uploads/certificates/${fileName}`;
      await cert.save();
    }

    const studentName = (cert.recipientName || cert.userId?.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
    const gameName = (cert.game || 'Victory').replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate_${gameName}_${studentName}.pdf"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete certificate
// @route   DELETE /api/certificates/:id
// @access  Private (Admin)
export const deleteCertificate = async (req, res) => {
  try {
    const cert = await Certificate.findByIdAndDelete(req.params.id);
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Legacy generator
export const generateCertificates = async (req, res) => {
  return res.status(200).json({ message: 'Use bulk-issue endpoint' });
};
