import { Router } from "express";
import { ChatService } from "../services/chatService";
import pagination from "../../../utils/pagination";
import { validatorErrorChecker } from "../../../middlewares/validator";

import { body, query, param } from "express-validator";

import database from "../../../database";

const service = new ChatService();
const router = Router();

router.get("/get-chats/:roomId", [
    param('roomId'),
    query("chatId"),
    query('limit'),
    validatorErrorChecker,
], getChats);

router.get("/get-last-chats/", [
], getLastChats);

router.delete("/delete/:id", deleteChat);

async function getChats(req, res, next) {
    try {
        const userEmail = req.user;

        const { roomId } = req.params;

        const { chatId, limit } = req.query;

        const { chat , take } = pagination(chatId, limit);

        // room 존재 확인
        // room join 확인하기
        // 채팅 받아오기
        const chats = await service.getChats({ userEmail, roomId, chat, take });

        res.status(200).json({ chats: chats });

    } catch (err) {
        next(err);
    }
}


async function getLastChats(req, res, next) {
    try {
        const userEmail = req.user;

        // 마지막 채팅들 받아오기
        const lastChats = await service.getLastChats(userEmail);

        res.status(200).json({ lastChats: lastChats });
    } catch (err) {
        next(err);
    }
}

async function deleteChat(req,res,next){
    try{
        const { id } = req.params;

        await service.deleteChat({id : Number(id)});

        res.status(203).json({});
    }catch(err){
        next(err);
    }
}

export default router;