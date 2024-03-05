const nodemailer = require('nodemailer');
//이메일 인증
exports.emailauth = (req, res) => {
    const { email } = req.body;

    // 랜덤한 인증번호 생성 (예: 6자리 숫자)
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
};
//닉네임 중복 확인
exports.checknickname = (req, res) => {
    const nickname = req.body.nickname;
    const checknicknameQuery = `SELECT * FROM User WHERE nickname = ?`;
    req.mysqlConnection.query(checknicknameQuery, [nickname], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        if (results.length !== 0) {
            return res.status(401).send('존재하는 닉네임입니다.');
        }
        return res.status(200).send('사용가능한 닉네임 입니다.');
    });
}

// 회원 DB 등록
exports.register = (req, res) => {
    const { email, password, nickname, phoneNumber, age, gender, myMBTI, myKeyword, friendKeyword, friendMBTI,friendMaxAge, friendMinage, friendGender } = req.body;
    // 데이터베이스에 사용자 정보 저장
    const checkemailQuery = `SELECT * FROM User WHERE email = ?`;
    req.mysqlConnection.query(checkemailQuery, [email], (err, results) => {
        if (err) {
            console.error('Error while querying:', err);
            return res.status(500).send('서버 에러');
        }
        if (results.length !== 0) {
            return res.status(401).send('존재하는 이메일입니다.');
        }
        else {
            const userData = {
                email: email,
                password: password,
                nickname: nickname,
                phoneNumber: phoneNumber,
                age: age,
                gender: gender,
                myMBTI: myMBTI,
                myKeyword: myKeyword,
                friendKeyword: friendKeyword,
                friendMBTI: friendMBTI,
                friendMaxAge: friendMaxAge,
                friendMinAge: friendMinage,
                friendGender: friendGender,
            };
            const insertQuery = 'INSERT INTO User SET ?'; // 사용자 정보 추가 쿼리문
            req.mysqlConnection.query(insertQuery, userData, (error, results) => {
                if (error) {
                    console.log(insertQuery);
                    console.error('Error while registering user:', error);
                    return res.status(500).send('회원가입에 실패했습니다.');
                }
                return res.status(200).send('회원가입에 성공하였습니다.');
            });
        }
    });
};
