import requestController from "../models/rooms/controllers/requestController";
import roomController from "../models/rooms/controllers/roomController";
import userController from "../models/users/controllers/userController";
import chatController from "../models/chats/controllers/chatController";
import eventController from "../models/chats/controllers/eventController";
import friendController from "../models/friends/controllers/friendController";

const Controllers = [chatController, roomController, userController, requestController, eventController, friendController];

export default Controllers;