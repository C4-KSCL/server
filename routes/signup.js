const express = require('express');
const router = express.Router();
const signupController = require('../controllers/signup');
const profilemiddleware = require('../middleware/profileupload');
const imagemiddleware = require('../middleware/imageupload');
const { RestoreObjectRequestFilterSensitiveLog } = require('@aws-sdk/client-s3');
// 회원등록 처리 라우트
router.post('/register', signupController.register);
router.post('/profile', profilemiddleware.profileupload);
router.post('/image',  imagemiddleware.imageupload);
// 이메일 인증 처리 라우트
router.post('/emailauth', signupController.emailauth);
// 닉네임 중복 체크 처리 라우트
router.post('/checknickname', signupController.checknickname);
module.exports = router;