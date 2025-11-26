import mongoose from 'mongoose';

const projectTopicSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: {
      values: ['web', 'mobile', 'ai', 'data', 'iot', 'blockchain', 'cybersecurity'],
      message: 'Category must be one of: web, mobile, ai, data, iot, blockchain, cybersecurity'
    }
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty level is required'],
    enum: {
      values: ['beginner', 'intermediate', 'advanced'],
      message: 'Difficulty must be: beginner, intermediate, or advanced'
    }
  },
  duration: {
    type: String,
    required: [true, 'Duration is required'],
    trim: true
  },
  popularity: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  isTrending: {
    type: Boolean,
    default: false
  },
  technologies: [{
    type: String,
    trim: true
  }],
  resources: {
    type: Number,
    default: 0,
    min: 0
  },
  complexity: {
    type: Number,
    default: 1,
    min: 1,
    max: 10
  },
  image: {
    type: String,
    default: ''
  },
  learningObjectives: [{
    type: String,
    trim: true
  }],
  prerequisites: [{
    type: String,
    trim: true
  }],
  expectedOutcomes: [{
    type: String,
    trim: true
  }],
  isActive: {
    type: Boolean,
    default: true
  }
  // Removed createdBy field
}, {
  timestamps: true
});

// Index for better search performance
projectTopicSchema.index({ title: 'text', description: 'text' });
projectTopicSchema.index({ category: 1, difficulty: 1, isActive: 1 });

const ProjectTopic = mongoose.model('ProjectTopic', projectTopicSchema);

export default ProjectTopic;