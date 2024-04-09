exports.deleteuser = (req, res) => {
    const email = req.headers.email;
    const deleteUpdateQuery = `UPDATE User SET deleteTime = DATE_ADD(NOW(), INTERVAL 1 DAY) WHERE email = ?;`;
    req.mysqlConnection.query(deleteUpdateQuery, [email], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        if (results.affectedRows === 0) {
            // 쿼리가 실행되었지만 영향을 받은 행이 없는 경우
            return res.status(304).send('해당 이메일을 가진 사용자를 찾을 수 없습니다.');
        }
        res.status(200).send('사용자 삭제 완료');
    });
}
