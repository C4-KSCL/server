import requestController from "../models.friends_chats/rooms/controllers/requestController";
import roomController from "../models.friends_chats/rooms/controllers/roomController";
import userController from "../models.friends_chats/users/controllers/userController";
import chatController from "../models.friends_chats/chats/controllers/chatController";
import eventController from "../models.friends_chats/chats/controllers/eventController";
import friendController from "../models.friends_chats/friends/controllers/friendController";

const Controllers = [chatController, roomController, userController, requestController, eventController, friendController];

export default Controllers;