import { Router } from "express";
import { RoomService } from "../services";
import { ChatService } from "../../chats/services/chatService";
import database from "../../../database";

import { validatorErrorChecker } from "../../../middlewares/validator";
import { body, param, query } from "express-validator";

// 매칭 창에서 상대에게 채팅을 보내는 API
//  - 요청을 받으면 채팅방 생성 후, 채팅은 웹소켓으로 채팅을 입력하는 것이 아닌 방금 받은 http요청에 의해 직접 생성.

// 친구와 채팅을 시작히기 위한 채팅방 생성 API
//  - 요청을 받으면 채팅방 생성 후, 채팅방 고유번호를 반환
 
class RoomController {
    path = "/rooms";
    router;
    service;
    chatService;

    constructor(){
        this.router = Router();
        this.service = new RoomService();
        this.chatService = new ChatService();
        this.init();
    }

    init(){
        this.router.post("/create-room", [
            body('oppEmail').isEmail(),
            validatorErrorChecker
        ], this.createRoom.bind(this));

        this.router.get("/get-list/", [
        ], this.getRooms.bind(this));

        this.router.delete("/leave/:roomId", [
            param('roomId'),
            validatorErrorChecker
        ], this.leaveRoom.bind(this));
        
        this.router.patch("/update-room-name/:roomId",[
            param("roomId"),
            body("name"),
            validatorErrorChecker
        ], this.updateRoomName.bind(this));
    }

    //  방을 만들고, 상대와 나를 참여시킨다.
    //  - url : /rooms/create-room
    // header에 accessToken
    //  - 요청 데이터 : opp_id
    //  - 반환 데이터 : room_id
    async createRoom(req,res,next){
        try{
            const userEmail = req.user;

            const { oppEmail } = req.body;

            const resultRoom = await database.$transaction(async(db)=>{
                this.service.setDB(db);

                // 방을 만든다.
                const room = await this.service.createRoom(new CreateRoomDTO());
                if(!room) throw { status : 400, msg : "fail to create room" };

                // 유저가 만든 방에 참가한다.
                const joinUser = await this.service.createJoin({roomId : room.id, userEmail : userEmail});
                if(!joinUser) throw { status : 400, msg : "fail to join room" };

                // 방에 상대를 참여시킨다.
                const joinOpp = await this.service.createJoin({roomId : room.id, userEmail : oppEmail});
                if(!joinOpp) throw { status : 400, msg : "fail oppUser joins room" };   

                return room;
            });
            

            res.status(201).json({roomId : resultRoom.id});
        }catch(err){
            next(err);
        }
    }

    // 속해있는 방들을 반환한다.
    // url : /rooms/get-list
    // header에 accessToken
    async getRooms(req,res,next){
        try{
            const userEmail = req.user;

            const resultRooms = await database.$transaction(async (db)=>{
                this.service.setDB(db);

                const rooms = await this.service.getRooms({userEmail});

                return rooms;
            });
            res.status(200).json({rooms : resultRooms});
        }catch(err){
            next(err);
        }
    }

    // 속해있는 방을 나간다.
    // 만약 자신 혼자있다면, 방은 삭제된다.
    // req.query = { "roomId" : "..." }
    async leaveRoom(req,res,next){
        try{
            const userEmail = req.user;

            const { roomId } = req.params;

            await database.$transaction(async (db)=>{
                this.service.setDB(db);

                 // 방에 입장해 있는 지 확인
                const isJoin = await this.service.checkJoin({roomId, userEmail});
                if(!isJoin) throw { status : 404, msg : "not found : join" };

                // 방에 입장해 있는 유저의 수 확인
                const joinCount = await this.service.getJoinCount({roomId});

                // 방 퇴장
                await this.service.deleteJoin({userEmail, roomId});

                // 만약 요청있으면 삭제
                await this.service.deleteRequestWithLeaveRoom({userEmail, roomId});

                if(joinCount === 1) await this.service.deleteRoom({userEmail , roomId});
            });

            res.status(200).json({msg : "success"});
        }catch(err){    
            next(err);
        }
    }

    async updateRoomName(req,res,next){
        try{
            const { roomId } = req.params;

            const { name } = req.body;

            const room = await database.$transaction(async(db)=>{
                this.service.setDB(db);

                const room = await this.service.updateRoom({roomId : roomId, name : name});

                return room;
            });

            res.status(200).json({room : room});
        }catch(err){
            next(err);
        }
    }
}

const roomController = new RoomController();
export default roomController;