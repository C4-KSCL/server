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
                }
            });
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