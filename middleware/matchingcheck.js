const moment = require('moment-timezone');

exports.check = (req, res, next) => {
    const userEmail = req.headers['email'];
    const checkQuery = `SELECT * FROM User WHERE email = ?`;
    req.mysqlConnection.query(checkQuery, [userEmail], (err, results) => {
        if (err) {
            console.error('Error while updating:', err);
            return res.status(500).send('서버 에러');
        }
        if (results.length === 0) {
            return res.status(500).send('해당 사용자는 없습니다.');
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
    return differenceInMinutes >= 1; //10분 차이로 설정
}

//시간 형식 설정 함수
function getCurrentDateTime() {
    const now = moment().tz("Asia/Seoul");
    const formattedDateTime = now.format("YYYY-MM-DD HH:mm:ss");
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