import database from "../../../database";

export class FriendService {

    async getFriendsByEmail(userEmail){
        try{
            const friends = await database.friend.findMany({
                where : {
                    OR : [
                        {
                            user1 : userEmail,
                        },
                        {
                            user2 : userEmail,
                        }
                    ]
                },
            });

            if(friends.length === 0) return friends;

            const userFriends = await database.$transaction(async(db)=>{
                for(const friend of friends){
                    if(friend.user1 === userEmail){
                        friend.friend = await db.user.findUnique({
                            where : {
                                email : friend.user2
                            },
                            select : {
                                myMBTI : true,
                                myKeyword : true,
                                nickname : true,
                                userImage : true,
                                age : true,
                            }
                        });
                    } else if (friend.user2 === userEmail){
                        friend.friend = await db.user.findUnique({
                            where : {
                                email : friend.user1
                            },
                            select : {
                                myMBTI : true,
                                myKeyword : true,
                                nickname : true,
                                userImage : true,
                                age : true,
                            }
                        });
                    }

                    const request = await db.addRequest.findFirst({
                        where : {
                            status : "accepted",
                            OR : [
                                {
                                    reqUser : friend.user1,
                                    recUser : friend.user2
                                },
                                {
                                    reqUser : friend.user2,
                                    recUser : friend.user1
                                }
                            ]
                        }
                    });

                    if(request){
                        const room = await db.room.findUnique({
                            where : {
                                id : request.roomId
                            },
                            select : {
                                id : true
                            }
                        }); 
                        friend.room = room;
                    }
    
                }
    
                return friends;

            });

            return userFriends;
        }catch(err){
            throw err;
        }
        
    }
    
    async deleteFriend(payload){
        try{
            const isExist = await database.friend.findFirst({
                where : {
                    OR : [
                        {
                            user1 : payload.userEmail,
                            user2 : payload.oppEmail,
                        },
                        {
                            user1 : payload.oppEmail,
                            user2 : payload.userEmail,
                        }
                    ]
                }
            });
            
            if(!isExist) throw { status : 404, msg : "not found : friend" };
    
            const request = await database.addRequest.findFirst({
                where : {
                    OR : [
                        {
                            reqUser : payload.oppEmail,
                            recUser : payload.userEmail,
                        },
                        {
                            recUser : payload.oppEmail,
                            reqUser : payload.userEmail,
                        }
                    ],
                    NOT : {
                        status : "ing",
                    }
                }
            });

            // 내가 왜 여기서 복수형을 택했을까?
            const joinRoom = await database.joinRoom.findFirst({
                where : {
                    userEmail : payload.userEmail,
                    roomId : request.roomId,
                },
            });

            await database.$transaction(async(db)=>{
                await db.friend.delete({
                    where : {
                        id : isExist.id,
                    }
                });

                if(joinRoom){
                    await db.joinRoom.delete({
                        where : {
                            id : joinRoom.id,
                        }
                    });
                }

                await db.addRequest.delete({
                    where : {
                        id : request.id,
                    }
                });
            });

        }catch(err){
            throw err;
        }
        
    }
}