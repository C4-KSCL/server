exports.suspend = (req,res) => {
    const {userNumber} = req.body;
    console.log(userNumber)
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
        const suspendQuery = `UPDATE User SET suspend = 1 WHERE userNumber = ?`;
        req.mysqlConnection.query(suspendQuery, [userNumber],(err, results) => {
            if (err || results.affectedRows === 0) {
                console.error('Error while querying:', err);
                return res.status(500).send('서버 에러');
            }
            return res.status(200).send('회원 정지 완료');
        });
    });
}

exports.removeSuspend = (req,res) => {
    const {userNumber} = req.body;
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
        const removeSuspendQuery = `UPDATE User SET suspend = 0 WHERE userNumber = ?`;
        req.mysqlConnection.query(removeSuspendQuery, [userNumber],(err, results) => {
            if (err || results.affectedRows === 0) {
                console.error('Error while querying:', err);
                return res.status(500).send('서버 에러');
            }
            return res.status(200).send('회원 정지 해제 완료');
        });
    });
}

exports.search = (req, res) => {
    const { userNumber } = req.body;
    const userEmail = req.headers['email'];
    const search_string = req.query.search_string; // 쿼리 파라미터에서 emailString을 가져옴

    // emailString이 정의되지 않은 경우 처리
    if (!search_string) {
        return res.status(400).send('emailString 파라미터가 필요합니다.');
    }

    const findNumberQuery = `SELECT * FROM User WHERE email = ? AND manager = 1`;
    
    req.mysqlConnection.query(findNumberQuery, [userEmail], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        if (results.length === 0) {
            return res.status(301).send('관리자가 아닙니다.');
        }

        // search_string 포함하는 이메일을 검사하는 쿼리
        const findEmailsQuery = `SELECT * FROM User WHERE email LIKE ?`;
        const emailPattern = `%${search_string}%`;

        req.mysqlConnection.query(findEmailsQuery, [emailPattern], (err, results) => {
            if (err) {
                console.error('Error while querying:', err);
                return res.status(500).send('서버 에러');
            }

            // 결과를 클라이언트에 응답
            return res.status(200).json({
                user: results
            });
        });
    });
};
