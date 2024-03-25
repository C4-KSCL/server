import database from "../../../database";

export class RoomService {
    
    // 방 만듬 -> 유저 조인 -> 상대 조인 # 트랜잭션
    // { room: new CreateRoomDTO(), userEmail: userEmail, oppEmail : oppEmail }
    async createRoom(payload){
        const request = await database.addRequest.findFirst({
            where : {
                OR : [
                    {
                        reqUser : payload.userEmail,
                        recUser : payload.oppEmail,
                    },
                    {
                        recUser : payload.userEmail,
                        reqUser : payload.oppEmail,
                    }
                ],
                status : "accepted",
            }
        });

        const createdRoom = await database.$transaction(async(db)=>{
            const room = await db.room.create({
                data : {
                    id : payload.room.id,
                    name : payload.room.id,
                    publishing : "true",
                    joinCount : 2
                }
            });

            const userJoin = await db.joinRoom.create({
                data : {
                    userEmail : payload.userEmail,
                    roomId : room.id,
                }
            });

            const oppJoin = await db.joinRoom.create({
                data : {
                    userEmail : payload.oppEmail,
                    roomId : room.id,
                }
            });

            await db.addRequest.update({
                where : {
                    id : request.id,
                },
                data : {
                    roomId : room.id,
                }
            });

            return room;
        });

        return createdRoom;
    }

    async checkUser(payload){
        const isExistOppUser = await database.user.findUnique({
            where : {
                email : payload.oppEmail
            },
        });

        if(!isExistOppUser) throw { status : 404, msg : "not found : oppEmail in create-room"};
    }

    async getRooms(payload) {

        const rooms = [];

        const joinRooms = await database.joinRoom.findMany({
            where: {
                userEmail: payload.userEmail,
                join : true,
            }
        });

        for (let join of joinRooms) {
            const room = await database.room.findUnique({
                where : {
                    id : join.roomId
                }
            });

            if(room.publishing === "true"){
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
                                user: {
                                    select: {
                                        email: true,
                                        nickname: true,
                                        // userImage : true,
                                    }
                                },
                            }
                        },
                        
                    }
                });
                rooms.push(room);
            }else if(room.publishing === "ing"){
                const room = await database.room.findFirst({
                    where: {
                        id: join.roomId
                    },
                    include: {
                        addRequest : {
                            select : {
                                receive : {
                                    select : {
                                        email : true,
                                        nickname : true,
                                        // userImage : true,
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
    // {userEmail, roomId, joinCount, joinId}
    async leaveRoom(payload){

        console.log(payload.joinCount);

        await database.$transaction(async(db)=>{
            await db.joinRoom.update({
                where : {
                    id : payload.joinId
                },
                data : {
                    join : false
                }
            });

            await db.room.update({
                where : {
                    id : payload.roomId
                },
                data : {
                    joinCount : payload.joinCount-1,
                }
            });

            await db.addRequest.deleteMany({
                where : {
                    reqUser : payload.userEmail,
                    roomId : payload.roomId,
                    status : "ing",
                }
            });

            if(payload.joinCount === 1){
                await db.room.delete({
                    where : {
                        id : payload.roomId
                    }
                });
            }
        });
    } 

    async getJoinCount(payload) {

        const isExist = await database.room.findUnique({
            where: {
                id: payload.roomId,
            }
        });

        if (!isExist) throw { status: 404, msg: "not found : room" };

        return isExist.joinCount;

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
    async findRoom(payload){

        const request = await database.addRequest.findFirst({
            where : {
                OR : [
                    {
                        reqUser : payload.userEmail,
                        recUser : payload.oppEmail,
                    },
                    {
                        recUser : payload.userEmail,
                        reqUser : payload.oppEmail,
                    }
                ],
                status : "accepted",
            }
        });

        if(!request) throw { status : 404, msg : "not found : request in find-room" };

        if(request.roomId===null) return undefined;

        const joinRoom = await database.joinRoom.findFirst({
            where : {
                roomId : request.roomId
            }
        });

        if(!joinRoom) throw { status : 404, msg : "not found : joinRoom in find-room" };

        const room = await database.room.findUnique({
            where : {
                id : request.roomId,
            }
        });

        if(!room) throw { status : 404, msg : "not found : room in findRoom" };

        if(joinRoom) return joinRoom;

        return undefined;
    }
    //id(joinRoom), roomId, userEmail
    async changeToTrueJoin(payload){

        await database.$transaction(async(db)=>{
            await db.joinRoom.update({
                where : {
                    id : payload.id,
                    roomId : payload.roomId
                },
                data : {
                    join : true
                }
            });

            await db.room.update({
                where : {
                    id : payload.roomId
                },
                data : {
                    joinCount : payload.joinCount + 1,
                }
            });
        });

        const join = await database.joinRoom.findUnique({
            where : {
                id : payload.id
            }
        });
        
        return join;
    }   

    // roomId, userEmail
    async checkJoin(payload){
        const join = await database.joinRoom.findFirst({
            where : {
                roomId : payload.roomId,
                userEmail : payload.userEmail,
                join : true
            }
        });

        if(!join) throw { status : 404, msg : "not found : join in checkJoin" };

        return join;
    }

}