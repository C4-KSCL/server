const moment = require('moment-timezone');

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
        const userNumber = results[0].userNumber;
        const myfriendMBTI = results[0].friendMBTI;
        const myfriendMinAge = results[0].friendMinAge;
        const myfriendMaxAge = results[0].friendMaxAge;
        const myfriendGender = results[0].friendGender;
        
        //사용자가 설정한 친구MBTI 탐색 후 해당 MBTI를 가진 유저 조회
        const friendfindQuery = 
        `
        SELECT 
            user.*,
            (
                -- 키워드 일치 점수 계산
                (
                    SELECT COUNT(*)
                    FROM (
                        SELECT DISTINCT TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(u.friendKeyword, ',', numbers.n), ',', -1)) AS keyword
                        FROM User u
                        CROSS JOIN (
                            SELECT 1 n UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 
                            UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
                            UNION ALL SELECT 11 UNION ALL SELECT 12 UNION ALL SELECT 13 UNION ALL SELECT 14 UNION ALL SELECT 15 
                            UNION ALL SELECT 16 UNION ALL SELECT 17 UNION ALL SELECT 18 UNION ALL SELECT 19 UNION ALL SELECT 20
                            UNION ALL SELECT 21 UNION ALL SELECT 22 UNION ALL SELECT 23 UNION ALL SELECT 24 UNION ALL SELECT 25 
                            UNION ALL SELECT 26 UNION ALL SELECT 27 UNION ALL SELECT 28 UNION ALL SELECT 29 UNION ALL SELECT 30
                            UNION ALL SELECT 31 UNION ALL SELECT 32 UNION ALL SELECT 33 UNION ALL SELECT 34 UNION ALL SELECT 35
                            UNION ALL SELECT 36 UNION ALL SELECT 37 UNION ALL SELECT 38 UNION ALL SELECT 39 UNION ALL SELECT 40
                            UNION ALL SELECT 41 UNION ALL SELECT 42 UNION ALL SELECT 43 UNION ALL SELECT 44 UNION ALL SELECT 45
                            UNION ALL SELECT 46 UNION ALL SELECT 47 UNION ALL SELECT 48 UNION ALL SELECT 49 UNION ALL SELECT 50
                        ) AS numbers
                        WHERE CHAR_LENGTH(u.friendKeyword) - CHAR_LENGTH(REPLACE(u.friendKeyword, ',', '')) >= numbers.n - 1
                        AND u.email = user.email
                    ) AS keywords
                    WHERE FIND_IN_SET(keywords.keyword, user.myKeyword) > 0
                ) + 
                -- MBTI 일치 점수 계산
                (
                    (CASE WHEN SUBSTRING(?, 1, 1) = SUBSTRING(user.myMBTI, 1, 1) THEN 5 ELSE 0 END) +
                    (CASE WHEN SUBSTRING(?, 2, 1) = SUBSTRING(user.myMBTI, 2, 1) THEN 5 ELSE 0 END) +
                    (CASE WHEN SUBSTRING(?, 3, 1) = SUBSTRING(user.myMBTI, 3, 1) THEN 5 ELSE 0 END) +
                    (CASE WHEN SUBSTRING(?, 4, 1) = SUBSTRING(user.myMBTI, 4, 1) THEN 5 ELSE 0 END)
                )
            ) AS totalScore
        FROM User user
        WHERE user.deleteTime IS NULL 
                AND CAST(user.age AS UNSIGNED) <= CAST(? AS UNSIGNED) 
                AND CAST(user.age AS UNSIGNED) >= CAST(? AS UNSIGNED) 
                AND user.gender = ?
                AND user.email != ?
        AND user.email != ?
        AND user.email NOT IN (
            SELECT oppEmail FROM Friend WHERE userEmail = ?
        )
        AND user.email NOT IN (
            SELECT recUser FROM AddRequest WHERE reqUser = ? AND status = 'ing'
        )
        AND user.userNumber NOT IN (
            SELECT oppNumber FROM UserMatchingHistory WHERE userNumber = (SELECT userNumber FROM User WHERE email = ?)
        )
        ORDER BY totalScore DESC
        limit 3;        
        `;  
        req.mysqlConnection.query(friendfindQuery, [myfriendMBTI, myfriendMBTI, myfriendMBTI, myfriendMBTI, myfriendMaxAge, myfriendMinAge, myfriendGender, userEmail, userEmail, userEmail, userEmail,userEmail], (err, userResults) => {    
            if (err) {
                console.error('Error while querying:', err);
                return res.status(500).send('서버 에러');
            }
            if (userResults.length === 0) {
                return res.status(404).send('해당하는 사용자가 없습니다.');
            }
            // userResults에서 userNumber만 추출하여 배열로 만듦
            const userNumbers = userResults.map(user => user.userNumber);
            // userMatchingHistroy에 기록을 추가
            userNumbers.forEach(oppNumber => {
                const insertQuery = `
                    INSERT INTO UserMatchingHistory (userNumber, oppNumber)
                    VALUES (?, ?);
                `;
                req.mysqlConnection.query(insertQuery, [userNumber, oppNumber], (err, results) => {
                    if (err) {
                        console.error('Error while querying:', err);
                        return res.status(500).send('서버 에러');
                    }
                });
            });
            // findImageQuery에 WHERE 조건에 userNumber IN (...)을 추가하여 필터링
            const findImageQuery = `SELECT UserImage.imageNumber, UserImage.userNumber, UserImage.imagePath, UserImage.imageCreated, UserImage.imageKey
            FROM UserImage, User 
            WHERE User.userNumber = UserImage.userNumber AND UserImage.userNumber IN (${userNumbers.join(',')});`;
            req.mysqlConnection.query(findImageQuery, [friendMBTI, userEmail], (err, imageResults) => {
                if (err) {
                    console.error('Error while querying:', err);
                    return res.status(500).send('서버 에러');
                }
                const now = getCurrentDateTime();
                const updateQuery = `UPDATE User SET requestTime = ? WHERE email = ?`;
                req.mysqlConnection.query(updateQuery, [now, userEmail], (err, results) => {
                    if (err) {
                        console.error('Error while updating:', err);
                        return res.status(500).send('서버 에러');
                    }
                    return res.status(200).json({
                        users: userResults,
                        images: imageResults
                    });
                });
            });
        });
    });
};
exports.getfriendinfo = (req, res) => {
    let userNumbers = req.query.userNumbers;
    if (typeof userNumbers === 'string') {
        userNumbers = userNumbers.split(',').map(Number);
    }

    // 해당 번호에 해당하는 친구들의 정보를 반환하는 쿼리문
    const infoQuery = 'SELECT * FROM User WHERE userNumber IN (?)';
    req.mysqlConnection.query(infoQuery, [userNumbers], (error, userResults) => {
        if (error) {
            console.error('Error while querying:', error);
            return res.status(500).send('서버 에러');
        }
        // 해당 번호에 해당하는 친구들의 이미지를 반환하는 쿼리문
        const findImageQuery = `SELECT UserImage.imageNumber, UserImage.userNumber, UserImage.imagePath, UserImage.imageCreated 
            FROM UserImage
            WHERE UserImage.userNumber IN (?)`;
            req.mysqlConnection.query(findImageQuery, [userNumbers], (err, imageResults) => {  // 여기서 database 사용해야 합니다.
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
        if (results.affectedRows === 0) {
            return res.status(504).send('사용자를 찾을 수 없습니다.');
        }
        return res.status(200).send('설정 완료');
    });
}

exports.getimage = (req, res) => {
    const { friendEmail } = req.body;
    const finduserquery = `SELECT * FROM User WHERE email = ?`;
    req.mysqlConnection.query(finduserquery, [friendEmail], (err, userResults) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        if (userResults.length === 0) {
            return res.status(301).send('존재하지 않는 이메일입니다.');
        }
        const userNumber = userResults[0].userNumber; 
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
}

//시간 형식 설정 함수
function getCurrentDateTime() {
    const now = moment().tz("Asia/Seoul");
    const formattedDateTime = now.format("YYYY-MM-DD HH:mm:ss");
    return formattedDateTime;
}

