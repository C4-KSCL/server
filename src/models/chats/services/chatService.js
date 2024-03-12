import { TimeSeriesBucketTimestamp } from "redis";
import database from "../../../database";

export class ChatService {
    db;

    setDB(db) {
        this.db = db;
        this.createChat.bind(this);
        this.deleteChat.bind(this);
        this.getChats.bind(this);
        this.getLastChats.bind(this);
        this.setDB.bind(this);
    }

    // id Int @id @default(autoincrement())
    // roomId String @db.VarChar(100)
    // userName String @db.VarChar(50)
    // userEmail String @db.VarChar(50)
    // createdAt DateTime @default(now())
    // content String @db.Text
    // readCount Int @db.Int
    async createChat(payload) {

        const user = await this.db.user.findUnique({
            where: {
                email: payload.userEmail,
            },
        });

        const chat = await this.db.chatting.create({
            data: {
                roomId: payload.roomId,
                nickName: user.nickname,
                userEmail: user.email,
                content: payload.content,
                readCount: payload.readCount,
            },
        });
        return chat;

    }

    async deleteChat(payload) {

        const isExist = await this.db.chatting.findUnique({
            where: {
                id: payload.id
            }
        });

        if (!isExist) throw { status: 404, msg: "not found : chat" };

        await this.db.chatting.delete({
            where: {
                id: isExist.id,
            }
        });


    }

    async getChats(payload) {

        const isExist = await this.db.room.findUnique({
            where: {
                id: payload.roomId,
            }
        });

        if (!isExist) throw { status: 404, msg: "not found : join" };

        const chats = await this.db.chatting.findMany({
            orderBy: {
                createdAt: "desc",
            },
            where: {
                roomId: payload.roomId,
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
                        image: true,
                    }
                },
                user: {
                    select: { image: true }
                }
            },
            skip: payload.skip,
            take: payload.take,
        });
        return chats;

    }

    async getLastChats(userEmail) {

        const chats = [];

        const joins = await this.db.joinRoom.findMany({
            where: {
                userEmail: userEmail,
            }
        });

        if (joins.length === 0) throw { status: 404, msg: "not found : join" };

        for (const join of joins) {
            const chat = await this.db.chatting.findFirst({
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
                                select : {
                                    user : {
                                        select : {
                                            email : true,
                                            nickname : true,
                                        }
                                    }
                                },
                                where: {
                                    NOT: {
                                        userEmail: join.userEmail,
                                    }
                                },
                            }
                        }
                    }
                }
            });

            const count = await this.db.chatting.count({
                where : {
                    roomId : join.roomId,
                    readCount : 1,
                    NOT : {
                        userEmail : userEmail,
                    }
                }
            });

            chat.notReadCounts = count;

            chats.push(chat);
        }
        return chats;



    }

    async updateChatById(payload) {

        const isExist = await this.db.chatting.findUnique({
            where: {
                id: payload.chatId,
            }
        });

        if (!isExist) return null;

        if (isExist.readCount === 0) return isExist;

        const chat = await this.db.chatting.update({
            where: {
                id: isExist.id
            },
            data: {
                readCount: isExist.readCount - 1
            }
        });

        return chat;


    }

    async checkMyChatByIdUserEmail(payload) {

        const isExist = await this.db.chatting.findUnique({
            where: {
                id: payload.chatId,
                userEmail: payload.userEmail
            }
        });

        return isExist;

    }
}