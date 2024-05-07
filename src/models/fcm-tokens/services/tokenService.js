import database from "../../../database";

export default class TokenService {

    // payload : user
    async checkToken(payload) {
        const token = await database.userSocketToken.findUnique({
            where: {
                userEmail: payload.user
            }
        });

        if (!token) {
            const token = await database.userSocketToken.create({
                data: {
                    userEmail: payload.user
                }
            });

            return token;
        }

        return token;
    }

    // payload : user, fcmToken
    async patchUploadToken(payload) {

        const token = await database.userSocketToken.update({
            where: {
                userEmail: payload.user,
            },
            data: {
                token: payload.fcmToken,
            }
        });

        if (token.token !== payload.fcmToken) throw { status: 500, msg: "failed to upload token to userSocketToken table" };

        return token;
    }

    // payload : user
    async patchNullToken(payload) {
        const token = await database.userSocketToken.update({
            where: {
                userEmail: payload.user,
            },
            data: {
                token: null,
            },
        });

        if(token.token !== null) throw { status : 500, msg : "failed changing to null in patch null token" };
    }

    async checkOrCreateSocketToken(payload) {
        const socketToken = await database.userSocketToken.findUnique({
            where : {
                userEmail : payload.user,
            }
        });

        if(!socketToken){
            const socketToken = await database.userSocketToken.create({
                data : {
                    userEmail : payload.user,
                }
            });
            return socketToken;
        }

        return socketToken;
    }
}