const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/auth');
const customerservice = require('../controllers/customerservice');
router.post('/post', verifyAccessToken, customerservice.imageupload); //게시글 작성 - 일반 사용자
router.get('/readGeneral', verifyAccessToken, customerservice.readGeneral); //게시글 조회 - 일반 사용자
router.get('/readManager', verifyAccessToken, customerservice.readManager); //게시글 조회 - 관리자
router.post('/responsePost',verifyAccessToken, customerservice.responsePost); //답변 작성 - 관리자
module.exports = router;