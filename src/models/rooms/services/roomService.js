import database from "../../../database";

export class RoomService {

    db;

    setDB(db) {
        this.db = db;
        this.createRoom.bind(this);
        this.createJoin.bind(this);
        this.getRooms.bind(this);
        this.getJoinCount.bind(this);
        this.checkJoin.bind(this);
        this.deleteJoin.bind(this);
        this.deleteRoom.bind(this);
        this.updateRoom.bind(this);
        this.setDB.bind(this);
    }

    // room
    // id String @id @db.VarChar(100)
    // name String @db.VarChar(100)
    // joinCount Int @db.Int
    // createdAt DateTime @default(now())
    // publishing String @db.VarChar(10) @default("ing")
    // 방의 이름이 없으면 방의 아이디와 같은 문자열을 가진다.
    async createRoom(payload) {

        const room = await this.db.room.create({
            data: {
                id: payload.id,
                name: payload.name,
                joinCount: 1,
            },
        });

        return room;


    }

    // id Int @id @default(autoincrement())
    // roomId String @db.VarChar(100)
    // userEmail String @db.VarChar(50)
    async createJoin(payload) {

        const isExist = await this.db.joinRoom.findFirst({
            where: {
                roomId: payload.roomId,
                userEmail: payload.userEmail,
            }
        });

        if (isExist) throw { status: 400, msg: "already exist : join" };

        const join = await this.db.joinRoom.create({
            data: {
                roomId: payload.roomId,
                userEmail: payload.userEmail,
            },
        });
        return join;


    }

    async getRooms(payload) {

        const rooms = [];

        const joinRooms = await this.db.joinRoom.findMany({
            where: {
                userEmail: payload.userEmail,
            }
        });

        for (let join of joinRooms) {
            const room = await this.db.room.findFirst({
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
                                    image: true,
                                }
                            }

                        }

                    }
                }
            });
            rooms.push(room);
        }

        return rooms;

    }

    async getJoinCount(payload) {

        const isExist = await this.db.room.findUnique({
            where: {
                id: payload.roomId,
            }
        });

        if (!isExist) throw { status: 404, msg: "not found : room" };

        return isExist.joinCount;


    }

    async checkJoin(payload) {

        const isExist = await this.db.joinRoom.findFirst({
            where: {
                roomId: payload.roomId,
                userEmail: payload.userEmail,
            }
        });

        if (!isExist) return false;
        return true;


    }

    async deleteJoin(payload) {

        const isExist = await this.db.joinRoom.findMany({
            where: {
                roomId: payload.roomId,
                userEmail: payload.userEmail,
            }
        });

        if (!isExist) throw { stauts: 404, msg: "not found : join" };

        await database.joinRoom.deleteMany({
            where: {
                roomId: payload.roomId,
                userEmail: payload.userEmail,
            }
        });

    }

    async deleteRoom(payload) {

        const isExist = await this.db.room.findUnique({
            where: {
                id: payload.roomId,
            }
        });

        if (!isExist) throw { stauts: 404, msg: "not found : room" };

        await database.room.delete({
            where: {
                id: payload.roomId,
            },
        });

    }

    // id String @id @db.VarChar(100)
    // name String @db.VarChar(100)
    // joinCount Int @db.Int
    // createdAt DateTime @default(now())
    // publishing String @db.VarChar(10) @default("ing")
    async updateRoom(payload) {

        const isExist = await this.db.room.findUnique({
            where: {
                id: payload.roomId,
            }
        });

        if (!isExist) throw { stauts: 404, msg: "not found : room" };

        const room = await this.db.room.update({
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

}