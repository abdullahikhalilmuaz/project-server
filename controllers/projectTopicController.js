import ProjectTopic from '../models/ProjectTopic.js';
import mongoose from 'mongoose';

// Create new project topic
export const createProjectTopic = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      difficulty,
      duration,
      technologies,
      resources,
      complexity,
      image,
      learningObjectives,
      prerequisites,
      expectedOutcomes
    } = req.body;

    // Check if topic with same title already exists
    const existingTopic = await ProjectTopic.findOne({ 
      title: { $regex: new RegExp(`^${title}$`, 'i') } 
    });

    if (existingTopic) {
      return res.status(400).json({
        success: false,
        message: 'A project topic with this title already exists'
      });
    }

    const projectTopic = new ProjectTopic({
      title,
      description,
      category,
      difficulty,
      duration,
      technologies: technologies || [],
      resources: resources || 0,
      complexity: complexity || 1,
      image: image || '',
      learningObjectives: learningObjectives || [],
      prerequisites: prerequisites || [],
      expectedOutcomes: expectedOutcomes || [],
      // Removed createdBy field since we don't have authentication
    });

    await projectTopic.save();

    res.status(201).json({
      success: true,
      message: 'Project topic created successfully',
      data: projectTopic
    });

  } catch (error) {
    console.error('Create project topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating project topic',
      error: error.message
    });
  }
};

// Get all project topics (with filtering and pagination)
export const getProjectTopics = async (req, res) => {
  try {
    const {
      category,
      difficulty,
      search,
      sortBy = 'popularity',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      trending
    } = req.query;

    // Build filter object
    const filter = { isActive: true };
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (difficulty && difficulty !== 'all') {
      filter.difficulty = difficulty;
    }
    
    if (trending === 'true') {
      filter.isTrending = true;
    }

    // Text search
    if (search) {
      filter.$text = { $search: search };
    }

    // Sort options
    const sortOptions = {};
    switch (sortBy) {
      case 'popularity':
        sortOptions.popularity = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'duration':
        sortOptions.duration = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'complexity':
        sortOptions.complexity = sortOrder === 'asc' ? 1 : -1;
        break;
      case 'createdAt':
        sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;
        break;
      default:
        sortOptions.popularity = -1;
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Get topics with pagination
    const topics = await ProjectTopic.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .select('-__v'); // Removed populate since we don't have createdBy

    // Get total count for pagination
    const total = await ProjectTopic.countDocuments(filter);
    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: topics,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalTopics: total,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });

  } catch (error) {
    console.error('Get project topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project topics',
      error: error.message
    });
  }
};

// Get single project topic by ID
export const getProjectTopicById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project topic ID'
      });
    }

    const topic = await ProjectTopic.findById(id).select('-__v');

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Project topic not found'
      });
    }

    res.json({
      success: true,
      data: topic
    });

  } catch (error) {
    console.error('Get project topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching project topic',
      error: error.message
    });
  }
};

// Update project topic
export const updateProjectTopic = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project topic ID'
      });
    }

    // Check if title is being updated and if it already exists
    if (updateData.title) {
      const existingTopic = await ProjectTopic.findOne({
        title: { $regex: new RegExp(`^${updateData.title}$`, 'i') },
        _id: { $ne: id }
      });

      if (existingTopic) {
        return res.status(400).json({
          success: false,
          message: 'A project topic with this title already exists'
        });
      }
    }

    const updatedTopic = await ProjectTopic.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-__v');

    if (!updatedTopic) {
      return res.status(404).json({
        success: false,
        message: 'Project topic not found'
      });
    }

    res.json({
      success: true,
      message: 'Project topic updated successfully',
      data: updatedTopic
    });

  } catch (error) {
    console.error('Update project topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating project topic',
      error: error.message
    });
  }
};

// Delete project topic (soft delete)
export const deleteProjectTopic = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project topic ID'
      });
    }

    const topic = await ProjectTopic.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: 'Project topic not found'
      });
    }

    res.json({
      success: true,
      message: 'Project topic deleted successfully'
    });

  } catch (error) {
    console.error('Delete project topic error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting project topic',
      error: error.message
    });
  }
};

// Get topics by category
export const getTopicsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    
    const topics = await ProjectTopic.find({ 
      category, 
      isActive: true 
    })
    .sort({ popularity: -1 })
    .select('title description difficulty duration popularity image')
    .limit(20);

    res.json({
      success: true,
      data: topics
    });

  } catch (error) {
    console.error('Get topics by category error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching topics by category',
      error: error.message
    });
  }
};

// Get trending topics
export const getTrendingTopics = async (req, res) => {
  try {
    const topics = await ProjectTopic.find({ 
      isTrending: true, 
      isActive: true 
    })
    .sort({ popularity: -1 })
    .limit(10)
    .select('title description category difficulty popularity image isTrending');

    res.json({
      success: true,
      data: topics
    });

  } catch (error) {
    console.error('Get trending topics error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching trending topics',
      error: error.message
    });
  }
};