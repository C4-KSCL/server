exports.deleteuser = (req, res) => {
    const email = req.headers.email;
    const deleteQuery = `DELETE FROM User WHERE email = ?`;
    req.mysqlConnection.query(deleteQuery, [email], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        res.status(200).send('사용자 삭제 완료');
    });
}
