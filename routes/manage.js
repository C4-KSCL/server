const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/auth');
const manage = require('../controllers/manage');
router.post('/suspend', verifyAccessToken, manage.suspend); //회원 정지 
router.post('/removeSuspend', verifyAccessToken, manage.removeSuspend); //회원 정지 해제
router.get('/search', verifyAccessToken, manage.search); //회원 검색
module.exports = router;