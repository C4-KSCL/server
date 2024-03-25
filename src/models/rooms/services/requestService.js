import database from "../../../database";

export class RequestService {
    // roomId String @id @db.VarChar(100)
    // reqUser String @db.VarChar(50)
    // recUser String @db.VarChar(50)


    //
    // 방만들기 -> 방 참가 -> 메시지입력 -> 요청 전송 # 트랜잭션
    // payload : {room : room object, content : content, oppEmail : oppEmail, userEmail : userEmail}
    async createRequest(payload) {
        const user = await database.user.findUnique({
            where: {
                email: payload.userEmail,
            }
        });

        const madeRequest = await database.$transaction(async (db) => {

            const room = await db.room.create({
                data: {
                    id: payload.room.id,
                    name: payload.room.id,
                    joinCount: 1,
                }
            });

            const joinRoom = await db.joinRoom.create({
                data: {
                    roomId: room.id,
                    userEmail: payload.userEmail,
                }
            });

            const chatting = await db.chatting.create({
                data: {
                    roomId: room.id,
                    nickName: user.nickname,
                    userEmail: user.email,
                    content: payload.content,
                    readCount: 1,
                },
            });

            const request = await db.addRequest.create({
                data: {
                    roomId: room.id,
                    reqUser: user.email,
                    recUser: payload.oppEmail,
                },
            });

            return request;
        });

        return madeRequest;
    }

    //
    // payload : request object
    // 방 삭제 -> 요청 거절 업데이트 # 트랜잭션
    async deleteRoomAndRejectRequest(payload) {

        await database.$transaction(async (db) => {
            await db.room.delete({
                where: {
                    id: payload.roomId,
                }
            });

            await db.addRequest.update({
                where: {
                    id: payload.id,
                },
                data: {
                    status: "rejected",
                }
            });
        });

    }

    //
    // userEmail, requestId
    async checkReceivedRequest(payload) {

        const request = await database.addRequest.findUnique({
            where: {
                id: payload.requestId,
                recUser: payload.userEmail,
            }
        });

        if (!request) throw { status: 400, msg: "don't have credential" };

    }

    //
    // userEmail, requestId
    async checkSendedRequest(payload) {

        const request = await database.addRequest.findUnique({
            where: {
                id: payload.requestId,
                reqUser: payload.userEmail,
            }
        });

        if (!request) throw { status: 400, msg: "don't have credential" };

    }

    //
    async checkUser(userEmail) {
        const user = await database.user.findUnique({
            where: {
                email: userEmail,
            }
        });

        if (!user) throw { status: 404, msg: "not found : user" };
    }

    //
    async getRequests(payload) {
        let requests;

        if (payload.reqUser) {
            requests = await database.addRequest.findMany({
                where: {
                    reqUser: payload.userEmail,
                    status: payload.status,
                },
                include: {
                    room: {
                        include: {
                            chatting: {
                                select: {
                                    content: true,
                                }
                            },
                        }
                    },
                    receive: {
                        select: {
                            myMBTI: true,
                            myKeyword: true,
                            nickname: true,
                            // userImage : true,
                            age: true,
                        }
                    }
                },

            });
        } else if (payload.recUser) {
            requests = await database.addRequest.findMany({
                where: {
                    recUser: payload.userEmail,
                    status: payload.status
                },
                include: {
                    room: {
                        include: {
                            chatting: {
                                select: {
                                    content: true,
                                }
                            },
                        }
                    },
                    request: {
                        select: {
                            myMBTI: true,
                            myKeyword: true,
                            nickname: true,
                            // userImage : true,
                            age: true,
                        }
                    }
                },
            });
        }
        return requests;
    }


    //
    // payload : reqUser, recUser
    async checkRequest(payload) {
        const isExist = await database.addRequest.findFirst({
            orderBy : {
                id : "desc",
            },
            where: {
                OR: [
                    {
                        reqUser: payload.reqUser,
                        recUser: payload.recUser,
                    },
                    {
                        recUser: payload.reqUser,
                        reqUser: payload.recUser,
                    }

                ]
            },
        });

        console.log(isExist);

        if (isExist) {
            if (isExist.status === "rejected" || isExist.status === "deleted") { return; }
            else if (isExist.status === "accepted") { throw { status: 404, msg: "already friend : reqeust" }; }

            throw { status: 400, msg: "already exist : request" };
        }
    }

    //
    async getRequest(requestId) {

        const request = await database.addRequest.findUnique({
            where: {
                id: requestId,
            }
        });

        if (!request) throw { status: "404", msg: "not found : request" };

        return request;
    }



    //
    // 친구 생성 -> 조인 생성 -> room update -> 요청 업데이트 -> socket 테이블 업데이트 # 트랜잭션
    // {userEmail : userEmail, request : request}
    async acceptRequest(payload) {
        const isExistFriend = await database.friend.findFirst({
            where: {
                OR: [
                    {
                        user1: payload.request.reqUser,
                        user2: payload.request.recUser
                    },
                    {
                        user2: payload.request.reqUser,
                        user1: payload.request.recUser
                    }
                ]
            }
        });

        if (isExistFriend) throw { status: 400, msg: "already exists : friend" };

        const updatedRoom = await database.$transaction(async (db) => {

            await db.friend.create({
                data: {
                    user1: payload.request.reqUser,
                    user2: payload.request.recUser,
                }
            });

            await db.joinRoom.create({
                data: {
                    roomId: payload.request.roomId,
                    userEmail: payload.userEmail
                }
            });

            const room = await db.room.update({
                where: {
                    id: payload.request.roomId,
                },
                data: {
                    publishing: "true",
                    joinCount: 2,
                }
            });

            await db.addRequest.update({
                where: {
                    id: payload.request.id
                },
                data: {
                    status: "accepted",
                },
            });

            return room;
        });

        return updatedRoom;
    }

    async createSocketToken(payload) {

        const isExist = await database.userSocketToken.findUnique({
            where: {
                userEmail: payload.userEmail,
            }
        });

        if (isExist) return;

        const userSocket = await database.userSocketToken.create({
            data: {
                userEmail: payload.userEmail,
            }
        });

    }

    //
    async deleteRoomAndRequest(payload) {
        let room;
        
        if(!payload.request.roomId){
            room = null;
        }else{
            room = await database.room.findUnique({
                where : {
                    id: payload.request.roomId
                }
            });
        }

        await database.$transaction(async (db) => {
            if(room){
                await db.room.delete({
                    where: {
                        id: room.id,
                    }
                });
            }            

            await db.addRequest.delete({
                where: {
                    id: payload.request.id
                }
            });
        });
    }
}