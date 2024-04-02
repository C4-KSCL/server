const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');

exports.profileupload = (req, res) => {
    aws.config.update({
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });
    const s3 = new aws.S3();
    const uploadToS3 = multer({
        storage: multerS3({
            s3: s3,
            bucket: process.env.S3_BUCKET_NAME,
            acl: 'public-read',
            metadata: function (req, file, cb) {
                cb(null, { fieldName: file.fieldname });
            },
            key: function (req, file, cb) {
                cb(null, 'profile/' + Date.now().toString() + '-' + file.originalname);
            },
        }),
    }).array('files', 1);

    uploadToS3(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(501).send('이미지 업로드에 실패했습니다.');
        } else if (err) {
            console.error('Unknown Error:', err);
            return res.status(502).send('이미지 업로드에 실패했습니다.');
        }

        if (!req.files || req.files.length === 0) {
            return res.status(503).send('이미지 업로드에 실패했습니다.');
        }

        const imageKeys = req.files.map(file => file.key); // 이미지 키 확인
        const imagePaths = req.files.map(file => file.location); // 이미지 경로 확인

        Promise.all(imagePaths.map((imagePath, index) => {
            const email = req.body.email || req.headers.email;
            return new Promise((resolve, reject) => {
                const finduserQuery = 'UPDATE User SET userImage = ?, userImageKey = ? WHERE email = ?';
                req.mysqlConnection.query(finduserQuery, [imagePath, imageKeys[index], email], (error, results) => {
                    if (error) {
                        console.error('Error while finding member ID by email:', error);
                        reject('오류가 발생했습니다.');
                    }
                    if (results.length === 0) {
                        reject('해당 이메일로 등록된 회원이 없습니다.');
                        return;
                    }
                    resolve('이미지 저장이 완료되었습니다.');
                });
            });
        }))
        .then(successMessages => {
            const email = req.body.email || req.headers.email;
            const findInfoQuery = `SELECT * FROM User WHERE email = ?`;
            req.mysqlConnection.query(findInfoQuery, [email], (err, userResults) => {
                if (err) {
                    console.error('Error while querying:', err);
                    return res.status(500).send('서버 에러');
                }
                if (userResults.length === 0) {
                    return res.status(401).send('아이디 또는 비밀번호가 올바르지 않습니다.');
                }
                const userNumber = userResults[0].userNumber; // 첫 번째 결과값을 사용자 정보로 설정
                const findImageQuery = `SELECT * FROM UserImage WHERE userNumber = ?`;
                req.mysqlConnection.query(findImageQuery, [userNumber], (err, imageResults) => {
                    if (err) {
                        console.error('Error while querying:', err);
                        return res.status(500).send('서버 에러');
                    }
                    // Refresh Token을 클라이언트로 전송하고, Access Token을 JSON 응답에 포함하여 반환
                    return res.status(200).json({
                        user : userResults[0],
                        images : imageResults,
                        // 필요한 사용자 정보를 추가로 반환할 수 있음
                    });
                });
            });
        })
        .catch(errorMessage => {
            res.status(500).send(errorMessage);
        });
    });
};
