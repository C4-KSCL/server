import { SocketService } from "../services/socketService";
import { ChatService } from "../../models/chats/services/chatService";
import { CreateChatDTO } from "../../models/chats/dto/create-chat.dto";
import { RoomService } from "../../models/rooms/services";
import { RandomChoice } from "../../utils/choiceSmall";
import { pushAlam } from "../../utils/pushAlam";

import database from "../../database";

export class SocketController {
    io;
    socket;
    socketService;
    chatService;
    roomService;

    constructor(io, socket) {
        this.io = io;
        this.socket = socket;
        this.socketService = new SocketService();
        this.chatService = new ChatService();
        this.roomService = new RoomService();
    }
    // 방에 조인 후, 자신이 읽지 않은 모든 메시지의 리드 카운트를 줄여야 한다.
    // 또한 UserSocketToken에서 Socket을 업데이트 해줘야 한다.
    // payload : roomId, userEmail
    async joinRoom(payload) {
        try {
            this.socket.join(payload.roomId);

            const res = await database.$transaction(async (db) => {
                this.socketService.setDB(db);

                await this.socketService.createOrUpdateSocket({ socket: this.socket.id, ...payload });

                return await this.socketService.updateChatReadCount(payload);
            })

            // this.io.to(payload.roomId).emit("update read count", { ids: res });

            this.io.to(payload.roomId).emit("user join in room", { userEmail : payload.userEmail});

        } catch (err) {
            console.log(err);
        }

    }

    // 메시지를 받으면 메시지 생성 후, 메시지를 사용자에게 보낸다.
    // 현재 접속해 있는 유저의 수에 채팅방안에 있는 유저의 수를 뺀다.
    // payload : roomId, userEmail,content
    async newMessage(payload) {
        try {
            const userEmail = payload.userEmail;

            let oppSocket;

            const message = await database.$transaction(async (db) => {
                this.roomService.setDB(db);
                this.chatService.setDB(db);
                this.socketService.setDB(db);

                let joinCount = await this.roomService.getJoinCount({ roomId: payload.roomId });

                oppSocket = await this.socketService.getOppSocket(payload);

                if (oppSocket) joinCount--;

                // roomId, userEmail, content
                const msg = await this.chatService.createChat(new CreateChatDTO({
                    roomId: payload.roomId,
                    userEmail: payload.userEmail,
                    content: payload.content,
                    readCount: joinCount - 1,
                }));

                return msg;
            });

            // if(oppSocket){
            //     const oppTokens = getTokens({roomId, userEmail});

            //     pushAlam({tokens : oppTokens, ...message});
            // }

            this.io.to(payload.roomId).emit("new message", { msg: message });

        } catch (err) {
            console.log(err);
        }
    }


    // payload : roomId, userEmail, chatId
    async deleteMsg(payload) {
        try {
            const msg = await database.$transaction(async (db) => {
                this.socketService.setDB(db);

                return await this.socketService.updateNoContent(payload);
            })

            if (!msg) this.socket.emit("failed", { msg: "failed to requests" });

            this.io.to(payload.roomId).emit("delete message", msg);

        } catch (err) {
            console.log(err);
        }

    }

    // 스몰 카테고리와 이미지를 제공
    // 스몰 카테고리를 무작위로 선택하는 로직 필요. ( 이거는 utils에서 수행. ) 
    // payload : userEmail, middleName, roomId
    async newEvent(payload) {
        try {
            const middleName = payload.middleName;

            // small category 선택하고, 채팅 만들고, 이벤트 만들고, 이미지 in 이벤트 만들어고나서, 채팅, 이벤트 아이디 정보 반환
            const smallCategory = await RandomChoice(middleName);

            console.log(smallCategory);

            let joinCount;

            let oppSocket;

            const message = await database.$transaction(async (db) => {
                this.roomService.setDB(db);
                this.socketService.setDB(db);

                joinCount = await this.roomService.getJoinCount({ roomId: payload.roomId });

                oppSocket = await this.socketService.getOppSocket(payload);

                if (oppSocket) joinCount--;

                const msg = await this.socketService.createEvent({
                    roomId: payload.roomId,
                    userEmail: payload.userEmail,
                    categoryId: smallCategory.id,
                    readCount: --joinCount,
                });

                return msg;
            });


            if (!message) this.socket.emit("failed", { msg: "failed to requests" });

            // if(oppSocket){
            //     const oppTokens = getTokens({roomId, userEmail});

            //     pushAlam({tokens : oppTokens, ...message});
            // }

            this.io.to(payload.roomId).emit("new event", message);

        } catch (err) {
            console.log(err);
        }
    }

    // 소켓 연결이 끊기면 UserSocketToken 테이블에 데이터 삭제
    async disconnecting() {
        try {
            await database.$transaction(async (db) => {
                this.socketService.setDB(db);

                await this.socketService.updateUserSocketToNull({ socket: this.socket.id });
            });
        } catch (err) {
            console.log(err);
        }
    }
}

