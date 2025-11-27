const express = require('express');
const Job = require('models/Job');
const User = require('models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin Dashboard Stats
router.get('/admin/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const [totalCandidates, totalEmployers, activeJobs] = await Promise.all([
      User.countDocuments({ role: 'candidate' }),
      User.countDocuments({ role: 'employer' }),
      Job.countDocuments({ status: 'active' })
    ]);

    const stats = {
      totalCandidates,
      totalEmployers,
      activeJobs,
      totalApplications: await Job.aggregate([
        { $unwind: '$applications' },
        { $group: { _id: null, count: { $sum: 1 } } }
      ])
    };
    
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Admin stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Candidate Dashboard Stats
router.get('/candidate/stats', auth, authorize('candidate'), async (req, res) => {
  try {
    const userId = req.user._id;
    const applications = await Job.aggregate([
      { $unwind: '$applications' },
      { $match: { 'applications.candidateId': userId } },
      { $group: {
        _id: '$applications.status',
        count: { $sum: 1 }
      }}
    ]);

    const statsMap = applications.reduce((acc, app) => {
      acc[app._id] = app.count;
      return acc;
    }, { appliedJobs: 0, interviews: 0, rejections: 0 });

    res.json({ 
      success: true, 
      data: statsMap 
    });
  } catch (error) {
    console.error('Candidate stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

// Employer Dashboard Stats
router.get('/employer/stats', auth, authorize('employer'), async (req, res) => {
  try {
    const userId = req.user._id;
    const jobs = await Job.find({ employerId: userId }).lean();

    const stats = jobs.reduce((acc, job) => {
      acc.activeJobs += job.status === 'active' ? 1 : 0;
      acc.totalApplications += job.applications.length;
      job.applications.forEach(app => {
        if (app.status === 'interview') acc.interviews++;
        if (app.status === 'hired') acc.hired++;
      });
      return acc;
    }, { activeJobs: 0, totalApplications: 0, interviews: 0, hired: 0 });

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Employer stats error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

module.exports = router;
