const express = require('express');
const router = express.Router();
const findfriendController = require('../controllers/findfriend');
const { verifyAccessToken } = require('../middleware/auth');
router.get('/friend-matching', verifyAccessToken, findfriendController.friendMatching);
router.post('/setting', verifyAccessToken, findfriendController.setting);
module.exports = router;