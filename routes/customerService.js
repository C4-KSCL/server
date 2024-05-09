const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/auth');
router.post('/post', verifyAccessToken); //게시글 작성 - 일반 사용자
router.get('/readGeneral', verifyAccessToken); //게시글 조회 - 일반 사용자
router.get('/readManager', verifyAccessToken); //게시글 조회 - 관리자
router.post('/responsePost',verifyAccessToken); //답변 작성 - 관리자
module.exports = router;