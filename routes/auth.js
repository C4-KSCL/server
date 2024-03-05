const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');

// 로그인 처리 라우트
router.post('/login', authController.login);
router.post('/findpw', authController.findpw);
router.post('/setpw', authController.setpw);
module.exports = router;