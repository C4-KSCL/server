const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/auth');
const deleteuser = require('../controllers/delete');
// 회원정보 삭제 처리 라우트
router.delete('/user',verifyAccessToken, deleteuser.deleteuser);
module.exports = router;