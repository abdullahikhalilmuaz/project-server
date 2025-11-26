import User from '../models/UserModel.js';

export const register = async (req, res) => {
  try {
    const { fullName, email, password, confirmPassword, role } = req.body;

    // Basic validation
    if (!fullName || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({
        success: false,
        message: 'Please fill in all required fields.'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'The passwords you entered do not match.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Your password must be at least 6 characters long.'
      });
    }


    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists.'
      });
    }

    // Create user
    const newUser = new User({
      fullName,
      email,
      password,
      role
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: 'Your account has been created successfully.',
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during registration.',
      error: error.message
    });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.'
      });
    }

    // Get user + password for comparison
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password.'
      });
    }

    // Validate password
    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect email or password.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'You have logged in successfully.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred during login.',
      error: error.message
    });
  }
};
