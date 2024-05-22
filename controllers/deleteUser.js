const aws = require('aws-sdk');
const defaultImagePath = "https://matchingimage.s3.ap-northeast-2.amazonaws.com/defalut_user.png";
const defaultImageKey = "defalut_user.png"
const s3 = new aws.S3({
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});
exports.deleteUserAndImages = (req, res) => {
    const email = req.headers.email;
    // 데이터베이스에서 이미지 정보 조회
    const findImageQuery = 'SELECT imageKey FROM User,UserImage WHERE User.userNumber = UserImage.userNumber AND User.email = ?';
    req.mysqlConnection.query(findImageQuery, [email], (error, results) => {
        if (error) {
            console.error('Error retrieving images from database:', error);
            return res.status(500).send('서버 에러');
        }
        if (results.length === 0) {
            // 이미지가 없는 경우 바로 회원 삭제 진행
            deleteUser(email, req, res);
        } else {
            // S3에서 이미지 삭제
            const deleteObjects = results.map(image => ({ Key: image.imageKey }));
            const s3Params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Delete: { Objects: deleteObjects },
            };
            s3.deleteObjects(s3Params, (err, data) => {
                if (err) {
                    console.error('Error deleting images from S3:', err);
                    return res.status(500).send('이미지 삭제에 실패했습니다.');
                }
                // 데이터베이스에서 이미지 정보 삭제
                const deleteImageInfoQuery = 'DELETE FROM UserImage WHERE userNumber IN (SELECT userNumber FROM User WHERE email = ?)'
                req.mysqlConnection.query(deleteImageInfoQuery, email, (error, results) => {
                    if (error) {
                        console.error('Error deleting images from database:', error);
                        return res.status(500).send('데이터베이스에서 이미지 정보 삭제에 실패했습니다.');
                    }
                    // 회원 이미지 삭제 진행
                    imageDelete(email, req, res)
                    // 회원 삭제 진행
                    deleteUser(email, req, res);
                });
            });
        }
    });
};
function imageDelete (email, req, res)
{
    const findKeyQuery = 'SELECT userImageKey FROM User WHERE email = ?';
    req.mysqlConnection.query(findKeyQuery, [email], (error, results) => {
        if (error) {
            console.error('Error deleting image from database:', error);
            return res.status(501).send('데이터베이스에서 이미지 정보 조회에 실패하였습니다');
        }
        if (results.length === 0) {
            return res.status(501).send('이미지 경로는 없습니다.');
        }
        // 이미지 키 설정
        const deleteKey = results[0].userImageKey;
        if (deleteKey == defaultImageKey){
            console.log("삭제 생략")
        }
        else
        {
            // S3에서 이미지 삭제
            const s3Params = {
                Bucket: process.env.S3_BUCKET_NAME,
                Key: deleteKey,
            };
            s3.deleteObject(s3Params, (err, data) => {
                if (err) {
                    console.error('Error deleting image from S3:', err);
                    return res.status(501).send('이미지 삭제에 실패했습니다.');
                }
                // 데이터베이스에서 이미지 정보 삭제
                const deleteQuery = 'UPDATE User SET userImage = ? , userImageKey = ? WHERE email = ?';
                req.mysqlConnection.query(deleteQuery, [defaultImagePath, defaultImageKey, email], (error, results) => {
                    if (error) {
                        console.error('Error deleting image from database:', error);
                        return res.status(501).send('데이터베이스에서 이미지 정보 삭제에 실패했습니다.');
                    }
                });
            });
        }
    });
};

function deleteUser (email, req, res) {
    const deleteUpdateQuery = `UPDATE User SET deleteTime = DATE_ADD(NOW(), INTERVAL 1 DAY) WHERE email = ?;`;
    req.mysqlConnection.query(deleteUpdateQuery, [email], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(502).send('서버 에러');
        }
        if (results.affectedRows === 0) {
            // 쿼리가 실행되었지만 영향을 받은 행이 없는 경우
            return res.status(304).send('해당 이메일을 가진 사용자를 찾을 수 없습니다.');
        }
        res.status(200).send('사용자 삭제 완료');
    });
}
