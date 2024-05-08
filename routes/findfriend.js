const express = require('express');
const router = express.Router();
const findfriendController = require('../controllers/findfriend');
const { verifyAccessToken } = require('../middleware/auth');
const { check } = require('../middleware/matchingcheck');
router.get('/friend-matching', verifyAccessToken, check, findfriendController.friendMatching);
router.get('/getfriendinfo',verifyAccessToken, findfriendController.getfriendinfo)
router.post('/getimage', verifyAccessToken, findfriendController.getimage);
router.post('/settingMBTI', verifyAccessToken, findfriendController.settingMBTI);
router.post('/settingKeyword', verifyAccessToken, findfriendController.settingKeyword);
module.exports = router;