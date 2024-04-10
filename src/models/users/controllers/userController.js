import { Router } from "express";
import { UserService } from "../services/userService";

import { validatorErrorChecker } from "../../../middlewares/validator";
import { body } from "express-validator";

const service = new UserService();

const router = Router();

router.post("/create", [
    body('email').isEmail(),
    body('nickname'),
    validatorErrorChecker
], createUser);

router.get("/", getUsers);

export default router;

async function createUser(req, res, next) {
    try {
        const { email, nickname } = req.body;

        const user = await service.createUser({ email: email, nickname: nickname });

        if (!user) throw { status: 400, msg: "fail to create user" };

        res.status(201).json(user);
    } catch (err) {
        next(err);
    }
}

async function getUsers(req, res, next) {
    try {
        const users = await service.getUsers();

        if (users.length === 0) throw { status: 404, msg: "not found : user" };

        res.status(200).json(users);
    } catch (err) {
        next(err);
    }
}

