import database from "../../../database";
import { getNowTime } from "../../../utils/getKSTTime";

export class FriendService {

    async getFriendsByEmail(userEmail) {
        try {
            const friends = await database.friend.findMany({
                include: {
                    friend: {
                        select: {
                            myMBTI: true,
                            myKeyword: true,
                            nickname: true,
                            userImage: true,
                            age: true,
                            gender: true,
                        }
                    },
                },
                where: {
                    userEmail: userEmail,
                    status: true,
                },

            });


            if (friends.length === 0) return friends;

            const userFriends = await database.$transaction(async (db) => {
                for (const friend of friends) {
                    const request = await db.addRequest.findFirst({
                        where : {
                            status : "accepted",
                            OR : [
                                {
                                    reqUser : friend.userEmail,
                                    recUser : friend.oppEmail
                                },
                                {
                                    reqUser : friend.oppEmail,
                                    recUser : friend.userEmail
                                }
                            ]
                        }
                    });

                    if(!request){
                        friend.room = null;
                    }else{
                        friend.room = await db.joinRoom.findFirst({
                            select: {
                                roomId: true,
                            },
                            where: {
                                roomId: request.roomId,
                                userEmail: userEmail,
                                join: true,
                            }
                        });
                    }
                    // if(request){
                    //     const room = await db.room.findUnique({
                    //         where : {
                    //             id : request.roomId,
                    //             publishing : "true",
                    //         },
                    //         select : {
                    //             id : true
                    //         }
                    //     }); 
                    //     friend.room = room;
                    // }

                }

                return friends;

            });

            return userFriends;
        } catch (err) {
            throw err;
        }

    }

    async deleteFriend(payload) {
        try {
            const isExistMy = await database.friend.findFirst({
                where: {
                    userEmail: payload.userEmail,
                    oppEmail: payload.oppEmail,
                }
            });

            const isExistOthers = await database.friend.findFirst({
                where: {
                    userEmail: payload.oppEmail,
                    userEmail: payload.userEmail,
                }
            });

            if (!isExistMy || !isExistOthers) throw { status: 404, msg: "not found : friend" };

            const request = await database.addRequest.findFirst({
                where: {
                    OR: [
                        {
                            reqUser: payload.oppEmail,
                            recUser: payload.userEmail,
                        },
                        {
                            recUser: payload.oppEmail,
                            reqUser: payload.userEmail,
                        }
                    ],
                    NOT: {
                        status: "ing",
                    }
                }
            });

            const joinRoomMy = await database.joinRoom.findFirst({
                where: {
                    userEmail: payload.userEmail,
                    roomId: request.roomId,
                },
            });

            const joinRoomOthers = await database.joinRoom.findFirst({
                where: {
                    userEmail: payload.oppEmail,
                    roomId: payload.roomId,
                }
            })

            await database.$transaction(async (db) => {
                await db.friend.deleteMany({
                    where: {
                        OR: [
                            {
                                id: isExistMy.id,
                            },
                            {
                                id: isExistOthers.id,
                            }
                        ],
                    }
                });

                await db.joinRoom.deleteMany({
                    where: {
                        OR: [
                            {
                                id: joinRoomMy.id,
                            },
                            {
                                id: joinRoomOthers.id,
                            }
                        ]
                    }
                });

                await db.addRequest.delete({
                    where: {
                        id: request.id,
                    }
                });

                const room = await db.room.findUnique({
                    where: {
                        id: request.roomId,
                    }
                });

                if (room) {
                    await db.chatting.deleteMany({
                        where: {
                            roomId: room.id,
                        }
                    });
                    // 친구 삭제될 때 방도 같이 삭제
                    await db.room.delete({
                        where: {
                            id: request.roomId,
                        }
                    });
                }
            });
        } catch (err) {
            throw err;
        }

    }
}