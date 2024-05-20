import database from "../../database";
import { getNowTime } from "../../utils/getKSTTime";

export class SocketService {
    // payload : roomId, userEmail, limit
    async updateChatReadCount(payload) {
        const updatedChats = await database.chatting.updateMany({
            where: {
                OR : [
                    {
                        roomId: payload.roomId,
                        NOT : {
                            userEmail : payload.userEmail,
                        },
                        readCount: 1
                    },
                    {
                        roomId : payload.roomId,
                        userEmail : null,
                        readCount : 1
                    }
                ],        
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
            include: {
                event: true,
            }
        });

        if (!isExist) return undefined;

        const msg = await database.$transaction(async (db) => {
            if (isExist.content === "content-is-random-event") {
                const event = await db.event.delete({
                    where: {
                        id: isExist.event.id
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

    // friend
    async createChat(payload) {
        let joinOpp;

        const user = await database.user.findUnique({
            where: {
                email: payload.userEmail,
            }
        });

        if (payload.friend) {
            joinOpp = await database.joinRoom.findFirst({
                where: {
                    roomId: payload.roomId,
                    userEmail: payload.friend.userEmail,
                }
            });

        }
        const chat = await database.$transaction(async (db) => {
            // 만약 차단이 안 되어있고, join이 faluse시에 다시 참여시킴.
            if (payload.friend.status === true) {
                if (joinOpp.join === false) {
                    await db.joinRoom.update({
                        where: {
                            id: joinOpp.id,
                        },
                        data: {
                            join: true,
                        }
                    });

                    await db.chatting.create({
                        data: {
                            roomId: payload.roomId,
                            userEmail: joinOpp.userEmail,
                            content: `${joinOpp.userEmail}님이 방을 떠났습니다.`,
                            createdAt: getNowTime(),
                            readCount: 0,
                            type: "out",
                        }
                    });
                }
            }
            const chat = await db.chatting.create({
                data: {
                    roomId: payload.roomId,
                    content: payload.content,
                    userEmail: payload.userEmail,
                    readCount: payload.readCount,
                    nickName: user.nickname,
                    createdAt: getNowTime(),
                }
            });

            chat.event = null;
            
            return chat;
        });
        return chat;
    }

    async getJoinCount(payload) {
        const isExist = await database.joinRoom.count({
            where: {
                roomId: payload.roomId,
                join: true,
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
    // friend
    async createEvent(payload) {

        const user = await database.user.findUnique({
            where: {
                email: payload.userEmail,
            }
        });

        let joinOpp;

        if (payload.friend) {
            joinOpp = await database.joinRoom.findFirst({
                where: {
                    roomId: payload.roomId,
                    userEmail: payload.friend.userEmail,
                }
            });

        }

        const message = await database.$transaction(async (db) => {
            if (payload.friend.status === true) {
                await db.joinRoom.update({
                    where: {
                        id: joinOpp.id,
                    },
                    data: {
                        join: true,
                    }
                });
            }

            const oppUser = await db.joinRoom.findFirst({
                include: {
                    user: {
                        select: {
                            nickname: true,
                        }
                    }
                },
                where: {
                    roomId: payload.roomId,
                    NOT: {
                        userEmail: payload.userEmail,
                    },
                },
            });

            const msg = await db.chatting.create({
                data: {
                    content: "퀴즈를 보냈습니다.",
                    userEmail: payload.userEmail,
                    roomId: payload.roomId,
                    readCount: payload.readCount,
                    userName: payload.userName,
                    nickName: user.nickname,
                    type: "event",
                    createdAt: getNowTime(),
                }
            });

            const event = await db.event.create({
                data: {
                    chattingId: msg.id,
                    category: payload.categoryId,
                    user1: user.nickname,
                    user2: oppUser.user.nickname,
                    createdAt: getNowTime(),
                    user1Choice : "아직 선택하지 않았습니다",
                    user2Choice : "아직 선택하지 않았습니다",
                }
            });

            if (!msg) throw { status: 500, msg: "not created : msg" };
            if (!event) throw { status: 500, msg: "not created : event" };

            const msgWithEvent = await db.chatting.findUnique({
                where: {
                    id: msg.id,
                },
                include: {
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

        if (!opp) return { connectRoomId: null };

        // 지금 채팅방에 접속해있지 않은 상대 유저의 토큰
        const socket = await database.userSocketToken.findFirst({
            where: {
                userEmail: opp.userEmail,
            }
        });

        return socket;
    }

    async checkSmall(payload) {
        const small = await database.smallCategory.findUnique({
            where: {
                name: payload.small
            }
        });

        if (!small) throw { status: 404, msg: "not found : smallCategory" };

        return small;
    }

    // userEmail, roomId
    // 상대가 나를 차단했는 지 확인하는 절차
    async getFriend(payload) {
        // 일단 친구를 찾아야 함.
        const joinOthers = await database.joinRoom.findFirst({
            where: {
                roomId: payload.roomId,
                NOT: {
                    userEmail: payload.userEmail,
                }
            }
        });

        if (!joinOthers) return undefined;

        const friend = await database.friend.findFirst({
            where: {
                userEmail: joinOthers.userEmail,
                oppEmail: payload.userEmail,
            }
        });

        if (!friend) return undefined;

        return friend;
    }

    // { oppEmail, roomId }
    async changeJoinToTrueOpp(payload) {
        // joinRoom의 join을 true로 바꿔서 방에 다시 참여시킴
        await database.joinRoom.update({
            where: {
                userEmail: payload.oppEmail,
                roomId: payload.roomId,
            },
            data: {
                join: true,
            }
        });
    }

    async updateAnswer(payload) {
        const isExists = await database.event.findUnique({
            where: {
                id: payload.id,
            }
        });

        const user = await database.user.findUnique({
            where : {
                email : payload.userEmail,
            }
        });

        if (!isExists) throw { status: 404, msg: "not found : event" };


        const updatedEvent = await database.$transaction(async (db) => {
            let event;

            if (isExists.user1 === user.nickname) {
                event = await db.event.update({
                    where: {
                        id: isExists.id,
                    },
                    data: {
                        user1Choice: payload.content,
                    }
                });
            } else if (isExists.user2 === user.nickname) {
                event = await db.event.update({
                    where: {
                        id: isExists.id,
                    },
                    data: {
                        user2Choice: payload.content,
                    }
                });
            } else {
                throw { status: 400, msg: "bad request" };
            }

            event = await db.event.findUnique({
                where: {
                    id: isExists.id
                },
                include: {
                    smallCategory: {
                        include: {
                            eventImage: {
                                select: {
                                    filepath: true,
                                }
                            },
                        }
                    },
                    // eventUser1 : {
                    //     select : {
                    //         nickname : true,
                    //         email : true,
                    //         userImage : true,
                    //     }
                    // },
                    // eventUser2 : {
                    //     select : {
                    //         nickname : true,
                    //         email : true,
                    //         userImage : true,
                    //     }
                    // }
                }
            });

            return event;
        });

        console.log(updatedEvent);

        return updatedEvent;
    }
}