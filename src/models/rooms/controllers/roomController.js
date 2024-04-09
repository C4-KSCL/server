import { Router } from "express";
import { RoomService } from "../services";
import { ChatService } from "../../chats/services/chatService";
import database from "../../../database";
import { CreateRoomDTO } from "../dto/createRoom.dto";

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

    constructor() {
        this.router = Router();
        this.service = new RoomService();
        this.init();
    }

    init() {
        this.router.patch("/create", [
            body('oppEmail').isEmail(),
            validatorErrorChecker
        ], this.createRoom.bind(this));

        this.router.get("/get-list/", [
        ], this.getRooms.bind(this));

        this.router.patch("/leave/:roomId", [
            param('roomId'),
            validatorErrorChecker
        ], this.leaveRoom.bind(this));

        this.router.patch("/update-room-name/:roomId", [
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
    // 친구가 되어있는 유저와는 addRequest와 friend 테이블에 기록이 돼있다.
    // create-room을 하는 시점은 채팅방에서 혼자 나갔다거나, 둘다 나갔다는 뜻이다.
    // 혼자 나갔을 때는 나간 채팅방의 joinRoom을 찾아서 join 컬럼을 true로 만들어 줘야한다.
    // 둘 다 나갔을 때는 addRequest의 roomId를 바꿔줘야한다.
    // 방의 최종 삭제 시점은 친구 삭제 시에 이루어 짐.
    // 차단이 되어있지 않은 친구만 초대가능 => 차단이 됐으면 joinRoom의 join을 계속 false로 놔둬야함.
    async createRoom(req, res, next) {
        try {
            const userEmail = req.user;

            const { oppEmail } = req.body;

            await this.service.checkUser({oppEmail : oppEmail});

            // 친구와의 채팅방이 있는지 확인함.
            // joinRoom object를 반환
            const isExistRoom = await this.service.findJoinRoom({userEmail : userEmail, oppEmail : oppEmail});

            const oppJoinRoom = await this.service.findJoinRoom({userEmail : oppEmail, oppEmail : userEmail});

            const blocking = await this.service.findBlocking({userEmail : userEmail, oppEmail : oppEmail});

            if(isExistRoom){

                const join = await this.service.changeToTrueJoin({
                    id : isExistRoom.id,
                    roomId : isExistRoom.roomId, 
                    userEmail : userEmail,
                    oppJoinId : oppJoinRoom.id,
                    oppEmail : oppEmail,
                    blocking : blocking,
                });

                res.status(200).json({room : join});
                
            }else{
                const room = await this.service.createRoom({ 
                    room: new CreateRoomDTO(),
                    userEmail: userEmail,
                    oppEmail: oppEmail,
                    blocking : blocking, 
                });
    
                res.status(201).json({ room : room });
            }

        } catch (err) {
            next(err);
        }
    }

    // 속해있는 방들을 반환한다.
    // url : /rooms/get-list
    // header에 accessToken
    async getRooms(req, res, next) {
        try {
            const userEmail = req.user;

            const rooms = await this.service.getRooms({ userEmail });

            res.status(200).json({ rooms: rooms });
        } catch (err) {
            next(err);
        }
    }

    // 속해있는 방을 나간다.
    // 만약 자신 혼자있다면, 방은 삭제된다.
    // req.query = { "roomId" : "..." }
    // 떠났다는 채팅 추가하기
    async leaveRoom(req, res, next) {
        try {
            const userEmail = req.user;

            const { roomId } = req.params;

            // 방에 입장해 있는 지 확인
            const isJoin = await this.service.checkJoin({ roomId, userEmail });

            // 방에 입장해 있는 유저의 수 확인
            const joinCount = await this.service.getJoinCount({ roomId });

            await this.service.leaveRoom({ userEmail, roomId, joinCount, joinId : isJoin.id });

            res.status(200).json({ msg: "success" });
        } catch (err) {
            next(err);
        }
    }

    async updateRoomName(req, res, next) {
        try {
            const { roomId } = req.params;

            const { name } = req.body;

            const room = await this.service.updateRoom({ roomId: roomId, name: name });

            res.status(200).json({ room: room });
        } catch (err) {
            next(err);
        }
    }
}

const roomController = new RoomController();
export default roomController;