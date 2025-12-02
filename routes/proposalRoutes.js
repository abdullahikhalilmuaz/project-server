// backend/routes/proposalRoutes.js
import express from 'express';
import Proposal from '../models/Proposal.js';

const router = express.Router();

// Submit a new proposal (with validation for exactly 3 topics)
router.post('/submit', async (req, res) => {
  try {
    const { user, selectedTopics, generatedProposal } = req.body;
    
    // Validate: Must have exactly 3 topics
    if (!selectedTopics || selectedTopics.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'A proposal must contain exactly 3 topics'
      });
    }

    // Validate each topic has required fields
    const invalidTopics = selectedTopics.filter(topic => 
      !topic.topicId || !topic.title || !topic.category || !topic.description
    );
    
    if (invalidTopics.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more topics are missing required fields'
      });
    }

    const newProposal = new Proposal({
      user,
      selectedTopics,
      generatedProposal,
      status: 'pending'
    });

    await newProposal.save();
    
    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully!',
      data: newProposal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error submitting proposal',
      error: error.message
    });
  }
});

// Get all proposals (for admin)
router.get('/admin/all', async (req, res) => {
  try {
    const proposals = await Proposal.find()
      .sort({ submissionDate: -1 })
      .select('-__v');
    
    res.json({
      success: true,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching proposals',
      error: error.message
    });
  }
});

// Get user's proposals
router.get('/user/:userId', async (req, res) => {
  try {
    const proposals = await Proposal.find({ 'user.userId': req.params.userId })
      .sort({ submissionDate: -1 });
    
    res.json({
      success: true,
      data: proposals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user proposals',
      error: error.message
    });
  }
});

// Update proposal status (admin)
router.put('/admin/update/:id', async (req, res) => {
  try {
    const { status, feedback, reviewedBy } = req.body;
    
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      {
        status,
        adminFeedback: {
          feedback,
          reviewedBy,
          reviewedAt: new Date()
        },
        lastUpdated: new Date()
      },
      { new: true }
    );

    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    res.json({
      success: true,
      message: 'Proposal updated successfully',
      data: proposal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating proposal',
      error: error.message
    });
  }
});

// Delete proposal
router.delete('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findByIdAndDelete(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }

    res.json({
      success: true,
      message: 'Proposal deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting proposal',
      error: error.message
    });
  }
});

export default router; // ES6 export