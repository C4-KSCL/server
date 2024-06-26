import requestController from "../models/requests/controllers/requestController";
import roomController from "../models/rooms/controllers/roomController";
import userController from "../models/users/controllers/userController";
import chatController from "../models/chats/controllers/chatController";
import eventController from "../models/events/controllers/eventController";
import friendController from "../models/friends/controllers/friendController";
import tokenController from "../models/fcm-tokens/controllers/tokenContoller";

import { Router } from "express";
import { verifyAccessToken } from "../../middleware/auth";

const router = Router();

if(process.env.NODE_ENV !== "production"){
    router.use("/users", userController);
}
router.use("/requests", verifyAccessToken, requestController);
router.use("/rooms", verifyAccessToken, roomController);
router.use("/chats", verifyAccessToken, chatController);
router.use("/events", verifyAccessToken, eventController);
router.use("/friends", verifyAccessToken, friendController);
router.use("/alarms", verifyAccessToken, tokenController);

export default router;