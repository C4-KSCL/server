const multer = require('multer');
const multerS3 = require('multer-s3');
const aws = require('aws-sdk');
const moment = require('moment-timezone');
// 중요한 포인트 text는 file을 처리한 후에 가공할 수 있다 -> 이미지를 먼저 업로드 후 db저장은 경로를 변수에 저장후 나중에 진행 방식으로 해결
exports.postupload = (req, res) => {
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
                cb(null, 'customerService/' + Date.now().toString() + '-' + file.originalname);
            },
        }),
    }).array('files', 5);
    uploadToS3(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            console.error('Multer Error:', err);
            return res.status(501).send('이미지 업로드에 실패했습니다.');
        } else if (err) {
            console.error('Unknown Error:', err);
            return res.status(502).send('이미지 업로드에 실패했습니다.');
        }
        const { postCategory, postTitle, postContent } = req.body;
        console.log(postCategory, postTitle, postContent); // 로그로 값 확인
        const userEmail = req.headers['email'];
        let userNumber = 0;
        let postNumber = 0;
        const findNumberQuery = `SELECT * FROM User WHERE email = ?`;
        req.mysqlConnection.query(findNumberQuery, [userEmail], (err, results) => {
            if (err) {
                console.error('Error while querying:', err);
                return res.status(500).send('서버 에러');
            }
            userNumber = results[0].userNumber;
            const customerServiceData = {
                userNumber: userNumber,
                postCategory: postCategory,
                postTitle: postTitle,
                postContent: postContent,
            };
            const insertQuery = 'INSERT INTO CustomerService SET ?'; // 사용자 정보 추가 쿼리문
            req.mysqlConnection.query(insertQuery, customerServiceData, (error, results) => {
                if (error) {
                    console.log(insertQuery);
                    console.error('Error while registering user:', error);
                    return res.status(504).send('게시글 저장에 실패했습니다.');
                }
                postNumber = results.insertId;
                //여기까지 된다면 게시글 저장 성공
                const imageKeys = req.files.map(file => file.key); // 이미지 키 확인
                const imagePaths = req.files.map(file => file.location); // 이미지 경로 확인
                Promise.all(imagePaths.map((imagePath, index) => {
                    return new Promise((resolve, reject) => {
                        const imageData = {
                            postNumber: postNumber,
                            imagePath: imagePath,
                            imageKey: imageKeys[index],
                        };
                        const uploadQuery = 'INSERT INTO CustomerServiceImage SET ?'; // 이미지 업로드 쿼리문
                        req.mysqlConnection.query(uploadQuery, imageData, (error, results) => {
                            if (error) {
                                console.log(uploadQuery);
                                console.error('Error while registering image:', error);
                                reject('이미지 경로 및 키를 테이블 저장에 실패했습니다.');
                            }
                            resolve('이미지 저장이 완료되었습니다.');
                        });
                    });
                }))
                .then(successMessages => {
                    return res.status(200).send("성공적으로 저장하였습니다.")
                })
                .catch(errorMessage => {
                    res.status(500).send(errorMessage);
                });
            });
        });
    });
};

exports.readGeneral = (req,res) => {
    const userEmail = req.headers['email'];
    let userNumber = 0;
    const findNumberQuery = `SELECT * FROM User WHERE email = ?`;
    req.mysqlConnection.query(findNumberQuery, [userEmail], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        userNumber = results[0].userNumber;
        const findpostQuery = `SELECT * FROM CustomerService WHERE userNumber = ?`;
        req.mysqlConnection.query(findpostQuery, [userNumber], (err, postresults) => {
            if (err) {
                console.error('Error while querying:', err);
                return res.status(500).send('서버 에러');
            }
            const postNumbers = postresults.map(post => post.postNumber);
            const findpostQuery = `SELECT * FROM CustomerServiceImage WHERE postNumber IN (${postNumbers.join(',')})`;
            req.mysqlConnection.query(findpostQuery, (err, imageresults) => {
                if (err) {
                    console.error('Error while querying:', err);
                    return res.status(500).send('서버 에러');
                }
                return res.status(200).json({
                    posts : postresults,
                    images : imageresults
                });
            });
        });
    });
}


exports.readManager = (req,res) => {
    const userEmail = req.headers['email'];
    const findNumberQuery = `SELECT * FROM User WHERE email = ? AND manager = 1`;
    req.mysqlConnection.query(findNumberQuery, [userEmail], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        if (results.length === 0) {
            return res.status(301).send('관리자가 아닙니다.');
        }
        const findpostQuery = `SELECT * FROM CustomerService`;
        req.mysqlConnection.query(findpostQuery, (err, postresults) => {
            if (err) {
                console.error('Error while querying:', err);
                return res.status(500).send('서버 에러');
            }
            const findpostQuery = `SELECT * FROM CustomerServiceImage`;
            req.mysqlConnection.query(findpostQuery, (err, imageresults) => {
                if (err) {
                    console.error('Error while querying:', err);
                    return res.status(500).send('서버 에러');
                }
                return res.status(200).json({
                    posts : postresults,
                    images : imageresults
                });
            });
        });
    });
}

exports.responsePost = (req,res) => {
    const userEmail = req.headers['email'];
    const findNumberQuery = `SELECT * FROM User WHERE email = ? AND manager = 1`;
    req.mysqlConnection.query(findNumberQuery, [userEmail], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        if (results.length === 0) {
            return res.status(301).send('관리자가 아닙니다.');
        }
        const userNumber = results[0].userNumber;
        const {responseTitle, responseContent, postNumber} = req.body;
        const now = getCurrentDateTime();
        const updateQuery = `UPDATE CustomerService SET responderNumber = ?, responseTitle = ?, responseContent = ?, responseTime = ?, isAnswered = 1 WHERE postNumber = ?`
        req.mysqlConnection.query(updateQuery, [userNumber, responseTitle,responseContent,now, postNumber], (err, results) => {
            if (err) {
                console.error('Error while updating:', err);
                return res.status(500).send('서버 에러');
            }
            if (results.affectedRows === 0) {
                return res.status(501).send('쿼리 에러');
            }
            return res.status(200).send('작성 완료');
        });
    });
}

function getCurrentDateTime() {
    const now = moment().tz("Asia/Seoul");
    const formattedDateTime = now.format("YYYY-MM-DD HH:mm:ss");
    return formattedDateTime;
}