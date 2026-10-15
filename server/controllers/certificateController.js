import Certificate from '../models/Certificate.js';
import Tournament from '../models/Tournament.js';
import User from '../models/User.js';
import Team from '../models/Team.js';
import crypto from 'crypto';
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to generate elegant PDF Certificate matching uploaded design
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
    doc.strokeColor('#E2E8F0').lineWidth(3);
    doc.arc(cx - 145, cy, 135, -Math.PI / 2.3, Math.PI / 2.3).stroke();
    doc.arc(cx + 145, cy, 135, Math.PI - Math.PI / 2.3, Math.PI + Math.PI / 2.3).stroke();
    doc.fillColor('#E2E8F0');
    for (let angle = -1.2; angle <= 1.2; angle += 0.35) {
      const lx = cx - 145 + Math.cos(angle) * 135;
      const ly = cy + Math.sin(angle) * 135;
      doc.circle(lx - 9, ly, 6.5).fill();
      doc.circle(lx + 7, ly - 4, 5.5).fill();
      
      const rx = cx + 145 - Math.cos(angle) * 135;
      const ry = cy + Math.sin(angle) * 135;
      doc.circle(rx + 9, ry, 6.5).fill();
      doc.circle(rx - 7, ry - 4, 5.5).fill();
    }
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
       .text('CRESTMORE ELITE SPORTS ASSOCIATION', 0, 72, {
         width: contentW,
         align: 'center',
         characterSpacing: 2
       });

    // 6. CERTIFICATE Main Title
    doc.font('Times-Bold')
       .fontSize(44)
       .fillColor('#1B365D')
       .text('CERTIFICATE', 0, 102, {
         width: contentW,
         align: 'center',
         characterSpacing: 3
       });

    // 7. OF PROFESSIONAL ATHLETIC MERIT
    doc.font('Times-Roman')
       .fontSize(15)
       .fillColor('#334E68')
       .text('OF PROFESSIONAL ATHLETIC MERIT', 0, 155, {
         width: contentW,
         align: 'center',
         characterSpacing: 3.5
       });

    // 8. Presentation Tag
    doc.font('Helvetica')
       .fontSize(9.5)
       .fillColor('#64748B')
       .text('THIS CERTIFICATE IS AWARDED TO', 0, 198, {
         width: contentW,
         align: 'center',
         characterSpacing: 1.5
       });

    // 9. Recipient Name
    doc.font('Times-BoldItalic')
       .fontSize(34)
       .fillColor('#0F172A')
       .text(certData.userName || 'Student Athlete', 0, 218, {
         width: contentW,
         align: 'center'
       });

    // Sub-details: Roll Number & Course / Department
    const studentMetaParts = [
      certData.roll_no ? `ROLL NO: ${certData.roll_no}` : '',
      certData.department ? `COURSE: ${certData.department}${certData.year ? ` (YR ${certData.year})` : ''}` : '',
      certData.teamName ? `TEAM: ${certData.teamName}` : ''
    ].filter(Boolean);

    const studentMeta = studentMetaParts.join('   •   ');

    if (studentMeta) {
      doc.font('Helvetica-Bold')
         .fontSize(9.5)
         .fillColor('#475569')
         .text(studentMeta.toUpperCase(), 0, 258, {
           width: contentW,
           align: 'center',
           characterSpacing: 1
         });
    }

    // 10. Citation Text
    const honorTitle = certData.type === 'winner' ? 'A VALUED CHAMPION' :
                       certData.type === 'runner-up' ? 'A DISTINGUISHED RUNNER-UP' :
                       certData.type === 'third-place' ? 'A THIRD PLACE HONOREE' : 'A VALUED PLAYER';

    const tourneyTitle = (certData.tournamentName || 'CAMPUS SPORTS LEAGUE').toUpperCase();
    const citation = `IN RECOGNITION OF OUTSTANDING DEDICATION, CONSISTENT PERFORMANCE, AND\nPROFESSIONALISM AS ${honorTitle} IN THE ${tourneyTitle}.`;

    doc.font('Helvetica')
       .fontSize(9)
       .fillColor('#334155')
       .text(citation, 70, studentMeta ? 282 : 272, {
         width: contentW - 140,
         align: 'center',
         lineGap: 4
       });

    // Presentation Date
    const issueDateObj = new Date(certData.issueDate || Date.now());
    const day = issueDateObj.getDate();
    const month = issueDateObj.toLocaleString('en-US', { month: 'long' }).toUpperCase();
    const year = issueDateObj.getFullYear();
    const ordinal = day === 1 || day === 21 || day === 31 ? 'ST' :
                    day === 2 || day === 22 ? 'ND' :
                    day === 3 || day === 23 ? 'RD' : 'TH';

    doc.font('Helvetica')
       .fontSize(8.5)
       .fillColor('#475569')
       .text(`PRESENTED ON THIS ${day}${ordinal} DAY OF ${month}, ${year}.`, 0, 335, {
         width: contentW,
         align: 'center',
         characterSpacing: 1
       });

    // 11. Bottom Left: Golden Embossed Seal / Wax Medallion
    const sealX = 115;
    const sealY = 445;
    doc.save();
    doc.fillColor('#D4AF37');
    const points = 24;
    const outerR = 36;
    const innerR = 31;
    doc.moveTo(sealX + outerR, sealY);
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points;
      doc.lineTo(sealX + Math.cos(angle) * radius, sealY + Math.sin(angle) * radius);
    }
    doc.closePath().fill();

    doc.fillColor('#EAB308').circle(sealX, sealY, 26).fill();
    doc.strokeColor('#B45309').lineWidth(1.4).circle(sealX, sealY, 22).stroke();
    doc.strokeColor('#CA8A04').lineWidth(0.8).circle(sealX, sealY, 19).stroke();
    doc.font('Helvetica-Bold').fontSize(6).fillColor('#78350F').text('OFFICIAL', sealX - 15, sealY - 7, { width: 30, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(5.5).fillColor('#78350F').text('MERIT', sealX - 15, sealY + 1, { width: 30, align: 'center' });
    doc.restore();

    // 12. Bottom Center: Commissioner / Authority Signatory
    const signY = 450;
    const signerName = certData.issuedByName || 'Kenneth Dorsen';
    const signerRole = certData.issuedByRole || 'League Commissioner';
    const signerTitle = certData.signatoryTitle || `${signerRole.toUpperCase()}, CRESTMORE ATHLETIC FEDERATION`;

    doc.font('Times-Italic').fontSize(18).fillColor('#1E293B').text(signerName, 0, signY - 14, {
      width: contentW,
      align: 'center'
    });
    doc.strokeColor('#94A3B8').lineWidth(1).moveTo(cx - 90, signY + 10).lineTo(cx + 90, signY + 10).stroke();

    doc.font('Times-Bold')
       .fontSize(11)
       .fillColor('#0F172A')
       .text(signerName.toUpperCase(), 0, signY + 14, {
         width: contentW,
         align: 'center',
         characterSpacing: 1.5
       });

    doc.font('Helvetica')
       .fontSize(7.5)
       .fillColor('#64748B')
       .text(signerTitle, 0, signY + 28, {
         width: contentW,
         align: 'center',
         characterSpacing: 0.5
       });

    doc.font('Courier')
       .fontSize(7)
       .fillColor('#94A3B8')
       .text(`AUTHENTICITY CODE: ${certData.verificationHash || 'VERIFIED-CREDENTIAL'}`, 0, signY + 42, {
         width: contentW,
         align: 'center'
       });

    // 13. Bottom Right: Golden Trophy Cup
    const trophyX = contentW - 120;
    const trophyY = 450;
    doc.save();
    // Marble/Black pedestal
    doc.fillColor('#1E293B').rect(trophyX - 18, trophyY + 22, 36, 12).fill();
    doc.fillColor('#0F172A').rect(trophyX - 14, trophyY + 18, 28, 4).fill();
    // Gold stem
    doc.fillColor('#D4AF37').rect(trophyX - 4, trophyY + 8, 8, 10).fill();
    // Gold cup body
    doc.fillColor('#F59E0B');
    doc.moveTo(trophyX - 16, trophyY - 16)
       .lineTo(trophyX + 16, trophyY - 16)
       .lineTo(trophyX + 10, trophyY + 8)
       .lineTo(trophyX - 10, trophyY + 8)
       .closePath().fill();
    // Handles
    doc.strokeColor('#D4AF37').lineWidth(2.5);
    doc.moveTo(trophyX - 15, trophyY - 12)
       .bezierCurveTo(trophyX - 25, trophyY - 10, trophyX - 25, trophyY + 2, trophyX - 11, trophyY + 4)
       .stroke();
    doc.moveTo(trophyX + 15, trophyY - 12)
       .bezierCurveTo(trophyX + 25, trophyY - 10, trophyX + 25, trophyY + 2, trophyX + 11, trophyY + 4)
       .stroke();
    // Star on cup
    doc.fillColor('#FFFFFF').fontSize(8).text('★', trophyX - 4, trophyY - 8);
    doc.restore();

    doc.end();

    writeStream.on('finish', resolve);
    writeStream.on('error', reject);
  });
};

