import { Router } from "express";
import { FriendService } from "../services/friendService";
import database from "../../../database";

import { validatorErrorChecker } from "../../../middlewares/validator";

import { param, query, body } from "express-validator";

const service = new FriendService();
const router = Router();

export default router;

router.get("/get-list", [
], getList);
router.delete("/delete/:oppEmail", [
    param('oppEmail').isEmail(),
    validatorErrorChecker,
], deleteFriend);
router.patch("/blocking", [
    body("oppEmail").isEmail(),
    validatorErrorChecker
], blockingFriend);
router.patch("/unblocking", [
    body("oppEmail").isEmail(),
    validatorErrorChecker
], unBlockingFriend);

router.get("/get-blocking-friend", getBlockingFriends);

async function getList(req, res, next) {
    try {
        const userEmail = req.user;

        const friends = await service.getFriendsByEmail(userEmail);

        res.status(200).json({ friends: friends });

    } catch (err) {
        next(err);
    }
}

// 친구 차단.
// 차단하면 friend, joinRoom ... 등의 데이터들의 상태를 false로 바꿔줘야함.
async function blockingFriend(req, res, next) {
    try {
        const userEmail = req.user;

        const { oppEmail } = req.body;

        await service.blockFriend({userEmail, oppEmail});

        res.status(200).json({msg : "success"});
    } catch (err) {
        next(err);
    }
}

async function unBlockingFriend(req, res, next) {
    try{
        const userEmail = req.user;

        const { oppEmail } = req.body;

        await service.unblockFriend({userEmail, oppEmail});

        res.status(200).json({msg : "success"});
    }catch(err){
        next(err);
    }
}

async function getBlockingFriends(req,res,next){
    try{
        const userEmail = req.user;

        const blockingFriends = await service.getblockingFriendsByEmail(userEmail);

        res.status(200).json(blockingFriends);
    }catch(err){
        next(err);
    }
}

async function deleteFriend(req, res, next) {
    try {
        const userEmail = req.user;

        const { oppEmail } = req.params;

        // 친구가 삭제될 때는 friend, request,room,chatting이 동시에 삭제 됨. => deleted 테이블에 삽입해야 함.
        await service.deleteFriend({ userEmail, oppEmail });

        res.status(204).json({});

    } catch (err) {
        next(err);
    }
}
