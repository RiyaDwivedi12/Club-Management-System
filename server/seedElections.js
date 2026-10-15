import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Election from './models/Election.js';
import Club from './models/Club.js';
import User from './models/User.js';

const seedElections = async () => {
  try {
    dotenv.config();
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/club-management');
    console.log('Connected to DB for seeding elections');

    // Clear existing elections
    await Election.deleteMany({});
    console.log('Cleared existing elections');

    // Get some users to be candidates
    let users = await User.find({ role: 'student' }).limit(3);
    
    // If no students, create some
    if (users.length < 3) {
       for (let i = 1; i <= 3; i++) {
         const newUser = await User.create({
           name: `Candidate ${i}`,
           username: `candidate${i}_${Date.now()}`,
           email: `candidate${i}@example.com`,
           password: 'password123',
           role: 'student',
           isVerified: true,
           year: 1,
           department: 'Computer Science',
           roll_no: `1000${i}`
         });
         users.push(newUser);
       }
       console.log('Created dummy candidates');
    }

    // Get a club
    let club = await Club.findOne({});
    if (!club) {
        // Create a dummy club
        club = await Club.create({
            name: 'Dummy Club',
            category: 'Sports',
            description: 'A dummy club for testing elections',
            presidentId: users[0]._id, // using first user as temp president
            facultyId: users[0]._id
        });
        console.log('Created dummy club');
    }

    // Create an election
    const election = await Election.create({
      title: 'Presidential Election 2026',
      clubId: club._id,
      position: 'President',
      startDate: new Date(),
      endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      candidates: [
        {
          candidateId: users[0]._id,
          manifesto: 'I will make this club great again! Vote for me for better events and more funding.',
          votes: 5
        },
        {
          candidateId: users[1]._id,
          manifesto: 'Experience matters. I have been in this club for 3 years.',
          votes: 3
        },
        {
          candidateId: users[2]._id,
          manifesto: 'New vision, new ideas. Let\'s innovate together!',
          votes: 8
        }
      ]
    });

    console.log('Dummy election created successfully!');
    console.log(election);
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding elections:', error);
    process.exit(1);
  }
};

seedElections();
