const express = require('express');
const router = express.Router();
const { verifyAccessToken } = require('../middleware/auth');
const { imagedelete } = require('../middleware/imagedelete');
const { imageupload } = require('../middleware/imageupload');
const editController = require('../controllers/edit');
const profileupload = require('../middleware/profileupload');
const profiledelete = require('../middleware/profiledelete');
// 이미지 추가 처리 라우트
router.post('/addimage',verifyAccessToken, imageupload);
// 이미지 삭제 처리 라우트
router.post('/deleteimage',verifyAccessToken, imagedelete);
// 개인정보 수정 처리 라우트
router.post('/info',verifyAccessToken, editController.editInfo);
// 프로필 사진 추가 처리 라우트
router.post('/addprofile',verifyAccessToken, profileupload.profileupload);
// 프로필 사진 삭제 처리 라우트
router.post('/deleteprofile',verifyAccessToken, profiledelete.profiledelete);
module.exports = router;