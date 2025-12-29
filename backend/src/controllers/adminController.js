import AdminCredential from '../models/AdminCredential.js';

const createCredential = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !username.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Username is required'
      });
    }

    if (!password || !password.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }

    // Check if username already exists
    const existingCred = await AdminCredential.findOne({ username: username.trim() });
    if (existingCred) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }

    // Create credential
    const credential = await AdminCredential.create({
      username: username.trim(),
      password: password.trim()
    });

    res.status(201).json({
      success: true,
      data: {
        username: credential.username,
        createdAt: credential.createdAt
      }
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        error: 'Username already exists'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const verifyAuth = async (req, res) => {
  // If middleware passed, credentials are valid
  res.json({
    success: true,
    message: 'Authentication verified',
    username: req.user.username
  });
};

export { createCredential, verifyAuth };

