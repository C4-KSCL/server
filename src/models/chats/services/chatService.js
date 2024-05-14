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
            where: {
                roomId: isExist.id,
                userEmail: payload.userEmail,
                join: true,
            }
        });

        if (!isExist || !join) throw { status: 404, msg: "not found : join in get-chats" };

        const out = await database.chatting.findFirst({
            orderBy: {
                createdAt: "desc"
            },
            where: {
                roomId: payload.roomId,
                type: "out",
                userEmail: payload.userEmail,
            }
        });

        let where;

        if (out) {
            let idRange;
            if (payload.chat === 0) {
                idRange = { gt: out.id };
            } else {
                idRange = { gt: out.id, lt: payload.chat };
            }
            where = {
                roomId: isExist.id,

                NOT: {
                    type: "out",
                },
                id : idRange,
            }
        } else {
            let idRange;
            if (payload.chat === 0) {
                idRange = { gte: payload.chat };
            } else {
                idRange = { lt: payload.chat };
            }
            where = {
                roomId: isExist.id,

                NOT: {
                    type: "out",
                },
                id: idRange,
            }
        }

        const chats = await database.chatting.findMany({
            orderBy: {
                createdAt: "desc",
            },
            where: where,
            select: {
                id: true,
                roomId: true,
                nickName: true,
                userEmail: true,
                createdAt: true,
                content: true,
                readCount: true,
                type: true,
                event: {
                    include: {
                        smallCategory: {
                            include: {
                                eventImage: {
                                    select: {
                                        filepath: true,
                                    }
                                }
                            }
                        }
                    }
                },
            },
            take: payload.take,
        });
        return chats;

    }

    async getLastChats(userEmail) {

        const chats = [];

        const joins = await database.joinRoom.findMany({
            where: {
                userEmail: userEmail,
                join: true,
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

        const lastChats = await database.$transaction(async (db) => {
            for (const join of joins) {
                if (join.reqUser) {
                    join.userEmail = userEmail;
                }

                const out = await db.chatting.findFirst({
                    orderBy: {
                        createdAt: "desc",
                    },
                    where: {
                        roomId: join.roomId,
                        type: "out"
                    }
                });
                let where;
                if (out) {
                    where = {
                        roomId: join.roomId,
                        id: {
                            gt: out.id,
                        },
                        NOT: {
                            type: "out"
                        }
                    }
                } else {
                    where = {
                        roomId: join.roomId,
                        NOT: {
                            type: "out"
                        }
                    }
                }
                const chat = await db.chatting.findFirst({
                    orderBy: {
                        createdAt: "desc",
                    },
                    where: where,
                    include: {
                        room: {
                            include: {
                                joinRoom: {
                                    select: {
                                        join: true,
                                        user: {
                                            select: {
                                                email: true,
                                                nickname: true,
                                                userImage: true,
                                                gender: true,
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
                                        id: true,
                                        reqUser: true,
                                        receive: {
                                            select: {
                                                email: true,
                                                nickname: true,
                                                userImage: true,
                                                gender: true,
                                            }
                                        }
                                    },
                                    where: {
                                        status: "ing",
                                    }
                                }
                            }
                        }
                    }
                });

                if (!chat) continue;

                if (chat.room.publishing === "deleted") continue;
                if (out) {
                    where = {
                        roomId: join.roomId,
                        readCount: 1,
                        NOT: {
                            userEmail: userEmail,
                            type: "out"
                        },
                        id: {
                            gt: out.id,
                        }
                    }
                } else {
                    where = {
                        roomId: join.roomId,
                        readCount: 1,
                        NOT: {
                            userEmail: userEmail,
                            type: "out"
                        }
                    }
                }

                const count = await db.chatting.count({
                    orderBy: {
                        createdAt: "desc"
                    },
                    where: where
                });

                const joinCount = await db.joinRoom.count({
                    where: {
                        roomId: join.roomId,
                        join: true,
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

    async deleteChat(payload) {
        await database.chatting.delete({
            where: {
                id: payload.id,
            }
        });
    }
}