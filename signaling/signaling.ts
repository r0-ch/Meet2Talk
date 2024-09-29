import * as socket from 'socket.io';
import * as http from 'http';

const server = http.createServer();
const io = new socket.Server(server,
    {
        cors: {
            origin: '*',
            methods: ['GET', 'POST']
        }
    }
);

const rooms: any = {};

try {
    io.on('connection', (socket) => {
        socket.on('join room', (roomId) => {
            if (rooms[roomId]) {
                rooms[roomId].push(socket.id);
                console.log('room exist: \n' + JSON.stringify(rooms[roomId]));
            } else {
                rooms[roomId] = [socket.id];
                console.log('rooms id: \n' + JSON.stringify(roomId));
                console.log('rooms socket: \n' + JSON.stringify(socket.id));
                console.log('rooms: \n' + JSON.stringify(rooms));
                console.log('room not exist: \n' + JSON.stringify(rooms[roomId]));
            }
            const otherUser = rooms[roomId].find((id: any) => id !== socket.id);
            if (otherUser) {
                socket.emit('other user', otherUser);
                socket.to(otherUser).emit('user joined', socket.id);
                console.log('otherUser: \n'+otherUser);
            }
        });

        socket.on('offer', (payload) => {
            io.to(payload.target).emit('offer', payload);
            console.log('offer : \n' + JSON.stringify(payload));
        });

        socket.on('answer', (payload) => {
            io.to(payload.target).emit('answer', payload);
            console.log('answer : \n' + JSON.stringify(payload));
        });

        socket.on('ice-candidate', (incoming) => {
            io.to(incoming.target).emit('ice-candidate', incoming.candidate);
            console.log('ice-candidate : \n' + JSON.stringify(incoming));
        });
    });

    server.listen(8000, () => {
        console.log('Server listening on port 8000');
    }).on('error', (e) => {
        console.error(e);
    });
} catch (e) {
    console.error(e);
}
