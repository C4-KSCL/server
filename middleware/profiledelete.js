const aws = require('aws-sdk');
const defaultImagePath = "https://matchingimage.s3.ap-northeast-2.amazonaws.com/defalut_user.png";

exports.profiledelete = async (req, res) => {
    const deletePath = req.body.deletepath;
    const email = req.body.email || req.headers.email;

    // S3 설정
    const s3 = new aws.S3({
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION,
    });

    try {
        // 데이터베이스에서 이미지 키 조회
        const findKeyQuery = 'SELECT userImageKey FROM User WHERE userImage = ?';
        const [keyResults] = await req.mysqlConnection.promise().query(findKeyQuery, [deletePath]);
        
        if (keyResults.length === 0) {
            return res.status(404).send('이미지 경로가 없습니다.');
        }

        const deleteKey = keyResults[0].userImageKey;

        // S3에서 이미지 삭제
        const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: deleteKey,
        };
        await s3.deleteObject(s3Params).promise();
        console.log('Deleted image from S3:', deleteKey);

        // 데이터베이스에서 이미지 정보 업데이트
        const deleteQuery = 'UPDATE User SET userImage = ?, userImageKey = "" WHERE userImage = ?';
        await req.mysqlConnection.promise().query(deleteQuery, [defaultImagePath, deletePath]);

        // 사용자 정보 및 이미지 조회
        const findInfoQuery = 'SELECT * FROM User WHERE email = ?';
        const [userResults] = await req.mysqlConnection.promise().query(findInfoQuery, [email]);

        if (userResults.length === 0) {
            return res.status(401).send('아이디 또는 비밀번호가 올바르지 않습니다.');
        }

        const userNumber = userResults[0].userNumber;
        const findImageQuery = 'SELECT * FROM UserImage WHERE userNumber = ?';
        const [imageResults] = await req.mysqlConnection.promise().query(findImageQuery, [userNumber]);

        // 응답 전송
        res.status(200).json({
            user: userResults[0],
            images: imageResults,
        });

    } catch (error) {
        console.error('Error during profile deletion:', error);
        res.status(500).send('프로필 삭제 중 오류가 발생했습니다.');
    }
};
