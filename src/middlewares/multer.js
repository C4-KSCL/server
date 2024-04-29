import multer from "multer";
const multer_s3 = require('multer-s3');

const aws = require('aws-sdk');

import database from "../database";

const s3 = new aws.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const storage = multer_s3({
    s3: s3,
    bucket: process.env.S3_BUCKET_NAME, // 자신의 s3 버킷 이름
    contentType: multer_s3.AUTO_CONTENT_TYPE,
    acl: 'public-read', // 버킷에서 acl 관련 설정을 풀어줘야 사용할 수 있다.
    metadata: function (req, file, cb) {
        cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
        cb(null, 'eventImage/' + Date.now().toString() + '-' + file.originalname);
    }
})

export const upload = multer({
    storage: storage // storage를 multer_s3 객체로 지정
})


export const imageDelete = async (req, res, next) => {
    const { id } = req.params;

    const image = await database.eventImage.findUnique({
        where: {
            id: Number(id),
        }
    });

    const s3Params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: image.filekey,
    }

    s3.deleteObject(s3Params, async (err, data) => {
        console.log('Deleted image from S3:', data); // 추가
        if (err) {
            return res.status(500).send('이미지 삭제에 실패했습니다.');
        }
        await database.eventImage.delete({
            where: {
                id: image.id,
            }
        });
    });

    res.status(203).json({});
}
