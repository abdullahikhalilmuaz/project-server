// routes/proposalRoutes.js
import express from 'express';
import Proposal from '../models/Proposal.js';

const router = express.Router();

// ✅ HEALTH CHECK
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Proposals API is running',
    timestamp: new Date().toISOString()
  });
});

// ✅ GET ALL PROPOSALS (for admin)
router.get('/admin/all', async (req, res) => {
  try {
    console.log('Fetching all proposals...');
    const proposals = await Proposal.find()
      .sort({ submissionDate: -1 })
      .lean(); // Convert to plain JS objects
    
    console.log(`Found ${proposals.length} proposals`);
    
    res.json({
      success: true,
      count: proposals.length,
      data: proposals
    });
  } catch (error) {
    console.error('Error fetching proposals:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching proposals',
      error: error.message
    });
  }
});

// ✅ SUBMIT NEW PROPOSAL
router.post('/submit', async (req, res) => {
  try {
    console.log('Received proposal submission request');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { user, selectedTopics, generatedProposal } = req.body;
    
    // Validate required fields
    if (!user || !selectedTopics || !generatedProposal) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: user, selectedTopics, or generatedProposal'
      });
    }
    
    // Validate exactly 3 topics
    if (!Array.isArray(selectedTopics) || selectedTopics.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'A proposal must contain exactly 3 topics',
        received: selectedTopics.length
      });
    }
    
    // Validate user object
    if (!user.name || !user.email) {
      return res.status(400).json({
        success: false,
        message: 'User must have name and email'
      });
    }
    
    // Validate generatedProposal object
    if (!generatedProposal.title || !generatedProposal.description) {
      return res.status(400).json({
        success: false,
        message: 'Generated proposal must have title and description'
      });
    }
    
    // Create new proposal
    const newProposal = new Proposal({
      user: {
        userId: user.userId || `user_${Date.now()}`,
        name: user.name,
        email: user.email,
        studentId: user.studentId || '',
        department: user.department || '',
        semester: user.semester || ''
      },
      selectedTopics: selectedTopics.map(topic => ({
        topicId: topic.topicId || topic._id || `topic_${Date.now()}`,
        title: topic.title || 'Untitled Topic',
        category: topic.category || 'general',
        difficulty: topic.difficulty || 'beginner',
        description: topic.description || '',
        technologies: topic.technologies || [],
        duration: topic.duration || '4 weeks',
        complexity: topic.complexity || 5,
        popularity: topic.popularity || 50,
        image: topic.image || ''
      })),
      generatedProposal: {
        title: generatedProposal.title,
        description: generatedProposal.description,
        objectives: generatedProposal.objectives || ['Objective 1', 'Objective 2'],
        scope: generatedProposal.scope || 'Project scope not specified',
        methodology: generatedProposal.methodology || 'Agile methodology',
        expectedOutcomes: generatedProposal.expectedOutcomes || ['Working application'],
        timeline: generatedProposal.timeline || '12-14 weeks',
        resourcesNeeded: generatedProposal.resourcesNeeded || ['Development team', 'Cloud services'],
        budgetEstimate: generatedProposal.budgetEstimate || '$15,000 - $20,000'
      },
      status: 'pending'
    });
    
    // Save to database
    const savedProposal = await newProposal.save();
    console.log('Proposal saved successfully:', savedProposal._id);
    
    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully!',
      data: savedProposal
    });
    
  } catch (error) {
    console.error('Error submitting proposal:', error);
    res.status(500).json({
      success: false,
      message: 'Error submitting proposal',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ GET PROPOSAL BY ID
router.get('/:id', async (req, res) => {
  try {
    const proposal = await Proposal.findById(req.params.id);
    
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Proposal not found'
      });
    }
    
    res.json({
      success: true,
      data: proposal
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching proposal',
      error: error.message
    });
  }
});

