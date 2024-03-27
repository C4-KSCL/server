import requestController from "../models/requests/controllers/requestController";
import roomController from "../models/rooms/controllers/roomController";
import userController from "../models/users/controllers/userController";
import chatController from "../models/chats/controllers/chatController";
import eventController from "../models/events/controllers/eventController";
import friendController from "../models/friends/controllers/friendController";

const Controllers = [chatController, roomController, userController, requestController, eventController, friendController];

export default Controllers;