// @desc    Issue / generate certificates for tournament, match, or class event
// @route   POST /api/certificates/generate
// @access  Private (Admin/Faculty/President)
export const generateCertificates = async (req, res) => {
  try {
    const { 
      tournamentId, 
      title, 
      eventName, 
      teamName, 
      type, 
      certificates, 
      studentIds, 
      issuedByRole, 
      issuedByName 
    } = req.body;

    let resolvedTitle = title || eventName;
    let tourneyObj = null;

    if (tournamentId) {
      tourneyObj = await Tournament.findById(tournamentId).populate('clubId');
      if (tourneyObj && !resolvedTitle) {
        resolvedTitle = tourneyObj.name;
      }
    }

    if (!resolvedTitle) {
      resolvedTitle = teamName ? `${teamName} Sports Championship` : 'Competitive Sports Championship';
    }

    const uploadDir = path.join(__dirname, '../uploads/certificates');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Build the list of items to issue (supports individual objects or array of ticked student IDs)
    let itemsToProcess = [];

    if (Array.isArray(certificates) && certificates.length > 0) {
      itemsToProcess = certificates;
    } else if (Array.isArray(studentIds) && studentIds.length > 0) {
      itemsToProcess = studentIds.map(sId => ({
        userId: sId,
        teamName: teamName || '',
        type: type || 'winner'
      }));
    }

    if (itemsToProcess.length === 0) {
      return res.status(400).json({ message: 'Please select at least one student recipient to generate certificates' });
    }

    const Notification = (await import('../models/Notification.js')).default;
    const generated = [];

    const certRole = issuedByRole || req.user.role || 'Admin';
    const certSigner = issuedByName || req.user.name || 'Authorized Official';
    const roleDisplay = certRole === 'faculty' ? 'Faculty Coordinator' 
      : certRole === 'president' ? 'Club President' 
      : certRole === 'vice-president' ? 'Club Vice-President' 
      : 'Platform Administrator';

    for (const item of itemsToProcess) {
      const user = await User.findById(item.userId);
      if (!user) continue;

      const verificationHash = crypto.randomBytes(8).toString('hex').toUpperCase();
      const fileName = `cert-${user._id}-${Date.now()}-${Math.floor(Math.random() * 1000)}.pdf`;
      const filePath = path.join(uploadDir, fileName);
      const pdfUrl = `/uploads/certificates/${fileName}`;

      const itemType = item.type || type || 'winner';
      const itemTeam = item.teamName || teamName || '';

      await createCertificatePDF({
        userName: user.name,
        tournamentName: resolvedTitle,
        teamName: itemTeam,
        roll_no: user.roll_no || '',
        department: user.department || '',
        year: user.year || null,
        type: itemType,
        issueDate: new Date(),
        verificationHash,
        issuedByName: certSigner,
        issuedByRole: roleDisplay,
        signatoryTitle: `${roleDisplay.toUpperCase()}, CAMPUS SPORTS BOARD`
      }, filePath);

      const certDoc = await Certificate.create({
        userId: user._id,
        tournamentId: tourneyObj?._id || null,
        title: resolvedTitle,
        teamName: itemTeam,
        roll_no: user.roll_no || '',
        department: user.department || '',
        year: user.year || null,
        type: itemType,
        pdfUrl,
        verificationHash,
        issueDate: new Date(),
        issuedByRole: certRole,
        issuedByName: certSigner
      });

      // Send real-time notification to the student so they know their certificate is on their profile
      try {
        await Notification.create({
          user: user._id,
          message: `🏆 Congratulations! Your certificate for "${resolvedTitle}" (${itemType.toUpperCase()}) has been sanctioned by ${roleDisplay} ${certSigner} and is now ready on your Profile!`,
          type: 'general',
          link: '/profile'
        });
      } catch (notifErr) {
        console.error('Failed to create student notification:', notifErr);
      }

      generated.push(certDoc);
    }

    res.status(201).json({
      message: `Successfully generated and issued ${generated.length} certificates`,
      certificates: generated
    });
  } catch (error) {
    console.error('generateCertificates error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get certificates for logged in user
// @route   GET /api/certificates/my-certificates
// @access  Private
export const getMyCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({ userId: req.user._id })
      .populate('tournamentId', 'name wing clubId')
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
      .populate('userId', 'name email department year')
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

// @desc    Get all certificates (Admin/Faculty)
// @route   GET /api/certificates
// @access  Private (Admin/Faculty)
export const getAllCertificates = async (req, res) => {
  try {
    const certs = await Certificate.find({})
      .populate('userId', 'name email')
      .populate('tournamentId', 'name')
      .sort({ createdAt: -1 });
    res.json(certs);
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
      .populate('userId', 'name email')
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

    // If PDF file does not exist on disk, render it on demand
    if (!fs.existsSync(filePath)) {
      await createCertificatePDF({
        userName: cert.userId?.name || 'Student Athlete',
        tournamentName: cert.title || cert.tournamentId?.name || 'Competitive Sports League',
        teamName: cert.teamName || '',
        type: cert.type || 'participation',
        issueDate: cert.issueDate || cert.createdAt,
        verificationHash: cert.verificationHash,
        issuedByName: cert.issuedByName,
        issuedByRole: cert.issuedByRole
      }, filePath);

      cert.pdfUrl = `/uploads/certificates/${fileName}`;
      await cert.save();
    }

    const sanitizedName = (cert.userId?.name || 'Student').replace(/[^a-zA-Z0-9]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate-${sanitizedName}.pdf"`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ message: error.message });
  }
};
