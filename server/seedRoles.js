import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from './models/User.js';
import Club from './models/Club.js';

dotenv.config();

export const seedDefaultRoles = async () => {
  try {
    const rolesConfig = [
      {
        name: 'Admin Controller',
        username: 'admin',
        email: 'admin@campus.edu',
        password: 'admin123',
        role: 'admin',
        isVerified: true
      },
      {
        name: 'Riya Admin',
        username: 'riya_admin',
        email: 'dwivediriya185@gmail.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true
      },
      {
        name: 'Club President',
        username: 'president',
        email: 'president@campus.edu',
        password: 'admin123',
        role: 'president',
        department: 'Computer Science',
        year: 4,
        roll_no: 'PRES001',
        isVerified: true
      },
      {
        name: 'Vice President',
        username: 'vicepresident',
        email: 'vicepresident@campus.edu',
        password: 'admin123',
        role: 'vice_president',
        department: 'Information Technology',
        year: 3,
        roll_no: 'VP001',
        isVerified: true
      },
      {
        name: 'Dr. Faculty Coordinator',
        username: 'faculty',
        email: 'faculty@campus.edu',
        password: 'admin123',
        role: 'faculty',
        department: 'Sports & Cultural Affairs',
        year: 1,
        roll_no: 'FAC001',
        isVerified: true
      },
      {
        name: 'Official Referee',
        username: 'referee',
        email: 'referee@campus.edu',
        password: 'admin123',
        role: 'referee',
        department: 'Athletics Board',
        year: 1,
        roll_no: 'REF001',
        isVerified: true
      }
    ];

    for (const r of rolesConfig) {
      let existing = await User.findOne({ 
        $or: [{ email: r.email }, { username: r.username }] 
      });

      if (!existing) {
        await User.create(r);
        console.log(`[Seed] Created account for role: ${r.role} (${r.email})`);
      } else {
        // Ensure role is up to date, verified, and password is valid
        existing.role = r.role;
        existing.isVerified = true;
        existing.password = 'admin123';
        await existing.save();
      }
    }

    // Connect president and faculty to clubs if unassigned
    const presidentUser = await User.findOne({ role: 'president' });
    const vpUser = await User.findOne({ role: 'vice_president' });
    const facultyUser = await User.findOne({ role: 'faculty' });

    if (presidentUser && facultyUser) {
      const clubs = await Club.find();
      for (const club of clubs) {
        let changed = false;
        if (!club.presidentId) {
          club.presidentId = presidentUser._id;
          changed = true;
        }
        if (!club.facultyId) {
          club.facultyId = facultyUser._id;
          changed = true;
        }
        if (!club.vicePresidentId && vpUser) {
          club.vicePresidentId = vpUser._id;
          changed = true;
        }
        if (changed) {
          await club.save();
        }
      }
    }

    console.log('[Seed] Role accounts verified and ready.');
  } catch (error) {
    console.error('[Seed] Error seeding roles:', error.message);
  }
};
