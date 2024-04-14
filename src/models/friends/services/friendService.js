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
                        where: {
                            status: "accepted",
                            OR: [
                                {
                                    reqUser: friend.userEmail,
                                    recUser: friend.oppEmail
                                },
                                {
                                    reqUser: friend.oppEmail,
                                    recUser: friend.userEmail
                                }
                            ]
                        }
                    });

                    if (!request) {
                        friend.room = null;
                    } else {
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

    // userEmail, oppEmail
    // 차단, 만약 참가한 room이 있다면 join을 false, 
    async blockFriend(payload) {

        // joinRoom을 찾음
        const friend = await database.friend.findFirst({
            where: {
                userEmail: payload.userEmail,
                oppEmail: payload.oppEmail,
            }
        });

        if (!friend) throw { status: 404, msg: "not found friend : block friend" };

        const request = await database.addRequest.findFirst({
            where: {
                OR: [
                    {
                        reqUser: payload.userEmail,
                        recUser: payload.oppEmail,
                    }, {
                        reqUser: payload.oppEmail,
                        recUser: payload.userEmail,
                    }
                ]
            }
        });

        if (!request) throw { status: 404, msg: "not found request : block friend" };

        const join = await database.joinRoom.findFirst({
            where: {
                roomId: request.roomId,
                userEmail: payload.userEmail,
                join: true,
            }
        });

        await database.$transaction(async (db) => {
            await db.friend.update({
                where: {
                    id: friend.id,
                },
                data: {
                    status: false,
                }
            });
            if (join) {
                await db.joinRoom.update({
                    where: {
                        id: join.id
                    },
                    data: {
                        join: false,
                    }
                });
                await db.chatting.create({
                    data: {
                        roomId: join.roomId,
                        userEmail: payload.userEmail,
                        content: `${payload.userEmail}님이 방을 떠났습니다.`,
                        createdAt: getNowTime(),
                        readCount: 0,
                        type: "out",
                    }
                });
            }
        });
    }

    // userEmail, oppEmail
    async unblockFriend(payload) {
        const friend = await database.friend.findFirst({
            where: {
                userEmail: payload.userEmail,
                oppEmail: payload.oppEmail,
                status: false,
            }
        });

        if (!friend) throw { status: 404, msg: "not found blocking friend : unblockFriend" };

        await database.friend.update({
            where: {
                id: friend.id,
            },
            data: {
                status: true,
            }
        });
    }

    async getblockingFriendsByEmail(userEmail) {
        const blockingFriends = await database.friend.findMany({
            where: {
                userEmail: userEmail,
                status: false,
            },
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
            }
        });

        return blockingFriends;
    }
}