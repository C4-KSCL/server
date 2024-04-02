import { Router } from "express";
import { RequestService } from "../../rooms/services";
import { CreateChatDTO } from "../../chats/dto/create-chat.dto";
import { CreateRoomDTO } from "../../rooms/dto/createRoom.dto";
import database from "../../../database";

import { validatorErrorChecker } from "../../../middlewares/validator";
import { body, param, query } from "express-validator";

class RequestController {
    path = "/requests";
    service;
    router;

    constructor() {
        this.router = Router();
        this.service = new RequestService();
        this.init();
    }

    init() {
        this.router.post("/send", [
            // body('userEmail').isEmail(),
            body('oppEmail').isEmail(),
            body('content'),
            validatorErrorChecker
        ], this.sendRequest.bind(this));

        this.router.get("/get-received", [
            // param('userEmail').isEmail(),
            // validatorErrorChecker
        ], this.getReceviedRequests.bind(this));

        this.router.get("/get-sended", [
            // param('userEmail'),
            // validatorErrorChecker
        ], this.getSendRequests.bind(this));

        this.router.post("/accept", [
            body('requestId'),
            validatorErrorChecker
        ], this.acceptRequest.bind(this));

        this.router.patch("/reject", [
            body('requestId'),
            validatorErrorChecker
        ], this.rejectRequest.bind(this));

        this.router.delete("/delete/:requestId", [
            param('requestId'),
            validatorErrorChecker
        ], this.deleteRequest.bind(this));
    }

    // 이미 보낸 요청이 있는 지 확인한다 그 후, 방을 만든 뒤, 참가 후, 메시지를 입력 후, 요청을 보낸다.
    //  - url : /requests/send
    // header에 accessToken
    //  - 요청 데이터 : opp_id, message
    //  - 반환 데이터 : msg : 성공시 true, 실패 시 false
    // 구조 변경 완료
    async sendRequest(req, res, next) {
        try {
            const userEmail = req.user;
            const { oppEmail, content } = req.body;

            await this.service.checkUser(oppEmail);

            // // 방만들기 -> 방 참가 -> 메시지입력 -> 요청 전송 # 트랜잭션
            // 요청 존재 확인
            await this.service.checkRequest({ reqUser: userEmail, recUser: oppEmail });

            const room =  new CreateRoomDTO();

            const request = await this.service.createRequest({
                room : room,
                userEmail: userEmail,
                content: content,
                oppEmail: oppEmail
            });

            await this.service.createSocketToken({ userEmail: userEmail });

            if (!request) throw { status: 400, msg: "fail to send request" };

            res.status(201).json({ msg: "true" });

        } catch (err) {
            next(err);
        }
    }

    // 받은 요청들을 반환한다.
    // /requests/get-received
    // header에 accessToken
    // 구조 변경 완료
    async getReceviedRequests(req, res, next) {
        try {
            const userEmail = req.user;

            const requests = await this.service.getRequests({ userEmail: userEmail, recUser: userEmail, status: "ing" });


            res.status(200).json({ requests: requests });
        } catch (err) {
            next(err);
        }
    }

    // 보낸 요청들을 반환한다.
    // header에 accessToken
    // 구조 변경 완료
    async getSendRequests(req, res, next) {
        try {
            const userEmail = req.user;

            const resultRequests = await this.service.getRequests({ userEmail: userEmail, reqUser: userEmail, status: "ing" });

            res.status(200).json({ requests: resultRequests });
        } catch (err) {
            next(err);
        }
    }

    // 친구 요청을 받아들인다.
    // 요청 아이디로 방 아이디 획득, 친구 추가, 채팅 방에 입장, 채팅 방 publishing을 true로 변환,  요청 삭제
    // 구조 변경 완료
    async acceptRequest(req, res, next) {
        try {
            const userEmail = req.user;
            const { requestId } = req.body;

            // requestId로 request 획득 -> request.roomId로 방 아이디 획득 가능.
            const request = await this.service.getRequest(requestId);

            await this.service.checkReceivedRequest({ userEmail: userEmail, requestId: request.id });

            // 친구 생성 -> 조인 생성 -> room update -> 요청 업데이트 # 트랜잭션 -> socket 테이블 업데이트 
            const room = await this.service.acceptRequest({ userEmail: userEmail, request: request });
            // 신규 유저일 시
            // UserSocketToken 테이블에 정보를 등록해준다. 
            await this.service.createSocketToken({ userEmail: userEmail });


            res.status(201).json({ room: room });
        } catch (err) {
            next(err);
        }
    }

    // 요청 거절
    // 방 삭제, 요청 삭제
    // 구조 변경 완료
    async rejectRequest(req, res, next) {
        try {
            const userEmail = req.user;
            const { requestId } = req.body;

            const request = await this.service.getRequest(requestId);

            await this.service.checkReceivedRequest({ userEmail: userEmail, requestId: request.id });

            if (request.status === "rejected" || request.status === "accepted")
                throw { status: 400, msg: "already succeeded : request" };

            // 방 삭제 -> 요청 거절 업데이트 # 트랜잭션
            await this.service.deleteRoomAndRejectRequest(request);

            res.status(200).json({ msg: "success" });

        } catch (err) {
            next(err);
        }
    }

    // 구조 변경 완료   
    async deleteRequest(req, res, next) {
        try {
            const userEmail = req.user;
            const { requestId } = req.params;

            const id = Number(requestId);


            const request = await this.service.getRequest(id);

            await this.service.checkSendedRequest({ userEmail: userEmail, requestId: id });
            
            // // 방 삭제 -> 요청 삭제 # 트랜잭션
            await this.service.deleteRoomAndRequest({ request: request, id });

            res.status(200).json({ msg: "delete complete" });
        } catch (err) {
            next(err);
        }
    }
}

const requestController = new RequestController();
export default requestController;