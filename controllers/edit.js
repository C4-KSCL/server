exports.editInfo = (req, res) => {
    const email = req.headers.email;
    const { password, nickname, phoneNumber, birthdate, gender, myMBTI, myKeyword, friendKeyword } = req.body;
    // 유저 정보 업데이트문을 수행하는 쿼리문
    const updateQuery = `UPDATE User SET password = ?,nickname = ?,phoneNumber = ?,age = ?,gender = ?,myMBTI = ?,myKeyword = ?,friendKeyword = ? WHERE email = ?`;
    req.mysqlConnection.query(updateQuery, [password, nickname, phoneNumber, birthdate, gender, myMBTI, myKeyword, friendKeyword, email], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        const selectQuery = `SELECT * FROM User WHERE email = ?`;
        req.mysqlConnection.query(selectQuery, [email], (selectErr, selectResults) => {
            if (selectErr) {
                console.error('Error while querying user information:', selectErr);
                return res.status(501).send('서버 에러');
            }
            // 변경된 사용자 정보 반환
            const updatedUserInfo = selectResults[0];
            res.status(200).json(updatedUserInfo);
        });
    }
    );
}
