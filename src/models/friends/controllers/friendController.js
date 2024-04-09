import { Router } from "express";
import { FriendService } from "../services/friendService";
import database from "../../../database";

import { validatorErrorChecker } from "../../../middlewares/validator";

import { param, query, body } from "express-validator";

class FriendController {
    path = "/friends";
    router;
    service;

    constructor() {
        this.router = Router();
        this.service = new FriendService();
        this.init();
    }

    init() {
        this.router.get("/get-list", [
        ], this.getList.bind(this));
        this.router.delete("/delete/:oppEmail", [
            param('oppEmail').isEmail(),
            validatorErrorChecker,
        ], this.deleteFriend.bind(this));
        this.router.patch("/blocking", [
            body("oppEmail").isEmail(),
            validatorErrorChecker
        ], this.blockingFriend.bind(this));
        this.router.patch("/unblocking", [
            body("oppEmail").isEmail(),
            validatorErrorChecker
        ], this.unBlockingFriend.bind(this));

        this.router.get("/get-blocking-friend", this.getBlockingFriends.bind(this));
    }

    async getList(req, res, next) {
        try {
            const userEmail = req.user;

            const friends = await this.service.getFriendsByEmail(userEmail);

            res.status(200).json({ friends: friends });

        } catch (err) {
            next(err);
        }
    }

    // 친구 차단.
    // 차단하면 friend, joinRoom ... 등의 데이터들의 상태를 false로 바꿔줘야함.
    async blockingFriend(req, res, next) {
        try {
            const userEmail = req.user;

            const { oppEmail } = req.body;

            await this.service.blockFriend({userEmail, oppEmail});

            res.status(200).json({msg : "success"});
        } catch (err) {
            next(err);
        }
    }

    async unBlockingFriend(req, res, next) {
        try{
            const userEmail = req.user;

            const { oppEmail } = req.body;

            await this.service.unblockFriend({userEmail, oppEmail});

            res.status(200).json({msg : "success"});
        }catch(err){
            next(err);
        }
    }

    async getBlockingFriends(req,res,next){
        try{
            const userEmail = req.user;

            const blockingFriends = await this.service.getblockingFriendsByEmail(userEmail);

            res.status(200).json(blockingFriends);
        }catch(err){
            next(err);
        }
    }

    async deleteFriend(req, res, next) {
        try {
            const userEmail = req.user;

            const { oppEmail } = req.params;

            // 친구가 삭제될 때는 friend, request,room,chatting이 동시에 삭제 됨. => deleted 테이블에 삽입해야 함.
            await this.service.deleteFriend({ userEmail, oppEmail });

            res.status(204).json({});

        } catch (err) {
            next(err);
        }
    }

}
const friendController = new FriendController();
export default friendController;