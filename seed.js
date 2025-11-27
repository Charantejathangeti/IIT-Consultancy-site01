const mongoose = require('mongoose');
const User = require('models/User');
const Job = require('models/Job');

mongoose.connect('mongodb://localhost:27017/iitconsultancy');

const seedData = async () => {
  try {
    await User.deleteMany({});
    await Job.deleteMany({});

    // Sample Users
    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@iit.com',
      password: 'admin123',
      role: 'admin'
    });

    const employer = await User.create({
      name: 'TechNova HR',
      email: 'hr@technova.com',
      password: 'employer123',
      role: 'employer',
      company: 'TechNova Solutions'
    });

    const candidate1 = await User.create({
      name: 'Anjali Patel',
      email: 'anjali@email.com',
      password: 'candidate123',
      role: 'candidate',
      profile: { experience: 6, skills: ['Python', 'ML'], rating: 4.8 }
    });

    const candidate2 = await User.create({
      name: 'Ravi Sankar',
      email: 'ravi@email.com',
      password: 'candidate123',
      role: 'candidate',
      profile: { experience: 4, skills: ['React', 'Node.js'], rating: 4.5 }
    });

    console.log('✅ Sample data seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedData();
