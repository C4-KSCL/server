import database from "../../../database";

export class UserService{
    async createUser(payload) {
        const user = await database.user.create({
            data : {
                email : payload.email,
                nickname : payload.nickname,
            },
        });

        return user;
    }

    async getUsers(){
        const users = await database.user.findMany({});

        return users;
    }
}