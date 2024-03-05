import database from "../../database";

export class SocketService {
    db;

    setDB(db) {
        this.db = db;
        this.updateChatReadCount.bind(this);
        this.updateNoContent.bind(this);
        this.createEvent.bind(this);
        this.setDB.bind(this);
    }

    // payload : roomId, userEmail, limit
    async updateChatReadCount(payload) {

        const updatedChats = await this.db.chatting.updateMany({
            where: {
                roomId: payload.roomId,
                userEmail: { not: payload.userEmail },
                readCount: 1
            },
            data: {
                readCount: 0
            },
        });

        const chats = await this.db.chatting.findMany({
            select: {
                id: true,
                readCount: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: updatedChats.count,
        })

        return chats;

    }

    async updateNoContent(payload) {

        const isExist = await this.db.chatting.findUnique({
            where: {
                id: payload.chatId,
            }
        });

        if (!isExist) return undefined;

        const msg = await this.db.chatting.update({
            where: {
                id: isExist.id,
            },
            data: {
                content: "더 이상 읽을 수 없는 메시지입니다.",
            },
        });

        return msg;

    }


    // id Int @id @default(autoincrement())
    // chattingId Int @db.Int 
    // category Int @db.Int
    // userContent String @db.Text
    // oppContent String @db.Text

    // small category 선택하고, 채팅 만들고, 이벤트 만들고, 이미지 in 이벤트 만들어고나서, 채팅, 이벤트 아이디 정보 반환
    async createEvent(payload) {

        const user = await this.db.user.findUnique({
            where: {
                email: payload.userEmail
            }
        });

        const msg = await this.db.chatting.create({
            data: {
                content: "content-is-random-event",
                userEmail: payload.userEmail,
                roomId: payload.roomId,
                readCount: payload.readCount,
                userName: payload.userName,
            }
        });


        const event = await this.db.event.create({
            data: {
                chattingId: msg.id,
                category: payload.categoryId,
            }
        });

        const images = await this.db.eventImage.findMany({
            where: {
                smallCategoryId: payload.categoryId,
            }
        });

        images.forEach(async (image) => {
            const imageEvent = await this.db.imageInEvent.create({
                data: {
                    file: image.filename,
                    eventId: event.id,
                }
            });
        });


        const msgWithEvent = await this.db.chatting.findUnique({
            where: {
                id: msg.id,
            },
            include: {
                event: {
                    include: {
                        smallCategory: true,
                        image: true,
                    }
                },
            }
        });

        return msgWithEvent;

    }

    async createOrUpdateSocket(payload) {
        const isExist = await this.db.userSocketToken.findFirst({
            where: {
                userEmail: payload.userEmail,
            }
        });

        if (!isExist) {
            await this.db.userSocketToken.create({
                data: {
                    userEmail: payload.userEmail,
                    socket: payload.socket,
                }
            });
        } else {
            await this.db.userSocketToken.update({
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

        const isExist = await this.db.userSocketToken.findFirst({
            where: {
                socket: payload.socket,
            }
        });

        if (!isExist) {
            console.log("존재하지 않는다.");
        }

        await this.db.userSocketToken.update({
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

        const opp = await this.db.joinRoom.findFirst({
            where: {
                roomId: payload.roomId,
                NOT: {
                    userEmail: payload.userEmail
                }
            }
        });

        if (!opp) return null;

        const socketToken = await this.db.userSocketToken.findUnique({
            where: {
                userEmail: opp.userEmail,
                connectRoomId: payload.roomId
            }
        });

        return socketToken;

    }
}