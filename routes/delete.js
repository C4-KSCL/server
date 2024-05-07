const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/auth');
const deleteUser = require('../controllers/deleteUser');
// 회원정보 삭제 처리 라우트
//router.delete('/user',verifyAccessToken, deleteuser.deleteuser);
router.delete('/user',verifyAccessToken, deleteUser.deleteUserAndImages);
module.exports = router;