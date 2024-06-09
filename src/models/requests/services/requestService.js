import database from "../../../database";
import { getNowTime } from "../../../utils/getKSTTime";

export class RequestService {
    // roomId String @id @db.VarChar(100)
    // reqUser String @db.VarChar(50)
    // recUser String @db.VarChar(50)


    //
    // 방만들기 -> 방 참가 -> 메시지입력 -> 요청 전송 # 트랜잭션
    // 요청을 보낼 때 나 뿐만 아니라 상대도 JoinRoom테이블에 데이터를 생성해야한다. 나는 JoinRoom의 join : true, 상대는 join : false
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
                    createdAt : getNowTime(),
                }
            });

            const joinRoom = await db.joinRoom.create({
                data: {
                    roomId: room.id,
                    userEmail: payload.userEmail,
                    createdAt : getNowTime(),
                }
            });

            const oppJoin = await db.joinRoom.create({
                data : {
                    roomId : room.id,
                    userEmail : payload.oppEmail,
                    join : false,
                    createdAt : getNowTime(),
                }
            });

            const chatting = await db.chatting.create({
                data: {
                    roomId: room.id,
                    nickName: user.nickname,
                    userEmail: user.email,
                    content: payload.content,
                    readCount: 1,
                    createdAt : getNowTime(),
                },
            });

            const request = await db.addRequest.create({
                data: {
                    roomId: room.id,
                    reqUser: user.email,
                    recUser: payload.oppEmail,
                    createdAt : getNowTime(),
                },
            });

            return request;
        });

        return madeRequest;
    }

    // payload : request object
    // 방 삭제 -> 요청 거절 업데이트 # 트랜잭션
    async deleteRoomAndRejectRequest(payload) {

        await database.$transaction(async (db) => {

            await db.addRequest.delete({
                where: {
                    id: payload.id,
                }
            });

            await db.room.delete({
                where: {
                    id: payload.roomId,
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
                OR : [
                    {
                        status : "ing",
                    },
                    {
                        status : "rejected",
                    }
                ]
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
                    OR : [
                        {
                            status : payload.status,
                        }
                    ]
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
                            userImage : true,
                            age: true,
                            gender : true,
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
                            userImage : true,
                            age: true,
                            gender : true,
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

        if (isExist) {
            if (isExist.status === "rejected" || isExist.status === "deleted") { return; }
            else if (isExist.status === "accepted") { throw { status: 400, msg: "already friend : request" }; }
            
            const msg = {
                error_msg : "already exist : request",
                requestId : isExist.id,
                reqUser : isExist.reqUser,
                recUser : isExist.recUser
            };

            throw { status: 400, msg: msg };
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

        // 나의 시점에서 상대와 친구
        const isExistMy = await database.friend.findFirst({
            where: {
                userEmail : payload.userEmail,
                oppEmail : payload.request.reqUser,
            }
        });

        // 상대 시점에서 나와의 친구
        const isExistOthers = await database.friend.findFirst({
            where : {
                userEmail : payload.request.reqUser,
                oppEmail : payload.userEmail,
            }
        });

        if (isExistMy && isExistOthers) throw { status: 400, msg: "already exists : friend" };

        const updatedRoom = await database.$transaction(async (db) => {

            const join = await db.joinRoom.findFirst({
                where : {
                    userEmail : payload.userEmail,
                    roomId : payload.request.roomId
                }
            });
            if(!isExistMy){
                await db.friend.create({
                    data: {
                        userEmail : payload.userEmail,
                        oppEmail : payload.request.reqUser,
                        createdAt : getNowTime(),
                    }
                });
            }

            if(!isExistOthers){
                await db.friend.create({
                    data : {
                        userEmail : payload.request.reqUser,
                        oppEmail : payload.userEmail,
                        createdAt : getNowTime(),
                    }
                });
            }

            await db.joinRoom.update({
                where: {
                    id : join.id
                },
                data : {
                    join : true,
                }
            });

            const room = await db.room.update({
                where: {
                    id: payload.request.roomId,
                },
                data: {
                    publishing: "true",
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

    // { request, id(request) }
    async deleteRoomAndRequest(payload) {
        let room;

        const myJoin = await database.joinRoom.findFirst({
            where : {
                roomId : payload.request.roomId,
                userEmail : payload.request.reqUser,
            }
        });

        const oppJoin = await database.joinRoom.findFirst({
            where : {
                roomId : payload.request.roomId,
                userEmail : payload.request.recUser,
            }
        });

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
            await db.addRequest.delete({
                where : {
                    id : payload.id
                }
            });

            // my join
            await db.joinRoom.delete({
                where : {
                    id : myJoin.id
                }
            });

            // opp join
            await db.joinRoom.delete({
                where : {
                    id : oppJoin.id
                }
            });

            await db.chatting.deleteMany({
                where : {
                    roomId : payload.request.roomId,
                }
            });

            if(room){
                await db.room.delete({
                    where: {
                        id: room.id,
                    }
                });
            }            
        });
    }

    // requestId, req, res
    async getOppSocket(payload) {
        const request = await database.addRequest.findUnique({
            where : {
                id : payload.requestId,
            }
        });

        if(!request) throw { status :404, msg : "not found : request in get opp socket" };

        let where;

        if(payload.req) {
            where = { userEmail : request.recUser };
        } else if(payload.rec) {
            where = { userEmail : request.reqUser };
        }

        const oppSocket = await database.userSocketToken.findUnique({
            where : where
        });

        if(!oppSocket) throw { status : 404, msg : "not found : userSocketToken in get opp socket" };

        return oppSocket;
    }

    async getUser(payload){
        const user = await database.user.findUnique({
            where : {
                email : payload.userEmail,
            }
        });

        return user;
    }
}