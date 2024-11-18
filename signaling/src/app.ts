import express from "express";
import http from "http";
import { Server } from 'socket.io';
import { PrismaClient } from "@prisma/client";
import cors from 'cors';
import bodyParser from "body-parser";
import 'dotenv/config'

// const options = {
//     key: fs.readFileSync(`${process.env.CERTS_PATH}/server-key.pem`, 'utf8'),
//     cert: fs.readFileSync(`${process.env.CERTS_PATH}/server-cert.pem`, 'utf8')
// };

// const httpsServer = https.createServer(options);
const app = express();

const server = http.createServer(app);

const prisma = new PrismaClient();
(async () => {
    await prisma.socket.deleteMany();
    await prisma.room.updateMany({
        data: {
            userCount: 0
        }
    });
    // await prisma.room.deleteMany();

})();

const io = new Server(server, {
    cors: {
        origin: `${process.env.CORS_ORIGIN}`,
        credentials: true,
    },
});

app.use(cors());
app.use(bodyParser.json())
console.log('CORS_ORIGIN: ', process.env.CORS_ORIGIN);

app.get('/get-room', async (req, res) => {
    try {
        let room = await prisma.room.findFirst({
            where: {
                userCount: {
                    lt: 6
                }
            }
        });

        if (!room) {
            room = await prisma.room.create({
                data: {
                    maxUsers: 5,
                    userCount: 0,
                },
            });
        }
        res.json(room);
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/get-room/:id', async (req, res) => {
    try {
        const room = await prisma.room.findUnique({
            where: {
                id: req.params.id
            },
            include: {
                Sockets: true
            }
        });

        if (!room) {
            res.status(404).send('Room not found');
        }
        res.json(room);
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
});


io.on('connection', (socket) => {

    socket.on('join-room', async ({ roomId, username }, callback) => {
        console.log('join-room', socket.id, username);
        socket.join(roomId);

        await prisma.room.update({
            where: {
                id: roomId
            },
            data: {
                userCount: {
                    increment: 1
                },
                Sockets: {
                    create: {
                        socketId: socket.id,
                        username: username
                    }
                }
            }
        });

        const user = await prisma.socket.findUnique({
            where: {
                socketId: socket.id
            }
        });
        socket.to(roomId).emit('user-joined', user);

        const otherUsers = await prisma.socket.findMany({
            where: {
                roomId: roomId,
                socketId: {
                    not: socket.id
                }
            }
        });

        callback(otherUsers);
    });

    socket.on('send-signal', async ({ to, signal, from }) => {
        console.log('send-signal', to, signal, from);
        socket.to(to).emit('receive-signal', { signal, from });
    });

    socket.on('toggle-transcription', ({socketId, enabled}) => {
        console.log('transcription enabled', enabled, 'for', socketId);

        const user = prisma.socket.findUnique({
            where: {
                socketId: socketId
            }
        });

        socket.to(socketId).emit('transcription-requested', ({ socketId: socket.id, enabled: enabled }));
    });


    socket.on('disconnect', async () => {

        const session = await prisma.socket.findUnique({
            where: {
                socketId: socket.id
            }
        });

        if (!session) {
            console.log('Session not found');
            return;
        }
        console.log('user disconnected', session.socketId);
        socket.broadcast.to(session.roomId).emit('user-disconnected', session.socketId);
        await prisma.room.update({
            where: {
                id: session.roomId
            },
            data: {
                userCount: {
                    decrement: 1
                }
            }
        });

        await prisma.socket.delete({
            where: {
                socketId: socket.id
            },
        });
    });
});

server.listen(8000, '0.0.0.0', () => {
    console.log('listening on *:8000');
});

