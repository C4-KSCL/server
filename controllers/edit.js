exports.editInfo = (req, res) => {
    const email = req.headers.email;
    if (!email) {
        return res.status(400).send('이메일 헤더가 제공되지 않았습니다.');
    }
    const { password, nickname, phoneNumber, age, gender, myMBTI, myKeyword, friendKeyword } = req.body;
    // 유저 정보 업데이트문을 수행하는 쿼리문
    const updateQuery = `UPDATE User SET password = ?,nickname = ?,phoneNumber = ?,age = ?,gender = ?,myMBTI = ?,myKeyword = ?,friendKeyword = ? WHERE email = ?`;
    req.mysqlConnection.query(updateQuery, [password, nickname, phoneNumber, age, gender, myMBTI, myKeyword, friendKeyword, email], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        if (results.affectedRows === 0) {
            return res.status(404).send('해당 이메일의 사용자가 존재하지 않거나 변경된 내용이 없습니다.');
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
                // Refresh Token을 클라이언트로 전송하고, Access Token을 JSON 응답에 포함하여 반환
                return res.status(200).json({
                    user : userResults[0]
                    // 필요한 사용자 정보를 추가로 반환할 수 있음
                });
            });
        });
    }
    );
}
