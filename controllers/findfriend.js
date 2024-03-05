exports.friendMatching = (req, res) => {
    const userEmail = req.headers['email'];
    let friendMBTI = "";
    //이메일 정보를 가지고 해당 유저가 설정한 친구 MBTI 정보를 찾음
    const mbtifindQuery = `SELECT * FROM User WHERE email = ?`;
    req.mysqlConnection.query(mbtifindQuery, [userEmail], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        friendMBTI = results[0].friendMBTI;
        //사용자가 설정한 친구MBTI 탐색 후 해당 MBTI를 가진 유저 조회
        const friendfindQuery = `SELECT * FROM User WHERE myMBTI = ? AND email != ? ORDER BY RAND() LIMIT 5`;
        req.mysqlConnection.query(friendfindQuery, [friendMBTI, userEmail], (err, userResults) => {
            if (err) {
                console.error('Error while querying:', err);
                return res.status(500).send('서버 에러');
            }
            if (userResults.length === 0) {
                return res.status(401).send('해당하는 사용자가 없습니다.');
            }
            // userResults에서 userNumber만 추출하여 배열로 만듦
            const userNumbers = userResults.map(user => user.userNumber);

            // findImageQuery에 WHERE 조건에 userNumber IN (...)을 추가하여 필터링
            const findImageQuery = `SELECT UserImage.imageNumber, UserImage.userNumber, UserImage.imagePath, UserImage.imageCreated 
            FROM UserImage, User 
            WHERE User.userNumber = UserImage.userNumber AND User.myMBTI = ? AND User.email != ? AND UserImage.userNumber IN (${userNumbers.join(',')});`;
            req.mysqlConnection.query(findImageQuery, [friendMBTI, userEmail], (err, imageResults) => {
                if (err) {
                    console.error('Error while querying:', err);
                    return res.status(500).send('서버 에러');
                }
                return res.status(200).json({
                    users: userResults,
                    images: imageResults
                });
            });
        });
    });
};

exports.setting = (req, res) => {
    const userEmail = req.headers['email'];
    const { friendMBTI, friendMaxAge, friendMinAge, friendGender } = req.body;
    const updateQuery = `UPDATE User SET friendMBTI = ?, friendMaxAge = ?, friendMinAge = ?, friendGender = ? WHERE email = ?`;
    req.mysqlConnection.query(updateQuery, [friendMBTI, friendMaxAge, friendMinAge, friendGender, userEmail], (err, results) => {
        if (err) {
            console.error('Error while updating:', err);
            return res.status(500).send('서버 에러');
        }
        return res.status(200).send('설정 완료');
    });
}