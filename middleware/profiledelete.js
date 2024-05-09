const aws = require('aws-sdk');
const defaultImagePath = "https://matchingimage.s3.ap-northeast-2.amazonaws.com/defalut_user.png";
const defaultImageKey = "defalut_user.png"
exports.profiledelete = (req, res) => {
    const deletePath = req.body.deletepath;
    const email = req.headers.email;
    // 이미지 삭제를 위한 S3 설정
    const s3 = new aws.S3({
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });

    // 데이터베이스에서 이미지 정보 조회
    const findKeyQuery = 'SELECT userImageKey FROM User WHERE userImage = ?';
    req.mysqlConnection.query(findKeyQuery, [deletePath], (error, results) => {
        if (error) {
            console.error('Error deleting image from database:', error);
            return res.status(502).send('데이터베이스에서 이미지 정보 조회에 실패하였습니다');
        }
        if (results.length === 0) {
            return res.status(500).send('이미지 경로는 없습니다.');
        }
        // 이미지 키 설정
        const deleteKey = results[0].userImageKey;
        // S3에서 이미지 삭제
        const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: deleteKey,
        };
        s3.deleteObject(s3Params, (err, data) => {
            console.log('Deleted image from S3:', data); // 추가
            if (err) {
                console.error('Error deleting image from S3:', err);
                return res.status(500).send('이미지 삭제에 실패했습니다.');
            }
            // 데이터베이스에서 이미지 정보 삭제
            const deleteQuery = 'UPDATE User SET userImage = ? , userImageKey = ? WHERE email = ?';
            req.mysqlConnection.query(deleteQuery, [defaultImagePath, defaultImageKey, email], (error, results) => {
                if (error) {
                    console.error('Error deleting image from database:', error);
                    return res.status(501).send('데이터베이스에서 이미지 정보 삭제에 실패했습니다.');
                }
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
                        return res.status(200).json({
                            user : userResults[0],
                            images : imageResults,
                            // 필요한 사용자 정보를 추가로 반환할 수 있음
                        });
                    });
                });
            });
        });
    });
};
