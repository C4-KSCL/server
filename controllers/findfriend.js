const moment = require('moment-timezone');
const axios = require('axios');
const util = require('util');
exports.friendMatching = async (req, res) => {
    const userEmail = req.headers['email'];
    let friendMBTI = "";

    // 이메일 정보를 가지고 해당 유저가 설정한 친구 MBTI 정보를 찾음
    const mbtifindQuery = `SELECT * FROM User WHERE email = ?`;
    try {
        // promisify를 사용하여 query를 프로미스 기반으로 변환
        const query = util.promisify(req.mysqlConnection.query).bind(req.mysqlConnection);
        const userResults = await query(mbtifindQuery, [userEmail]);

        if (userResults.length === 0) {
            return res.status(404).send('사용자를 찾을 수 없습니다.');
        }

        const user = userResults[0];
        const userNumber = user.userNumber;
        const myMBTI = user.myMBTI;
        const myKeywords = user.myKeyword.split(',');
        const myfriendMBTI = user.friendMBTI;
        const myfriendMinAge = user.friendMinAge;
        const myfriendMaxAge = user.friendMaxAge;
        const myfriendGender = user.friendGender;
        const myfriendKeywords = user.friendKeyword;

        // 사용자가 설정한 친구 MBTI 탐색 후 해당 MBTI를 가진 유저 조회
        const friendfindQuery = `
        SELECT 
            user.*,
            (
                -- 키워드 일치 점수 계산
                (
                    SELECT COUNT(*)
                    FROM (
                        SELECT DISTINCT TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(u.myKeyword, ',', numbers.n), ',', -1)) AS keyword
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
                        WHERE CHAR_LENGTH(u.myKeyword) - CHAR_LENGTH(REPLACE(u.myKeyword, ',', '')) >= numbers.n - 1
                        AND u.email = user.email
                    ) AS keywords
                    WHERE FIND_IN_SET(keywords.keyword, ?) > 0
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
            AND suspend = 0
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
        LIMIT 3;
        `;

        const friendResults = await query(friendfindQuery, [
            myfriendKeywords, myfriendMBTI, myfriendMBTI, myfriendMBTI, myfriendMBTI,
            myfriendMaxAge, myfriendMinAge, myfriendGender,
            userEmail, userEmail, userEmail, userEmail, userEmail
        ]);

        if (friendResults.length === 0) {
            return res.status(404).send('해당하는 사용자가 없습니다.');
        }

        const userNumbers = friendResults.map(user => user.userNumber);

        const chatGPTResponses = await Promise.all(friendResults.map(async user => {
            const userMBTI = user.myMBTI;
            const userKeywords = user.myKeyword.split(',');

            const prompt = `너는 친구 관계를 도와주는 상담사야. 나는 ${myMBTI}이고 ${myKeywords.join(', ')} 하는 것을 좋아하는 사람이야. 친구는 ${userMBTI}이고 ${userKeywords.join(', ')} 하는 것을 좋아하는 친구야. MBTI 조합에 있어서 성격상 잘맞는 부분과 공통되어 있는 취미를 기반으로 친구와 친해질수 있는 계기나 요소 등을 섞어서 200자 이내로 친근한 반말로 답변해줘`;

            const messages = [
                { "role": "system", "content": "You are a helpful assistant." },
                { "role": "user", "content": prompt }
            ];

            try {
                const response = await axios.post('https://api.openai.com/v1/chat/completions', {
                    model: "gpt-3.5-turbo",
                    messages: messages,
                    max_tokens: 1500
                }, {
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });
                return {
                    userNumber: user.userNumber,
                    analysis: response.data.choices[0].message.content.trim()
                };
            } catch (error) {
                console.error('Error while calling ChatGPT API:', error.response ? error.response.data : error.message);
                return {
                    userNumber: user.userNumber,
                    analysis: '분석 중 오류가 발생했습니다.'
                };
            }
        }));

        const userResultsWithAnalysis = friendResults.map(user => {
            const analysis = chatGPTResponses.find(response => response.userNumber === user.userNumber).analysis;
            return {
                ...user,
                analysis
            };
        });

        await Promise.all(userNumbers.map(async (oppNumber) => {
            const insertQuery = `
                INSERT INTO UserMatchingHistory (userNumber, oppNumber)
                VALUES (?, ?);
            `;
            try {
                await query(insertQuery, [userNumber, oppNumber]);
            } catch (err) {
                console.error('Error while querying:', err);
            }
        }));

        const findImageQuery = `
            SELECT UserImage.imageNumber, UserImage.userNumber, UserImage.imagePath, UserImage.imageCreated, UserImage.imageKey
            FROM UserImage, User 
            WHERE User.userNumber = UserImage.userNumber AND UserImage.userNumber IN (${userNumbers.join(',')});
        `;

        const imageResults = await query(findImageQuery);

        const now = moment().format('YYYY-MM-DD HH:mm:ss');
        const updateQuery = `UPDATE User SET requestTime = ? WHERE email = ?`;

        await query(updateQuery, [now, userEmail]);

        return res.status(200).json({
            users: userResultsWithAnalysis,
            images: imageResults
        });
    } catch (err) {
        console.error('Error:', err);
        return res.status(500).send('서버 에러');
    }
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

exports.settingMBTI = (req, res) => {
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

exports.settingKeyword = (req, res) => {
    const userEmail = req.headers['email'];
    const { friendKeyword} = req.body;
    const updateQuery = `UPDATE User SET friendKeyword = ? WHERE email = ?`;
    req.mysqlConnection.query(updateQuery, [friendKeyword, userEmail], (err, results) => {
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

