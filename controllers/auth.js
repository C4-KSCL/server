const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
const accessTokenExpiryTime = '1440m'; // Access Token 유효기간
const refreshTokenExpiryTime = '1440m'; // Refresh Token 유효기간
const nodemailer = require('nodemailer');

// 로그인 처리 컨트롤러 함수
exports.login = (req, res) => {
    const clientPort = req.get('host').split(':')[1]; // 클라이언트의 포트 번호
    console.log(`Hello World! 현재 포트 : ${clientPort}`);
    const { email, password } = req.body;
    console.log(email, password);
    const findInfoQuery = `SELECT * FROM User WHERE email = ? AND password = ?`;
    req.mysqlConnection.query(findInfoQuery, [email, password], (err, userResults) => {
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
            // Access Token 생성
            const accessToken = jwt.sign({
                email: email
            }, accessTokenSecret, {
                expiresIn: accessTokenExpiryTime,
                issuer: 'choo',
            });
            // Refresh Token 생성
            const refreshToken = jwt.sign({
                email: email
            }, refreshTokenSecret, {
                expiresIn: refreshTokenExpiryTime,
                issuer: 'choo',
            });
            // Refresh Token을 클라이언트로 전송하고, Access Token을 JSON 응답에 포함하여 반환
            return res.status(200).json({
                user : userResults[0],
                images : imageResults,
                accessToken: accessToken,
                refreshToken: refreshToken,
                // 필요한 사용자 정보를 추가로 반환할 수 있음
            });
        });
    });
};

// 비밀번호 찾기 처리 컨트롤러 함수
exports.findpw = (req, res) => {
    const { email } = req.body;
    const query = `SELECT * FROM User WHERE email = ?`;
    req.mysqlConnection.query(query, [email], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        if (results.length === 0) {
            return res.status(401).send('존재하지 않는 이메일입니다.');
        }
        const user = results[0]; // 첫 번째 결과값을 사용자 정보로 설정
    });
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    // 네이버 메일 전송 설정
    const transporter = nodemailer.createTransport({
        service: 'Naver',
        auth: {
            user: process.env.SEND_MAIL_ID, // 네이버 이메일
            pass: process.env.SEND_MAIL_PW, // 네이버 비밀번호
        },
    });

    // 이메일 전송 옵션
    const mailOptions = {
        from: process.env.SEND_MAIL_ID, // 발신자 이메일 주소
        to: email, // 수신자 이메일 주소
        subject: '앱이름_인증번호',
        text: `인증번호: ${verificationCode}`, // 메일 내용은 인증번호
    };

    // 이메일 전송
    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error occurred:', error);
            return res.status(500).send('이메일 전송에 실패했습니다.');
        } else {
            console.log('Email sent:', info.response);
            // 생성된 랜덤 인증번호를 JSON 형태로 반환
            return res.status(200).json({ verificationCode });
        }
    });
}

//비밀번호 변경 처리 컨트롤러 함수
exports.setpw = (req, res) => {
    const { email, password } = req.body;
    const query = `UPDATE User SET password = ? WHERE email = ?`; //비밀번호를 수정하는 쿼리문
    req.mysqlConnection.query(query, [password, email], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        if (results.affectedRows === 0) {
            // 쿼리가 실행되었지만 영향을 받은 행이 없는 경우
            return res.status(404).send('해당 이메일을 가진 사용자를 찾을 수 없습니다.');
        }
        res.status(200).send('비밀번호 변경이 완료되었습니다.');
    });
}
