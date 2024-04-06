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
                        smallCategory: {
                            include : {
                                eventImage : {
                                    select : {
                                        filepath : true,
                                    }
                                }
                            }
                        }
                    }
                },
                user: {
                    select: { 
                        userImage: true,
                    }
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
                                                gender : true,
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
                                        id : true,
                                        reqUser : true,
                                        receive: {
                                            select: {
                                                email: true,
                                                nickname: true,
                                                userImage: true,
                                                gender : true,
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

                if(chat.room.publishing === "deleted") continue;
    
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
                        roomId : join.roomId,
                        join : true,
                    }
                });

                
                chat.notReadCounts = count;
    
                chat.room.joinCount = joinCount;

                chats.push(chat);
            }

            chats.sort((a, b) => {
                // 두 날짜를 Date 객체로 변환
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
              
                // 내림차순 정렬을 위해 b와 a를 비교
                return dateB - dateA;
              });

            return chats;

        });

        return lastChats;

    }

    async deleteChat(payload){
        await database.chatting.delete({
            where : {
                id : payload.id,
            }
        });
    }
}