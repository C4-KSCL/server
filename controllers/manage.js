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