import { Router } from "express";
import { UserService } from "../services/userService";

import { validatorErrorChecker } from "../../../middlewares/validator";
import { body } from "express-validator";

class UserController {
    path = "/users";
    router;
    service;

    constructor(){
        this.router = Router();
        this.service = new UserService();
        this.init();
    }

    init(){
        this.router.post("/create",[
            body('email').isEmail(),
            body('nickname'),
            validatorErrorChecker
        ], this.createUser.bind(this));
        this.router.get("/",this.getUsers.bind(this));
    }

    async createUser(req,res,next){
        try{
            const { email, nickname } = req.body;

            const user = await this.service.createUser({email : email, nickname : nickname});

            if(!user) throw { status : 400, msg : "fail to create user" };

            res.status(201).json(user);
        }catch(err){
            next(err);
        }
    }

    async getUsers(req,res,next){
        try{
            const users = await this.service.getUsers();

            if(users.length === 0) throw { status : 404, msg : "not found : user"};

            res.status(200).json(users);
        }catch(err){
            next(err);
        }
    }
}

const userController = new UserController();
export default userController;