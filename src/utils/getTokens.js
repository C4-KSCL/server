import database from "../database";

//payload : roomId, userEmail
export async function getTokens(payload){

    const tokens = await database.$transaction(async(db)=>{

        const oppUserJoins = await db.joinRoom.findMany({
            where : {
                roomId : payload.roomId,
                NOT : payload.userEmail,
            }
        });

        const tokens = [];

        for(const join of oppUserJoins){

            const token = await db.userSocketToken.findUnique({
                where : {
                    userEmail : join.userEmail
                }
            });

            tokens.push(token);
        }

        return tokens;
    });


}