// ✅ GET USER'S PROPOSALS
router.get('/user/:userId', async (req, res) => {
  try {
    const proposals = await Proposal.find({ 'user.userId': req.params.userId })
      .sort({ submissionDate: -1 });
    
    res.json({
      success: true,
      count: proposals.length,
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

// ✅ UPDATE PROPOSAL STATUS (Admin)
router.put('/admin/update/:id', async (req, res) => {
  try {
    const { status, feedback, reviewedBy } = req.body;
    
    // Validate status
    const validStatuses = ['pending', 'reviewed', 'approved', 'rejected', 'in-progress', 'completed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }
    
    const updateData = {
      lastUpdated: new Date()
    };
    
    if (status) updateData.status = status;
    
    if (feedback || reviewedBy) {
      updateData.adminFeedback = {
        feedback: feedback || '',
        reviewedBy: reviewedBy || 'Admin',
        reviewedAt: new Date()
      };
    }
    
    const proposal = await Proposal.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
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

// ✅ DELETE PROPOSAL
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

// ✅ CREATE SAMPLE PROPOSALS (for testing)
router.post('/sample', async (req, res) => {
  try {
    const sampleProposals = [
      {
        user: {
          userId: 'user_12345',
          name: 'John Doe',
          email: 'john@example.com',
          studentId: 'STU001',
          department: 'Computer Science',
          semester: '8th'
        },
        selectedTopics: [
          {
            topicId: 'topic_1',
            title: 'E-commerce Platform',
            category: 'web',
            difficulty: 'intermediate',
            description: 'Build a full-stack e-commerce platform with React and Node.js',
            technologies: ['React', 'Node.js', 'MongoDB', 'Express'],
            duration: '8 weeks',
            complexity: 7,
            popularity: 85
          },
          {
            topicId: 'topic_2',
            title: 'Mobile Banking App',
            category: 'mobile',
            difficulty: 'advanced',
            description: 'Secure mobile banking application with biometric authentication',
            technologies: ['React Native', 'Firebase', 'Node.js', 'MongoDB'],
            duration: '10 weeks',
            complexity: 9,
            popularity: 90
          },
          {
            topicId: 'topic_3',
            title: 'AI Chatbot',
            category: 'ai',
            difficulty: 'intermediate',
            description: 'Intelligent chatbot using NLP for customer service',
            technologies: ['Python', 'TensorFlow', 'FastAPI', 'React'],
            duration: '6 weeks',
            complexity: 8,
            popularity: 88
          }
        ],
        generatedProposal: {
          title: 'John Doe\'s Web + Mobile + AI Project Proposal',
          description: 'A comprehensive project combining e-commerce, mobile banking, and AI chatbot technologies to create an innovative financial solution.',
          objectives: [
            'Develop a secure mobile banking application',
            'Implement AI-powered customer support chatbot',
            'Create an e-commerce platform for financial products',
            'Ensure data security and privacy compliance'
          ],
          scope: 'Integration of mobile banking, e-commerce, and AI chatbot systems',
          methodology: 'Agile development with 2-week sprints',
          expectedOutcomes: [
            'Fully functional mobile banking app',
            'AI chatbot for customer support',
            'E-commerce platform integration',
            'Complete documentation and testing'
          ],
          timeline: '12-14 weeks',
          resourcesNeeded: [
            'Development team (4 members)',
            'Cloud hosting (AWS/Azure)',
            'AI/ML training resources',
            'Security audit tools'
          ],
          budgetEstimate: '$18,000 - $25,000'
        },
        status: 'pending'
      },
      {
        user: {
          userId: 'user_67890',
          name: 'Jane Smith',
          email: 'jane@example.com',
          studentId: 'STU002',
          department: 'Software Engineering',
          semester: '7th'
        },
        selectedTopics: [
          {
            topicId: 'topic_4',
            title: 'IoT Home Automation',
            category: 'iot',
            difficulty: 'intermediate',
            description: 'Smart home automation system using IoT devices',
            technologies: ['Arduino', 'Raspberry Pi', 'Python', 'React Native'],
            duration: '9 weeks',
            complexity: 7,
            popularity: 82
          },
          {
            topicId: 'topic_5',
            title: 'Blockchain Voting System',
            category: 'blockchain',
            difficulty: 'advanced',
            description: 'Secure voting system using blockchain technology',
            technologies: ['Solidity', 'Ethereum', 'Web3.js', 'React'],
            duration: '12 weeks',
            complexity: 9,
            popularity: 92
          },
          {
            topicId: 'topic_6',
            title: 'Cybersecurity Dashboard',
            category: 'cybersecurity',
            difficulty: 'advanced',
            description: 'Real-time cybersecurity threat monitoring dashboard',
            technologies: ['Python', 'Django', 'React', 'Docker'],
            duration: '10 weeks',
            complexity: 8,
            popularity: 87
          }
        ],
        generatedProposal: {
          title: 'Jane Smith\'s IoT + Blockchain + Cybersecurity Project',
          description: 'An integrated security system combining IoT sensors, blockchain verification, and cybersecurity monitoring.',
          objectives: [
            'Develop IoT-based home automation system',
            'Implement blockchain-based secure voting',
            'Create real-time cybersecurity dashboard',
            'Ensure system integrity and security'
          ],
          scope: 'IoT device integration with blockchain security layer and monitoring dashboard',
          methodology: 'Waterfall methodology with security-first approach',
          expectedOutcomes: [
            'Working IoT home automation system',
            'Blockchain voting prototype',
            'Cybersecurity monitoring dashboard',
            'Security audit report'
          ],
          timeline: '14-16 weeks',
          resourcesNeeded: [
            'IoT devices and sensors',
            'Blockchain development tools',
            'Security testing tools',
            'Cloud infrastructure'
          ],
          budgetEstimate: '$22,000 - $30,000'
        },
        status: 'approved'
      }
    ];
    
    // Insert sample proposals
    const createdProposals = await Proposal.insertMany(sampleProposals);
    
    res.status(201).json({
      success: true,
      message: `${createdProposals.length} sample proposals created`,
      data: createdProposals
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating sample proposals',
      error: error.message
    });
  }
});

// ✅ DELETE ALL PROPOSALS (for testing)
router.delete('/admin/clear', async (req, res) => {
  try {
    const result = await Proposal.deleteMany({});
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} proposals`,
      data: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error clearing proposals',
      error: error.message
    });
  }
});

export default router;