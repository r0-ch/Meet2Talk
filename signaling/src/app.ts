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
const APP_ID = "2bed04bd3e17acf79e12a149c165f197";
      // ❗❗❗ DO NOT USE YOUR TOKEN IN THE BROWSER FOR PRODUCTION. It should be kept and used server-side.
      const APP_TOKEN = "d42be833915eb3db59cab405a93e5d7af70e29b38080c909a578ffa4190d600e";
      // We'll use this for authentication when making requests to the Calls API.
      const headers = {
        Authorization: `Bearer ${APP_TOKEN}`,
      };
const API_BASE = `https://rtc.live.cloudflare.com/v1/apps/${APP_ID}`;

const prisma = new PrismaClient();
(async () => {
    await prisma.session.deleteMany();
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


async function createChannel(sessionId: string){
    const channel1resp = await fetch(
        `${API_BASE}/sessions/${sessionId}/datachannels/new`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                dataChannels: [
                    {
                        location: "local",
                        dataChannelName: "channel-one",
                    },
                ],
            }),
        }
    ).then((res) => res.json());

    return channel1resp;
}

async function connectToSessionID(sessionId: string, remoteSessionId: string){
    const session = await fetch(
        `${API_BASE}/sessions/${sessionId}/datachannels/new`,
        {
            method: "POST",
            headers,
            body: JSON.stringify({
                dataChannels: [
                    {
                        location: "remote",
                        sessionId: remoteSessionId,
                        dataChannelName: "channel-one",
                    },
                ],
            }),
        }
    ).then((res) => res.json());

    return session;
}
// const connections = io.of('/signaling');

app.get('/get-room', async (req, res) => {
    try{
    let room = await prisma.room.findFirst({
        where: {
            userCount: {
                lt: 6
            }
        }
    });

    if(!room) {
        room = await prisma.room.create({
            data: {
                maxUsers: 5,
                userCount: 0,
            },
        });
    }
    res.json(room);
}catch(err){
    console.log(err);
    res.status(500).send('Internal Server Error');
}
});

app.post('/join-room', async (req, res) => {
    try {
        const { roomId, localDescription, tracks } = req.body;
        console.log('join-room', roomId, localDescription, tracks);
        let room = await prisma.room.findFirst({
            where: {
                id: roomId,
                userCount: {
                    lt: 6
                }
            },
            include:{
                Sessions: true
            }
        });

        if(!room) {
            res.status(404).send('Room not found or full');
            return;
        }


        const session = await fetch(
            `${API_BASE}/sessions/new`,
            {
                method: "POST",
                headers,
                body: JSON.stringify({
                    sessionDescription: localDescription,
                }),
            }
        ).then((res) => res.json());

        const pushTracksResponse = await fetch(
            `${API_BASE}/sessions/${session.sessionId}/tracks/new`,
            {
              method: "POST",
              headers,
              body: JSON.stringify({
                sessionDescription: localDescription,
                tracks,
              }),
            },
          ).then((res) => res.json());

        await prisma.session.create({
            data: {
                roomId: roomId,
                sessionId: session.sessionId,
            }
        });
        room = await prisma.room.update({
            where: {
                id: roomId
            },
            data: {
                userCount: {
                    increment: 1
                }
            },
            include:{
                Sessions: true
            }
        });

        res.json({
            sessionId: session.sessionId,
            sessionDescription: session.sessionDescription,
            sessions: room.Sessions || [],
            tracks: pushTracksResponse,
        });
    } catch (err) {
        console.log(err);
        res.status(500).send('Internal Server Error');
    }
});


io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('join-room', async ({roomId, sessionId}) => {
        console.log('join-room', roomId, sessionId);
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', sessionId);
        const session = await prisma.session.findFirst({
            where: {
                sessionId: sessionId
            }
        });

        if(!session) {
            console.log('Session not found');
            return;
        }

        await prisma.session.update({
            where: {
                id: session.id
            },
            data: {
                socketId: socket.id
            }
        });
    });

    socket.on('disconnect', async() => {
        console.log('user disconnected');
        const session = await prisma.session.findFirst({
            where: {
                socketId: socket.id
            }
        });

        if(!session) {
            console.log('Session not found');
            return;
        }

        socket.to(session.roomId).emit('user-disconnected', session.sessionId);
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

        await prisma.session.delete({
            where: {
                id: session.id
            }
        });
    });
});








server.listen(8000, () => {
    console.log('listening on *:8000');
  });

