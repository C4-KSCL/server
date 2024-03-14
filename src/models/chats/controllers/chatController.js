import { Router } from "express";
import { ChatService } from "../services/chatService";
import pagination from "../../../utils/pagination";
import { validatorErrorChecker } from "../../../middlewares/validator";

import { body, query, param } from "express-validator";

import database from "../../../database";

class ChatController {
    path = "/chats";
    router;
    service;

    constructor() {
        this.router = Router();
        this.service = new ChatService();
        this.init();
    }

    init() {
        this.router.get("/get-chats/:roomId", [
            param('roomId'),
            query('page'),
            query('limit'),
            validatorErrorChecker,
        ], this.getChats.bind(this));

        this.router.get("/get-last-chats/", [
        ], this.getLastChats.bind(this));
    }


    async getChats(req, res, next) {
        try {
            const { roomId } = req.params;

            const { page, limit } = req.query;

            const { skip, take } = pagination(page, limit);


            const chats = await database.$transaction(async (db) => {
                this.service.setDB(db);

                return await this.service.getChats({ roomId, skip, take });
            });

            res.status(200).json({ chats: chats });

        } catch (err) {
            next(err);
        }
    }

    async getLastChats(req, res, next) {
        try {
            const userEmail = req.user;

            const lastChats = await database.$transaction(async (db) => {
                this.service.setDB(db);

                return await this.service.getLastChats(userEmail);
            });

            res.status(200).json({ lastChats: lastChats });
        } catch (err) {
            next(err);
        }
    }

}

const chatController = new ChatController();
export default chatController;