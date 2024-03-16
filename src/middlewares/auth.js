import jwt from "jsonwebtoken";

import database from "../database";

export const verfiyForSocket = async (token) =>{
    try {
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        console.log("2.", decoded.email);

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