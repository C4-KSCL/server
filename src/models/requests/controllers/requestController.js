import { Router } from "express";
import { RequestService } from "../../rooms/services";
import { CreateChatDTO } from "../../chats/dto/create-chat.dto";
import { CreateRoomDTO } from "../../rooms/dto/createRoom.dto";
import database from "../../../database";

import { validatorErrorChecker } from "../../../middlewares/validator";
import { body, param, query } from "express-validator";

const service = new RequestService();
const router = Router();

export default router;

router.post("/send", [
    body('oppEmail').isEmail(),
    body('content'),
    validatorErrorChecker
], sendRequest);

router.get("/get-received", [
], getReceviedRequests);

router.get("/get-sended", [
], getSendRequests);

router.post("/accept", [
    body('requestId'),
    validatorErrorChecker
], acceptRequest);

router.patch("/reject", [
    body('requestId'),
    validatorErrorChecker
], rejectRequest);

router.delete("/delete/:requestId", [
    param('requestId'),
    validatorErrorChecker
], deleteRequest);

async function sendRequest(req, res, next) {
    try {
        const userEmail = req.user;
        const { oppEmail, content } = req.body;

        await service.checkUser(oppEmail);

        // // 방만들기 -> 방 참가 -> 메시지입력 -> 요청 전송 # 트랜잭션
        // 요청 존재 확인
        await service.checkRequest({ reqUser: userEmail, recUser: oppEmail });

        const room = new CreateRoomDTO();

        const request = await service.createRequest({
            room: room,
            userEmail: userEmail,
            content: content,
            oppEmail: oppEmail
        });

        await service.createSocketToken({ userEmail: userEmail });

        if (!request) throw { status: 400, msg: "fail to send request" };

        res.status(201).json({ msg: "true" });

    } catch (err) {
        next(err);
    }
}

// 받은 요청들을 반환한다.
// /requests/get-received
// header에 accessToken
async function getReceviedRequests(req, res, next) {
    try {
        const userEmail = req.user;

        const requests = await service.getRequests({ userEmail: userEmail, recUser: userEmail, status: "ing" });

        res.status(200).json({ requests: requests });
    } catch (err) {
        next(err);
    }
}

// 보낸 요청들을 반환한다.
// header에 accessToken
async function getSendRequests(req, res, next) {
    try {
        const userEmail = req.user;

        const resultRequests = await service.getRequests({ userEmail: userEmail, reqUser: userEmail, status: "ing" });

        res.status(200).json({ requests: resultRequests });
    } catch (err) {
        next(err);
    }
}

// 친구 요청을 받아들인다.
// 요청 아이디로 방 아이디 획득, 친구 추가, 채팅 방에 입장, 채팅 방 publishing을 true로 변환,  요청 삭제
// 채팅방 입장은 JoinRoom 테이블의 join : false를 true로 바꿔주면 된다.
// fcm이 필요함.
async function acceptRequest(req, res, next) {
    try {
        const userEmail = req.user;
        const { requestId } = req.body;

        // requestId로 request 획득 -> request.roomId로 방 아이디 획득 가능.
        const request = await service.getRequest(requestId);

        await service.checkReceivedRequest({ userEmail: userEmail, requestId: request.id });

        // 친구 생성 -> 조인 생성 -> room update -> 요청 업데이트 # 트랜잭션 -> socket 테이블 업데이트 
        const room = await service.acceptRequest({ userEmail: userEmail, request: request });
        // 신규 유저일 시
        // UserSocketToken 테이블에 정보를 등록해준다. 
        await service.createSocketToken({ userEmail: userEmail });


        res.status(201).json({ room: room });
    } catch (err) {
        next(err);
    }
}

// 요청 거절
// 방 삭제, 요청 삭제
async function rejectRequest(req, res, next) {
    try {
        const userEmail = req.user;
        const { requestId } = req.body;

        const request = await service.getRequest(requestId);

        await service.checkReceivedRequest({ userEmail: userEmail, requestId: request.id });

        if (request.status === "rejected" || request.status === "accepted")
            throw { status: 400, msg: "already succeeded : request" };

        // 방 삭제 -> 요청 거절 업데이트 # 트랜잭션
        await service.deleteRoomAndRejectRequest(request);

        res.status(200).json({ msg: "success" });

    } catch (err) {
        next(err);
    }
}

async function deleteRequest(req, res, next) {
    try {
        const userEmail = req.user;
        const { requestId } = req.params;

        const id = Number(requestId);


        const request = await service.getRequest(id);

        await service.checkSendedRequest({ userEmail: userEmail, requestId: id });

        // // 방 삭제 -> 요청 삭제 # 트랜잭션
        await service.deleteRoomAndRequest({ request: request, id });

        res.status(200).json({ msg: "delete complete" });
    } catch (err) {
        next(err);
    }
}