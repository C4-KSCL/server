import { Router } from "express";
import { RoomService, RequestService } from "../services";
import { FriendService } from "../../friends/services/friendService";
import { ChatService } from "../../chats/services/chatService";
import { CreateChatDTO } from "../../chats/dto/create-chat.dto";
import { CreateRoomDTO } from "../dto/createRoom.dto";
import database from "../../../database";

import { validatorErrorChecker } from "../../../middlewares/validator";
import { body, param, query } from "express-validator";
import { SocketService } from "../../../sockets/services/socketService";

class RequestController {
    path = "/requests";
    requestService;
    friendService;
    roomService;
    chatService;
    socketService;
    router;
    
    constructor(){
        this.router = Router();
        this.roomService = new RoomService();
        this.chatService = new ChatService();
        this.requestService = new RequestService();
        this.friendService = new FriendService();
        this.socketService = new SocketService();
        this.init();
    }

    init(){
        this.router.post("/send", [
            // body('userEmail').isEmail(),
            body('oppEmail').isEmail(),
            body('content'),
            validatorErrorChecker
        ],this.sendRequest.bind(this));

        this.router.get("/get-received",[
            // param('userEmail').isEmail(),
            // validatorErrorChecker
        ], this.getReceviedRequests.bind(this));

        this.router.get("/get-sended",[
            // param('userEmail'),
            // validatorErrorChecker
        ], this.getSendRequests.bind(this));

        this.router.post("/accept",[
            body('requestId'),
            validatorErrorChecker
        ], this.acceptRequest.bind(this));

        this.router.patch("/reject",[
            body('requestId'),
            validatorErrorChecker
        ], this.rejectRequest.bind(this));

        this.router.delete("/delete/:requestId",[
            param('requestId'),
            validatorErrorChecker
        ], this.deleteRequest.bind(this));
    }

     // 이미 보낸 요청이 있는 지 확인한다 그 후, 방을 만든 뒤, 참가 후, 메시지를 입력 후, 요청을 보낸다.
    //  - url : /requests/send
     // header에 accessToken
    //  - 요청 데이터 : opp_id, message
    //  - 반환 데이터 : msg : 성공시 true, 실패 시 false
    async sendRequest(req,res,next){
        try{
            const userEmail = req.user;
            const { oppEmail, content } = req.body;

            await database.$transaction(async(db)=>{
                this.requestService.setDB(db);
                this.roomService.setDB(db);
                this.chatService.setDB(db);
                this.socketService.setDB(db);

                // 요청 존재 확인
                await this.requestService.checkRequest({reqUser : userEmail, recUser : oppEmail});

                // 방을 만든다. create.dto 필요
                const room = await this.roomService.createRoom(new CreateRoomDTO());

                if(!room) throw { status : 400, msg : "fail to create room" };

                // 방에 참가한다.
                const join = await this.roomService.createJoin({roomId : room.id ,userEmail : userEmail});
                if(!join) throw { status : 400, msg : "fail to join room" };

                // 신규 유저일 시
                // UserSocketToken 테이블에 정보를 등록해준다.
                await this.socketService.createOrUpdateSocket({userEmail : userEmail});

                // 메시지를 입력한다.
                const chatting = await this.chatService.createChat(new CreateChatDTO({roomId : room.id, userEmail : userEmail, content : content, readCount : 1}));
                if(!chatting) throw {status : 400, msg : "fail to send message"};

                // 상대에게 요청을 보낸다.
                const request = await this.requestService.createRequest({roomId : room.id, reqUser : userEmail, recUser : oppEmail});

                if(!request) throw { status : 400, msg : "fail to send request" };
            });
            res.status(201).json({msg: "true"});
        }catch(err){
            next(err);
        }
    }
    // 받은 요청들을 반환한다.
    // /requests/get-received
     // header에 accessToken
    async getReceviedRequests(req,res,next){
        try{
            const userEmail = req.user;

            const resultRequests = await database.$transaction(async(db)=>{
                this.requestService.setDB(db);
                
                const requests = await this.requestService.getRequests({userEmail : userEmail, recUser : userEmail, status : "ing"});
                
                return requests;
            });

            res.status(200).json({requests : resultRequests});
        }catch(err){
            next(err);
        }
    }

    // 보낸 요청들을 반환한다.
    // header에 accessToken
    async getSendRequests(req,res,next){
        try{
            const userEmail = req.user;

            const resultRequests = await database.$transaction(async(db) => {
                this.requestService.setDB(db);
                
                const requests = await this.requestService.getRequests({userEmail : userEmail, reqUser : userEmail, status : "ing"});
                
                return requests;
            });


            res.status(200).json({requests : resultRequests});
        }catch(err){
            next(err);
        }
    }

    // 친구 요청을 받아들인다.
    // 요청 아이디로 방 아이디 획득, 친구 추가, 채팅 방에 입장, 채팅 방 publishing을 true로 변환,  요청 삭제
    async acceptRequest(req,res,next){
        try{
            const userEmail = req.user;
            const { requestId } = req.body;

            const resultRoom = await database.$transaction(async (db)=>{
                this.roomService.setDB(db);
                this.requestService.setDB(db);
                this.friendService.setDB(db);
                this.socketService.setDB(db);

                // requestId로 request 획득 -> request.roomId로 방 아이디 획득 가능.
                const request = await this.requestService.getRequest(requestId);

                // 친구 생성 
                const friend = await this.friendService.createFriend({userEmail : request.reqUser, oppEmail : request.recUser});
                if(!friend) throw { status : 500, msg: "fail to create friend" };

                // 입장(조인) 생성.

                const join = await this.roomService.createJoin({roomId : request.roomId, userEmail : userEmail});

                const joinCount = await this.roomService.getJoinCount({roomId : join.roomId});

                // publishing : true, joinCount 업데이트
                const room = await this.roomService.updateRoom({roomId : request.roomId, joinCount : joinCount+1, publishing : "true"});
                if(!room) throw { status : 500, msg : "fail to modify info of room, after request" };

                // 요청 업데이트
                await this.requestService.updatedAcceptRequest(request.id);

                // 신규 유저일 시
                // UserSocketToken 테이블에 정보를 등록해준다. 
                await this.socketService.createOrUpdateSocket({userEmail : userEmail});

                return room;
            });

            res.status(201).json({room : resultRoom});
        }catch(err){    
            next(err);
        }
    }

    // 요청 거절
    // 방 삭제, 요청 삭제
    async rejectRequest(req,res,next){
        try{
            const { requestId } = req.body;

            await database.$transaction(async(db)=>{
                this.requestService.setDB(db);
                this.roomService.setDB(db);

                const request = await this.requestService.getRequest(requestId);

                if(request.status === "rejected" || request.status === "accepted") throw { status : 400, msg : "already succeeded : request"};
    
                await this.roomService.deleteRoom(request);

                await this.requestService.udpateRejectRequest(request.id);
            });

            res.status(200).json({msg: "success"});

        }catch(err){
            next(err);
        }
    }

    async deleteRequest(req,res,next){
        try{
            const { requestId } = req.params;

            const id = Number(requestId);

            await database.$transaction(async(db)=>{
                this.requestService.setDB(db);
                this.roomService.setDB(db);

                const request = await this.requestService.getRequest(id);
    
                await this.roomService.deleteRoom(request);

                await this.requestService.deleteRequest(id);
            });

            res.status(200).json({msg : "delete complete"});
        }catch(err){
            next(err);
        }
    }
}

const requestController = new RequestController();
export default requestController;