import { Router } from "express";

import { validatorErrorChecker } from "../../../middlewares/validator";
import { body } from "express-validator";
import TokenService from "../services/tokenService";

const service = new TokenService();

const router = Router();

export default router;

router.patch("upload-fcm-token", [body("fcmToken"), validatorErrorChecker],
    uploadFCMToken,
);

router.patch("delete-fcm-token", deleteFCMToken);

async function uploadFCMToken(req,res,next){
    try{
        const user = req.user;

        const { fcmToken } = req.body;

        const token = await service.checkToken({user});

        if(!token) throw { status : 404, msg : "not found : userSocketToken" };

        await service.patchUploadToken({user, fcmToken});

        res.status(200).json({msg : "success"});
    }catch(err){
        next(err);
    }
}

async function deleteFCMToken(req,res,next){
    try{
        const user = req.user;

        const token = await service.checkToken({user});

        if(!token) throw { status : 404, msg : "not found : userSocketToken" };

        await service.patchNullToken({user});

        res.status(200).json({msg : "success"});
    }catch(err){
        next(err);
    }
}