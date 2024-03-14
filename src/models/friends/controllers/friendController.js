import { Router } from "express";
import { FriendService } from "../services/friendService";
import database from "../../../database";

import { validatorErrorChecker } from "../../../middlewares/validator";

import { param, query } from "express-validator";

class FriendController {
    path = "/friends";
    router;
    service;

    constructor(){
        this.router = Router();
        this.service = new FriendService();
        this.init();
    }

    init(){
        this.router.get("/get-list",[
        ],this.getList.bind(this));
        this.router.delete("/delete/:oppEmail",[
            param('oppEmail').isEmail(),
            validatorErrorChecker,
        ],this.deleteFriend.bind(this));
    }

    async getList(req,res,next){
        try{
            const userEmail = req.user;

            const resultFriends = await database.$transaction(async(db)=>{
                this.service.setDB(db);

                const friends = await this.service.getFriendsByEmail(userEmail);

                return friends;
            });


            res.status(200).json({friends : resultFriends});

        }catch(err){
            next(err);
        }
    }

    async deleteFriend(req,res,next){
        try{
            const userEmail = req.user;

            const { oppEmail } = req.param;

            await database.$transaction(async(db)=>{
                this.service.setDB(db);

                await this.service.deleteFriend({userEmail, oppEmail});
            });

            res.status(204).json({});

        }catch(err){
            next(err);
        }
    }

}
const friendController = new FriendController();
export default friendController;