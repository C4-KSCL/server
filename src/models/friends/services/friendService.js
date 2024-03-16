import database from "../../../database";

export class FriendService {

    db;

    setDB(db){
        this.db = db;
        this.getFriendsByEmail.bind(this);
        this.deleteFriend.bind(this);
        this.createFriend.bind(this);
        this.checkFriend.bind(this);
        this.setDB.bind(this);
    }

    async getFriendsByEmail(userEmail){
        try{
            const friends = await this.db.friend.findMany({
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

            for(const friend of friends){
                if(friend.user1 === userEmail){
                    friend.friend = await this.db.user.findUnique({
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
                    friend.friend = await this.db.user.findUnique({
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
                const request = await this.db.addRequest.findFirst({
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

                const room = await this.db.room.findUnique({
                    where : {
                        id : request.roomId
                    }
                }); 

                friend.room = room;
            }

            return friends;
        }catch(err){
            throw err;
        }
        
    }
    
    async deleteFriend(payload){
        try{
            const isExist = await this.db.friend.findFirst({
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
    
            await database.friend.delete({
                where : {
                    id : isExist.id,
                }
            });
        }catch(err){
            throw err;
        }
        
    }

    // id Int @id @default(autoincrement())
    // user1 String @db.VarChar(50)
    // user2 String @db.VarChar(50)
    // createdAt DateTime @default(now())
    async createFriend(payload){
        try{
            const isExist = await this.db.friend.findFirst({
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
    
            if(isExist) throw { status : 400, msg : "already exists : friend" };
    
    
            const friend = await this.db.friend.create({
                data : {
                    user1 : payload.userEmail,
                    user2 : payload.oppEmail,
                },
            });
            return friend;

        }catch(err){
            throw err;
        }
    }

    async checkFriend(payload){
        try{
            const isExist = await this.db.friend.findFirst({
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
    
            if(isExist) throw { status : 400, msg : "already exists : friend" };
        }catch(err){
            throw err;
        }
        
    }

}