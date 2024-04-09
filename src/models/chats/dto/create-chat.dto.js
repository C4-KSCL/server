// roomId : payload.roomId,
// userName : user.name,
// userEmail : user.email,
// content : payload.content,
// readCount : payload.readCount,

export class CreateChatDTO {
    roomId;
    userEmail;
    content;
    readCount;
    friend;
    constructor(payload){
        this.roomId = payload.roomId;
        this.userEmail = payload.userEmail;
        this.content = payload.content;
        this.readCount = payload.readCount;
        this.friend = payload.friend;
    }
}