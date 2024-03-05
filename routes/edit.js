const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/auth');
const { deleteImage } = require('../middleware/deleteimage');
const { imageupload } = require('../middleware/imageupload');
const editController = require('../controllers/edit');

// 이미지 삭제 처리 라우트
router.post('/deleteimage',verifyAccessToken, deleteImage);
// 이미지 추가 처리 라우트
router.post('/addimage',verifyAccessToken, imageupload);
// 개인정보 수정 처리 라우트
router.post('/info',verifyAccessToken, editController.editInfo);
module.exports = router;