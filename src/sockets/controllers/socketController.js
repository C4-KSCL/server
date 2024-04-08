import { SocketService } from "../services/socketService";
import { CreateChatDTO } from "../../models/chats/dto/create-chat.dto";
import { RoomService } from "../../models/rooms/services";
import { RandomChoice } from "../../utils/choiceSmall";
import { pushAlam } from "../../utils/pushAlam";

import database from "../../database";

export class SocketController {
    io;
    socket;
    service;
    roomService;

    constructor(io, socket) {
        this.io = io;
        this.socket = socket;
        this.roomService = new RoomService();
        this.service = new SocketService();
    }

    setRoomId() {
        if (this.socket.size > 1) {
            this.socket.emit("err", { msg: "have more connection than one" });
            return;
        }
        let id = "";
        for (const roomId of this.socket.rooms) {
            id = roomId;
        }

        this.socket.roomId = id;
    }

    // 방에 조인 후, 자신이 읽지 않은 모든 메시지의 리드 카운트를 줄여야 한다.
    // 또한 UserSocketToken에서 Socket을 업데이트 해줘야 한다.
    // payload : roomId, userEmail
    async joinRoom(payload) {
        try {
            this.socket.join(payload.roomId);
            payload.userEmail = this.socket.userEmail;

            await this.service.createOrUpdateSocket({ socket: this.socket.id, ...payload });

            await this.service.updateChatReadCount(payload);

            this.setRoomId();

            console.log(payload.roomId);

            this.io.to(payload.roomId).emit("user join in room", { userEmail: this.socket.userEmail });

        } catch (err) {
            console.log(err);
        }

    }

    // 메시지를 받으면 메시지 생성 후, 메시지를 사용자에게 보낸다.
    // 현재 접속해 있는 유저의 수에 채팅방안에 있는 유저의 수를 뺀다.
    // payload : content
    async newMessage(payload) {
        try {
            payload.userEmail = this.socket.userEmail;
            payload.roomId = this.socket.roomId;

            let joinCount = await this.service.getJoinCount({ roomId: payload.roomId });

            const oppSocket = await this.service.getOppSocket(payload);

            if (oppSocket) joinCount--;

            // roomId, userEmail, content
            const msg = await this.service.createChat(new CreateChatDTO({
                roomId: payload.roomId,
                userEmail: payload.userEmail,
                content: payload.content,
                readCount: joinCount - 1,
            }));


            // if(oppSocket){
            //     const oppTokens = getTokens({roomId, userEmail});

            //     pushAlam({tokens : oppTokens, ...message});
            // }

            this.io.to(payload.roomId).emit("new message", { msg: msg });

        } catch (err) {
            console.log(err);
        }
    }


    // payload : chatId
    async deleteMsg(payload) {
        try {
            payload.userEmail = this.socket.userEmail;
            payload.roomId = this.socket.roomId;

            // update chatting
            const msg = await this.service.updateNoContent(payload);

            if (!msg) this.socket.emit("failed", { msg: "failed to requests" });

            this.io.to(payload.roomId).emit("delete message", msg);

        } catch (err) {
            console.log(err);
        }

    }

    // 스몰 카테고리와 이미지를 제공
    // 스몰 카테고리를 무작위로 선택하는 로직 필요. ( 이거는 utils에서 수행. ) 
    // payload : userEmail, small, roomId
    async newEvent(payload) {
        try {
            const middleName = payload.middleName;
            payload.userEmail = this.socket.userEmail;
            payload.roomId = this.socket.roomId;

            // small category 선택하고, 채팅 만들고, 이벤트 만들고, 이미지 in 이벤트 만들어고나서, 채팅, 이벤트 아이디 정보 반환
            const smallCategory = await this.service.checkSmall({small : payload.smallCategory});
            // joinCount 확인
            // oppSocket 확인
            // 메시지 생성

            let joinCount = await this.service.getJoinCount({ roomId: payload.roomId });

            const oppSocket = await this.service.getOppSocket(payload);

            if (oppSocket) joinCount--;

            const msg = await this.service.createEvent({
                roomId: payload.roomId,
                userEmail: payload.userEmail,
                categoryId: smallCategory.id,
                readCount: --joinCount,
            });


            if (!msg) this.socket.emit("failed", { msg: "failed to requests" });

            // if(oppSocket){
            //     const oppTokens = getTokens({roomId, userEmail});

            //     pushAlam({tokens : oppTokens, ...message});
            // }

            this.io.to(payload.roomId).emit("new event", msg);

        } catch (err) {
            console.log(err);
        }
    }

    // roomId
    // 접속이 돼 있는 방인지 검사 후 탈퇴
    async leaveRoom(payload){
        try {
            const userEmail = this.socket.userEmail;

            const roomId = payload.roomId;

            // 방에 입장해 있는 지 확인
            const isJoin = await this.roomService.checkJoin({ roomId, userEmail });

            // 방에 입장해 있는 유저의 수 확인
            const joinCount = await this.roomService.getJoinCount({ roomId });

            const msg = await this.roomService.leaveRoom({ userEmail, roomId, joinCount, joinId : isJoin.id });

            if(msg){
                this.socket.leave(payload.roomId);

                this.io.to(payload.roomId).emit("leave room", msg);
                
                this.socket.emit("ack", {msg : "complete leave room"});

            }else{
                this.socket.emit("error", {error : "error in leaveRoom"});
            }

        } catch (err) {
            console.log(err);
        }
    }

    // 소켓 연결이 끊기면 UserSocketToken 테이블에 데이터 삭제
    async disconnecting() {
        try {

            await this.service.updateUserSocketToNull({ socket: this.socket.id });
            
        } catch (err) {
            console.log(err);
        }
    }
}


