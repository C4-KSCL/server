import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import dotenv from "dotenv";

import { promisify } from "util";

import { SocketController } from "./controllers/socketController";
import { verfiyForSocket } from "../middlewares/auth";

export const SocketServer = async (httpServer) => {
    
    const io = new Server(httpServer);
    //
    const pubClient = createClient({ legacyMode: false, host: 'localhost', port: 6379});
    // const pubClient = createClient({ legacyMode: false, url: 'redis://redis:6379' });
    const subClient = pubClient.duplicate();

    // Redis 클라이언트에 대한 오류 이벤트 핸들러 추가
    pubClient.on("error", (err) => {
        console.error(`pubClient 오류: ${err}`);
    });

    subClient.on("error", (err) => {
        console.error(`subClient 오류: ${err}`);
    });
    

    try {
        // Redis 클라이언트 연결
        await pubClient.connect();
        await subClient.connect();

        // Redis 연결이 완료되면 어댑터 설정
        io.adapter(createAdapter(pubClient, subClient));

        io.use(async (socket, next) => {
            try {
                const token = socket.handshake.auth.token;
                // const token = socket.handshake.query.token;

                socket.userEmail = await verfiyForSocket(token);

                if (!socket.userEmail) {
                    throw { msg: "denied verfication" };
                }

                console.log(socket.userEmail);
                next();
            } catch (err) {
                next(err);
            }
        }).on('connection', async (socket) => {
            const controller = new SocketController(io, socket);

            socket.broadcast.emit('hello', 'to all clients except sender');

            controller.setRoomId.bind(controller);

            socket.on("join room", controller.joinRoom.bind(controller));

            socket.on("send message", controller.newMessage.bind(controller));

            socket.on("new event", controller.newEvent.bind(controller));

            socket.on("delete message", controller.deleteMsg.bind(controller));

            socket.on("disconnecting", controller.disconnecting.bind(controller));

        });
    } catch (error) {
        console.error(`Redis 연결 오류: ${error}`);
    }
}
