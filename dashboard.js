const express = require('express');
const Job = require('models/Job');
const User = require('models/User');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Admin Dashboard Stats
router.get('/admin/stats', auth, authorize('admin'), async (req, res) => {
  try {
    const stats = {
      totalCandidates: await User.countDocuments({ role: 'candidate' }),
      totalEmployers: await User.countDocuments({ role: 'employer' }),
      activeJobs: await Job.countDocuments({ status: 'active' }),
      totalApplications: await Job.aggregate([
        { $unwind: '$applications' },
        { $group: { _id: null, count: { $sum: 1 } } }
      ])
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Candidate Dashboard
router.get('/candidate/stats', auth, authorize('candidate'), async (req, res) => {
  try {
    const userId = req.user._id;
    const applications = await Job.aggregate([
      { $unwind: '$applications' },
      { $match: { 'applications.candidateId': userId } }
    ]);
    
    res.json({
      appliedJobs: applications.length,
      interviews: applications.filter(a => a.applications.status === 'interview').length,
      rejections: applications.filter(a => a.applications.status === 'rejected').length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employer Dashboard
router.get('/employer/stats', auth, authorize('employer'), async (req, res) => {
  try {
    const userId = req.user._id;
    const jobs = await Job.find({ employerId: userId });
    
    const stats = {
      activeJobs: jobs.filter(j => j.status === 'active').length,
      totalApplications: jobs.reduce((sum, job) => sum + job.applications.length, 0),
      interviews: jobs.reduce((sum, job) => 
        sum + job.applications.filter(a => a.status === 'interview').length, 0),
      hired: jobs.reduce((sum, job) => 
        sum + job.applications.filter(a => a.status === 'hired').length, 0)
    };
    
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Employer Recent Applications
router.get('/employer/applications', auth, authorize('employer'), async (req, res) => {
  try {
    const userId = req.user._id;
    const applications = await Job.aggregate([
      { $match: { employerId: userId } },
      { $unwind: '$applications' },
      { $sort: { 'applications.appliedAt': -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: 'applications.candidateId',
          foreignField: '_id',
          as: 'candidate'
        }
      },
      { $unwind: { path: '$candidate', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          candidateName: '$candidate.name',
          candidateEmail: '$candidate.email',
          title: '$title',
          experience: '$candidate.profile.experience',
          status: '$applications.status',
          appliedAt: '$applications.appliedAt'
        }
      }
    ]);
    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
