import database from "../../../database";

export class RequestService {
    db;

    setDB(db) {
        this.db = db;
        this.createRequest.bind(this);
        this.checkRequest.bind(this);
        this.getRequest.bind(this);
        this.getRequests.bind(this);
        this.deleteRequest.bind(this);
        this.checkUser.bind(this);
        this.setDB.bind(this);
    }
    // roomId String @id @db.VarChar(100)
    // reqUser String @db.VarChar(50)
    // recUser String @db.VarChar(50)
    async createRequest(payload) {

        const request = await this.db.addRequest.create({
            data: {
                roomId: payload.roomId,
                reqUser: payload.reqUser,
                recUser: payload.recUser,
            },
        });
        return request;
    }

    async checkUser(userEmail){
        const user = await this.db.user.findUnique({
            where : {
                email : userEmail,
            }
        });

        if(!user) throw {status : 404, msg : "not found : user"};
    }

    async getRequests(payload) {
        let requests;

        if (payload.reqUser) {
            requests = await this.db.addRequest.findMany({
                where: {
                    reqUser: payload.userEmail,
                    status: payload.status,
                },
                include: {
                    room: {
                        include : {
                            chatting : {
                                select : {
                                    content : true,
                                }
                            },
                        }
                    },
                    receive : {
                        select : {
                            myMBTI : true,
                            myKeyword : true,
                            nickname : true,
                            userImage : true,
                            age : true,
                        }
                    }
                },
                
            });
        } else if (payload.recUser) {
            requests = await this.db.addRequest.findMany({
                where: {
                    recUser: payload.userEmail,
                    status: payload.status
                },
                include: {
                    room: {
                        include : {
                            chatting : {
                                select : {
                                    content : true,
                                }
                            },
                        }
                    },
                    request : {
                        select : {
                            myMBTI : true,
                            myKeyword : true,
                            nickname : true,
                            userImage : true,
                            age : true,
                        }
                    }
                },
            });
        }
        return requests;
    }

    // payload : reqUser, recUser
    async checkRequest(payload) {
        const isExist = await this.db.addRequest.findFirst({
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

            if (isExist.status === "rejected") return;

            throw { status: 400, msg: "already exist : request" };
        }
    }

    async getRequest(requestId) {

        const request = await this.db.addRequest.findUnique({
            where: {
                id: requestId,
            }
        });

        if (!request) throw { status: "404", msg: "not found : request" };

        return request;
    }

    async deleteRequest(requestId) {
        const isExist = await this.db.addRequest.findUnique({
            where: {
                id: requestId,
            }
        });

        if (!isExist) throw { status: 404, msg: "not found : request" };

        await database.addRequest.delete({
            where: {
                id: requestId,
            },
        });

    }

    async udpateRejectRequest(requestId) {
        const request = await this.db.addRequest.update({
            where: {
                id: requestId,
            },
            data: {
                status: "rejected",
            },
        });

        return request;
    }

    async updatedAcceptRequest(requestId) {
        const request = await this.db.addRequest.update({
            where: {
                id: requestId
            },
            data: {
                status: "accepted",
            },
        });

        return request;
    }
}