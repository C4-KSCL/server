import database from "../../../database";
import { getNowTime } from "../../../utils/getKSTTime";

export class RoomService {

    // 방 만듬 -> 유저 조인 -> 상대 조인 # 트랜잭션
    // { room: new CreateRoomDTO(), userEmail: userEmail, oppEmail : oppEmail }
    async createRoom(payload) {
        const request = await database.addRequest.findFirst({
            where: {
                OR: [
                    {
                        reqUser: payload.userEmail,
                        recUser: payload.oppEmail,
                    },
                    {
                        recUser: payload.userEmail,
                        reqUser: payload.oppEmail,
                    }
                ],
                status: "accepted",
            }
        });

        const createdRoom = await database.$transaction(async (db) => {
            const room = await db.room.create({
                data: {
                    id: payload.room.id,
                    name: payload.room.id,
                    publishing: "true",
                    createdAt : getNowTime(),
                }
            });

            const userJoin = await db.joinRoom.create({
                data: {
                    userEmail: payload.userEmail,
                    roomId: room.id,
                    createdAt : getNowTime(),
                }
            });

            const oppJoin = await db.joinRoom.create({
                data: {
                    userEmail: payload.oppEmail,
                    roomId: room.id,
                    createdAt : getNowTime(),
                    status : payload.blocking,
                }
            });

            await db.addRequest.update({
                where: {
                    id: request.id,
                },
                data: {
                    roomId: room.id,
                }
            });

            return room;
        });

        return createdRoom;
    }

    async checkUser(payload) {
        const isExistOppUser = await database.user.findUnique({
            where: {
                email: payload.oppEmail
            },
        });

        if (!isExistOppUser) throw { status: 404, msg: "not found : oppEmail in create-room" };
    }

    async getRooms(payload) {

        const rooms = [];

        const joinRooms = await database.joinRoom.findMany({
            where: {
                userEmail: payload.userEmail,
                join: true,
            }
        });

        for (let join of joinRooms) {
            const room = await database.room.findUnique({
                where: {
                    id: join.roomId
                }
            });

            if (room.publishing === "true") {
                const room = await database.room.findFirst({
                    where: {
                        id: join.roomId
                    },
                    include: {
                        joinRoom: {
                            where: {
                                NOT: {
                                    userEmail: join.userEmail,
                                }
                            },
                            select: {
                                id: true,
                                roomId: true,
                                join : true,
                                user: {
                                    select: {
                                        email: true,
                                        nickname: true,
                                        userImage: true,
                                    }
                                },
                            }
                        },

                    }
                });
                rooms.push(room);
            } else if (room.publishing === "ing") {
                const room = await database.room.findFirst({
                    where: {
                        id: join.roomId
                    },
                    include: {
                        addRequest: {
                            select: {
                                receive: {
                                    select: {
                                        email: true,
                                        nickname: true,
                                        userImage: true,
                                    }
                                }
                            }
                        },
                    }
                });
                rooms.push(room);
            }
        }

        return rooms;

    }

    // // 방 퇴장 -> 요청이 있으면 삭제 # 트랜잭션
    // {userEmail, roomId, joinCount,joinId}
    async leaveRoom(payload) {

        const message = await database.$transaction(async (db) => {
            await db.joinRoom.update({
                where: {
                    id: payload.joinId
                },
                data: {
                    join: false
                }
            });

            const msg = await db.chatting.create({
                data: {
                    roomId: payload.roomId,
                    userEmail: payload.userEmail,
                    content: `${payload.userEmail}님이 방을 떠났습니다.`,
                    createdAt : getNowTime(),
                    readCount : payload.joinCount - 1,
                    type : "out",
                }
            });

            if (payload.joinCount === 1) {
                await db.room.update({
                    where: {
                        id: payload.roomId
                    },
                    data: {
                        publishing: "deleted",
                    }
                });
            }

            return msg;
        });
        return message;
    }

    async getJoinCount(payload) {

        const isExist = await database.joinRoom.count({
            where: {
                roomId: payload.roomId,
                join : true,
            }
        });

        if (!isExist) throw { status: 404, msg: "not found : room" };

        return isExist;

    }

    // id String @id @db.VarChar(100)
    // name String @db.VarChar(100)
    // joinCount Int @db.Int
    // createdAt DateTime @default(now())
    // publishing String @db.VarChar(10) @default("ing")
    async updateRoom(payload) {

        const isExist = await database.room.findUnique({
            where: {
                id: payload.roomId,
            }
        });

        if (!isExist) throw { stauts: 404, msg: "not found : room" };

        const room = await database.room.update({
            where: {
                id: payload.roomId,
            },
            data: {
                joinCount: payload.joinCount,
                name: payload.name,
                publishing: payload.publishing,
            }
        });

        return room;

    }

    // payload : userEmail, oppEmail
    async findJoinRoom(payload) {

        const request = await database.addRequest.findFirst({
            where: {
                OR: [
                    {
                        reqUser: payload.userEmail,
                        recUser: payload.oppEmail,
                    },
                    {
                        recUser: payload.userEmail,
                        reqUser: payload.oppEmail,
                    }
                ],
            }
        });

        if (!request) throw { status: 404, msg: "not found : request in find-room" };

        if (request.roomId === null) return undefined;

        const joinRoom = await database.joinRoom.findFirst({
            where: {
                roomId: request.roomId,
                userEmail : payload.userEmail
            }
        });

        if (!joinRoom) throw { status: 404, msg: "not found : joinRoom in find-room" };

        const room = await database.room.findUnique({
            where: {
                id: request.roomId,
            }
        });

        if (!room) throw { status: 404, msg: "not found : room in findRoom" };

        if (joinRoom) return joinRoom;

        return undefined;
    }
    //id(joinRoom), roomId, userEmail, oppEmail, oppJoinId, blocking
    async changeToTrueJoin(payload) {

        const join = await database.$transaction(async (db) => {
            // 자신의 조인을 true로 바꿈.
            await db.joinRoom.update({
                where: {
                    id: payload.id,
                    roomId: payload.roomId
                },
                data: {
                    join: true
                }
            });

            await db.room.update({
                where: {
                    id: payload.roomId
                },
                data: {
                    publishing : "true"
                }
            });

            const join = await database.joinRoom.findUnique({
                where: {
                    id: payload.id
                }
            });

            return join;
        });

        return join;
    }

    // roomId, userEmail
    async checkJoin(payload) {
        const join = await database.joinRoom.findFirst({
            where: {
                roomId: payload.roomId,
                userEmail: payload.userEmail,
                join: true
            }
        });

        if (!join) throw { status: 404, msg: "not found : join in checkJoin" };

        return join;
    }

    async findBlocking(payload){

        // 상대의 기준으로 내가 차단이 됐는지 찾아내는 것임.
        const blocking = await database.friend.findFirst({
            where : {
                userEmail : payload.oppEmail,
                oppEmail : payload.userEmail,
            }
        });

        return blocking.status;
    }

}