import database from "../../../database";

export class ChatService {

    // id Int @id @default(autoincrement())
    // roomId String @db.VarChar(100)
    // userName String @db.VarChar(50)
    // userEmail String @db.VarChar(50)
    // createdAt DateTime @default(now())
    // content String @db.Text
    // readCount Int @db.Int

    async getChats(payload) {

        const isExist = await database.room.findUnique({
            where: {
                id: payload.roomId,
            }
        });

        const join = await database.joinRoom.findFirst({
            where : {
                roomId : isExist.id,
                userEmail : payload.userEmail,
                join : true,
            }
        });

        if(!join) throw { status : 404, msg : "not found : join in get-chats" };

        const chats = await database.chatting.findMany({
            orderBy: {
                createdAt: "desc",
            },
            where: {
                roomId: isExist.id,
            },
            select: {
                id: true,
                roomId: true,
                nickName: true,
                userEmail: true,
                createdAt: true,
                content: true,
                readCount: true,
                event: {
                    include: {
                        smallCategory: true,
                        imageInEvent: true,
                    }
                },
                user: {
                    select: { userImage: true }
                }
            },
            skip: payload.skip,
            take: payload.take,
        });
        return chats;

    }

    async getLastChats(userEmail) {

        const chats = [];

        const joins = await database.joinRoom.findMany({
            where: {
                userEmail: userEmail,
                join : true,
            }
        });


        const requests = await database.addRequest.findMany({
            where: {
                recUser: userEmail,
                status: "ing"
            }
        });

        for (const request of requests) {
            joins.push(request);
        }

        // if (joins.length === 0) throw { status: 404, msg: "not found : join" };

        const lastChats = await database.$transaction(async(db)=>{
            for (const join of joins) {
                const chat = await db.chatting.findFirst({
                    orderBy: {
                        createdAt: "desc",
                    },
                    where: {
                        roomId: join.roomId,
                    },
                    include: {
                        room: {
                            include: {
                                joinRoom: {
                                    select: {
                                        user: {
                                            select: {
                                                email: true,
                                                nickname: true,
                                                userImage: true,
                                            }
                                        }
                                    },
                                    where: {
                                        NOT: {
                                            userEmail: join.userEmail,
                                        }
                                    },
                                },
                                addRequest: {
                                    select: {
                                        reqUser : true,
                                        receive: {
                                            select: {
                                                email: true,
                                                nickname: true,
                                                userImage: true,
                                            }
                                        }
                                    },
                                    where: {
                                        status: "ing",
                                        reqUser: userEmail,
                                    }
                                }
                            }
                        }
                    }
                });
    
                const count = await db.chatting.count({
                    where: {
                        roomId: join.roomId,
                        readCount: 1,
                        NOT: {
                            userEmail: userEmail,
                        }
                    }
                });

                const joinCount = await db.joinRoom.count({
                    where : {
                        roomId : join.roomId
                    }
                });

                
                chat.notReadCounts = count;
    
                chat.room.joinCount = joinCount;

                chats.push(chat);
            }

            chats.sort((chat)=>(chat.createdAt)).reverse();

            return chats;

        });

        return lastChats;

    }
}