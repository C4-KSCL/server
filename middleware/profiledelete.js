const aws = require('aws-sdk');
const defaultImagePath = "https://matchingimage.s3.ap-northeast-2.amazonaws.com/defalut_user.png";
exports.profiledelete = (req, res) => {
    const deletePath = req.body.deletepath;
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
            return res.status(500).send('데이터베이스에서 이미지 정보 조회에 실패하였습니다');
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
            const deleteQuery = 'UPDATE User SET userImage = ? , userImageKey = "" WHERE userImage = ?';
            req.mysqlConnection.query(deleteQuery, [defaultImagePath, deletePath], (error, results) => {
                if (error) {
                    console.error('Error deleting image from database:', error);
                    return res.status(501).send('데이터베이스에서 이미지 정보 삭제에 실패했습니다.');
                }
                res.status(200).send('이미지 삭제가 완료되었습니다.');
            });
        });
    });
};
