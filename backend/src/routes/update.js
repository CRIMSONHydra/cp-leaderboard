const express = require('express');
const router = express.Router();
const {
  triggerUpdate,
  updateUser,
  getUpdateStatus
} = require('../controllers/updateController');
const { updateLimiter } = require('../middlewares/rateLimiter');

router.post('/trigger', triggerUpdate);
router.post('/user/:id', updateLimiter, updateUser);
router.get('/status', getUpdateStatus);

module.exports = router;
