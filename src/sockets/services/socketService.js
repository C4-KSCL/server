import database from "../../database";
import { getNowTime } from "../../utils/getKSTTime";

export class SocketService {
    // payload : roomId, userEmail, limit
    async updateChatReadCount(payload) {
        const updatedChats = await database.chatting.updateMany({
            where: {
                roomId: payload.roomId,
                userEmail: { not: payload.userEmail },
                readCount: 1
            },
            data: {
                readCount: 0
            },
        });

    }

    async updateNoContent(payload) {

        const isExist = await database.chatting.findUnique({
            where: {
                id: payload.chatId,
            },
            include : {
                event: true,
            }
        });

        if (!isExist) return undefined;

        const msg = await database.$transaction(async(db)=>{
            if(isExist.content === "content-is-random-event"){
                const event = await db.event.delete({
                    where : {
                        id : isExist.event.id
                    }
                });
            }
            const msg = await db.chatting.update({
                where: {
                    id: isExist.id,
                },
                data: {
                    content: "더 이상 읽을 수 없는 메시지입니다.",
                },
            });
            return msg;
        });

        return msg;
    }

    async createChat(payload) {

        const chat = await database.chatting.create({
            data: {
                roomId: payload.roomId,
                content: payload.content,
                userEmail: payload.userEmail,
                readCount: payload.readCount,
                createdAt : getNowTime(),
            }
        });

        return chat;
    }

    async getJoinCount(payload) {
        const isExist = await database.joinRoom.count({
            where: {
                roomId : payload.roomId,
                join : true,
            }
        });

        if (!isExist) throw { status: 404, msg: "not found : room" };

        return isExist;
    }

    // id Int @id @default(autoincrement())
    // chattingId Int @db.Int 
    // category Int @db.Int
    // userContent String @db.Text
    // oppContent String @db.Text

    // small category 선택하고, 채팅 만들고, 이벤트 만들고, 이미지 in 이벤트 만들어고나서, 채팅, 이벤트 아이디 정보 반환
    async createEvent(payload) {

        const user = await database.user.findUnique({
            where : {
                email : payload.userEmail,
            }
        });

        const message = await database.$transaction(async (db) => {
            const oppUser = await db.joinRoom.findFirst({
                include : {
                    user :{
                        select : {
                            nickname : true,
                        }
                    }
                },
                where : {
                    roomId : payload.roomId,
                    NOT : {
                        userEmail : payload.userEmail,
                    },
                },
            });

            const msg = await db.chatting.create({
                data: {
                    content: "content-is-random-event",
                    userEmail: payload.userEmail,
                    roomId: payload.roomId,
                    readCount: payload.readCount,
                    userName: payload.userName,
                    createdAt : getNowTime(),
                }
            });

            const event = await db.event.create({
                data: {
                    chattingId: msg.id,
                    category: payload.categoryId,
                    user1 : user.nickname,
                    user2 : oppUser.user.nickname,
                    createdAt : getNowTime(),
                }
            });

            if (!msg) throw { status: 500, msg: "not created : msg" };
            if (!event) throw { status : 500, msg : "not created : event" };

            const msgWithEvent = await db.chatting.findUnique({
                where: {
                    id: msg.id,
                },
                include: {
                    event: {
                        include: {
                            smallCategory: {
                                include : {
                                    eventImage : {
                                        select : {
                                            filepath : true,
                                        }
                                    }
                                }
                            },
                            eventUser1 : {
                                select : {
                                    email : true,
                                    nickname : true,
                                    userImage : true,
                                }
                            },
                            eventUser2 : {
                                select : {
                                    email : true,
                                    nickname : true,
                                    userImage : true,
                                }
                            },
                        },
                    },
                }
            });

            return msgWithEvent;
        });

        return message;
    }

    async createOrUpdateSocket(payload) {

        const isExist = await database.userSocketToken.findFirst({
            where: {
                userEmail: payload.userEmail,
            }
        });

        if (!isExist) {
            await database.userSocketToken.create({
                data: {
                    userEmail: payload.userEmail,
                    socket: payload.socket,
                }
            });
        } else {
            await database.userSocketToken.update({
                where: {
                    userEmail: isExist.userEmail,
                },
                data: {
                    socket: payload.socket,
                    connectRoomId: payload.roomId,
                }
            });
        }
    }

    async updateUserSocketToNull(payload) {

        const isExist = await database.userSocketToken.findFirst({
            where: {
                socket: payload.socket,
            }
        });

        if (!isExist) {
            console.log("존재하지 않는다.");
        }

        await database.userSocketToken.update({
            where: {
                userEmail: isExist.userEmail,
            },
            data: {
                socket: null,
                connectRoomId: null,
            },
        });



    }

    // payload : roomId, userEmail
    async getOppSocket(payload) {

        const opp = await database.joinRoom.findFirst({
            where: {
                roomId: payload.roomId,
                NOT: {
                    userEmail: payload.userEmail
                }
            }
        });

        if (!opp) return undefined;

        const socketToken = await database.userSocketToken.findUnique({
            where: {
                userEmail: opp.userEmail,
                connectRoomId: payload.roomId
            }
        });

        return socketToken;

    }

    async checkSmall(payload){
        const small = await database.smallCategory.findUnique({
            where : {
                name : payload.small
            }
        });

        if(!small) throw { status : 404, msg: "not found : smallCategory" };

        return small;
    }
}