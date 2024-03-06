import { Server } from "socket.io";
// import { createAdapter } from "@socket.io/redis-adapter";
// import { createClient } from "redis";
import { SocketController } from "./controllers/socketController";

export const SocketServer = async (httpServer) => {
    const io = new Server(httpServer);

    // const pubClient = createClient({ host: 'localhost', port: 6379 });
    // const subClient = pubClient.duplicate();

    // Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    //     io.adapter(createAdapter(pubClient, subClient));
    // });

    io.on('connection', async (socket) => {
        const controller = new SocketController(io, socket);

        socket.broadcast.emit('hello', 'to all clients except sender');

        socket.on("join room", controller.joinRoom.bind(controller));

        socket.on("send message", controller.newMessage.bind(controller));

        socket.on("new event", controller.newEvent.bind(controller));

        socket.on("delete message", controller.deleteMsg.bind(controller));

        socket.on("disconnecting", controller.disconnecting.bind(controller));
    });
} 