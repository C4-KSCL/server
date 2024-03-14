const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;
const accessTokenExpiryTime = '30m'; // Access Token 유효기간
const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;

import database from "../src/database";

exports.verifyAccessToken = (req, res, next) => {
    try { 
        //Access 토큰 유효성 검사
        req.access_decoded = jwt.verify(req.headers.accesstoken, process.env.ACCESS_TOKEN_SECRET)
        req.headers.email = req.access_decoded.email; //헤더에 유저의 이메일 정보를 추가
        req.user = req.access_decoded.email;
        return next();
    }
    catch (error) { 
        //Access 토큰 문제 발생
        if (error.name === 'TokenExpiredError') { //Access 토큰 기간 만료
            try { 
                //Refresh 토큰 유효성 검사
                req.refresh_decoded = jwt.verify(req.headers.refreshtoken, process.env.REFRESH_TOKEN_SECRET)
                //Refresh 토큰 유효한 경우 새로운 Access 토큰 발급 후 반환
                const userEmail = req.refresh_decoded.email;
                const newAccessToken = jwt.sign({
                    email: userEmail
                }, accessTokenSecret, {
                    expiresIn: accessTokenExpiryTime,
                    issuer: 'choo',
                });
                return res.status(300).json({
                    //Access 토큰 만료, Refresh 토큰 만료 X
                    code: 300,
                    message: 'access 토큰이 발급되었습니다.',
                    accessToken: newAccessToken,
                    refreshToken: req.headers.refreshtoken,
                });
            }
            catch (error){
                if(req.headers.refreshtoken != undefined) { //우선 refresh 토큰을 보냈는지 확인
                    if(error.name === 'TokenExpiredError'){
                        return res.status(402).json({
                            //Access 토큰 만료, Refresh 토큰 만료
                            code: 402,
                            message: 'refresh 토큰이 만료되었습니다.'
                        });
                    }
                    if(error.name === 'JsonWebTokenError'){
                        return res.status(402).json({
                            //refresh 토큰 오류
                            code: 402,
                            message: '유효하지 않은 Refresh 토큰입니다.'
                        });
                    }
                }
            }
            return res.status(401).json({
                //Access 토큰 만료, Refresh 토큰 헤더에 없음
                code: 401,
                message: 'access 토큰이 만료되었습니다.'
            });
        }
        return res.status(401).json({
            //Access 토큰 오류
            code: 411,
            message: '유효하지 않은 Access 토큰입니다.'
        });
    }
};

export const verfiyForSocket = async (token) =>{
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await database.user.findUnique({
            where: {
                email: decoded.email,
            }
        });

        if (!user) throw { status: 404, msg: "not found : user" };

        return user.email;

    } catch (error) {
        // 인증 실패
        // 유효시간이 초과된 경우
        if (error.name === "TokenExpiredError") {
            console.log(err);
        }
        // 토큰의 비밀키가 일치하지 않는 경우
        if (error.name === "JsonWebTokenError") {
            console.log(err);
        }
    }
}