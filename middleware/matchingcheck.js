exports.check = (req, res, next) => {
    const userEmail = req.headers['email'];
    const checkQuery = `SELECT * FROM User WHERE email = ?`;
    req.mysqlConnection.query(checkQuery, [userEmail], (err, results) => {
        if (err) {
            console.error('Error while updating:', err);
            return res.status(500).send('서버 에러');
        }
        if (isAllowed(results[0].requestTime) == true) {//10분이상 차이남
            return next();
        }
        return res.status(400).json({
            requestTime: results[0].requestTime
        });
    });
}

// 현재 시간과 최근 요청 시간 비교 함수
function isAllowed(requestTime) {
    const koreaNow = getCurrentDateTime();
    const differenceInMinutes = calculateTimeDifference(koreaNow, requestTime);
    return differenceInMinutes >= 10; //10분 차이로 설정
}

//시간 형식 설정 함수
function getCurrentDateTime() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const formattedDateTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    return formattedDateTime;
}

//시간 차이 구하는 함수
function calculateTimeDifference(time1, time2) {
    const date1 = new Date(time1);
    const date2 = new Date(time2);
    const differenceInMilliseconds = Math.abs(date1 - date2);
    const differenceInMinutes = differenceInMilliseconds / (1000 * 60);
    return differenceInMinutes;
}