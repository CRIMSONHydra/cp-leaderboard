import AdminCredential from '../models/AdminCredential.js';

/**
 * Validate credential fields (shared between bootstrap and create).
 * Returns an error string if invalid, or null if valid.
 */
function validateCredentials(username, password) {
  if (!username || !username.trim()) return 'Username is required';
  if (!password || !password.trim()) return 'Password is required';
  const invalidChars = /[:]/;
  if (invalidChars.test(username)) return 'Username cannot contain colon (:) character';
  if (invalidChars.test(password)) return 'Password cannot contain colon (:) character';
  return null;
}

// Bootstrap first admin - only works when no admins exist and requires bootstrap secret
const bootstrapCredential = async (req, res) => {
  try {
    const bootstrapSecret = process.env.BOOTSTRAP_SECRET;
    if (!bootstrapSecret) {
      return res.status(403).json({
        success: false,
        error: 'Bootstrap not configured. Set BOOTSTRAP_SECRET environment variable.'
      });
    }

    const providedSecret = req.headers['x-bootstrap-secret'] || req.body.bootstrapSecret;
    if (!providedSecret || providedSecret !== bootstrapSecret) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or missing bootstrap secret'
      });
    }

    const count = await AdminCredential.countDocuments();
    if (count > 0) {
      return res.status(403).json({
        success: false,
        error: 'Bootstrap not allowed - admin credentials already exist. Use the authenticated endpoint instead.'
      });
    }

    const { username, password } = req.body;
    const validationError = validateCredentials(username, password);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const credential = await AdminCredential.create({
      username: username.trim(),
      password: password
    });

    res.status(201).json({
      success: true,
      data: { username: credential.username, createdAt: credential.createdAt }
    });
  } catch (error) {
    console.error('Bootstrap credential error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
};

const createCredential = async (req, res) => {
  try {
    const { username, password } = req.body;
    const validationError = validateCredentials(username, password);
    if (validationError) {
      return res.status(400).json({ success: false, error: validationError });
    }

    const existingCred = await AdminCredential.findOne({ username: username.trim() });
    if (existingCred) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    const credential = await AdminCredential.create({
      username: username.trim(),
      password: password
    });

    res.status(201).json({
      success: true,
      data: {
        username: credential.username,
        createdAt: credential.createdAt
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, error: 'Username already exists' });
    }

    console.error('Create credential error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
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

export { bootstrapCredential, createCredential, verifyAuth };

