import https from 'https';
import http from 'http';
import { Server } from 'socket.io';
import * as mediasoup from 'mediasoup';
import fs from 'fs';
import { consumers } from 'stream';
import 'dotenv/config'

// const options = {
//     key: fs.readFileSync(`${process.env.CERTS_PATH}/server-key.pem`, 'utf8'),
//     cert: fs.readFileSync(`${process.env.CERTS_PATH}/server-cert.pem`, 'utf8')
// };

// const httpsServer = https.createServer(options);

const httpsServer = http.createServer(
    (req, res) => {
        res.writeHead(200);
        res.end('hello world\n');
    }
);


const io = new Server(httpsServer, {
    cors: {
        origin: `${process.env.CORS_ORIGIN}`,
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
console.log('CORS_ORIGIN: ', process.env.CORS_ORIGIN);

// const connections = io.of('/signaling');

httpsServer.listen(8000, () => {
    console.log('Server listening on port 8000');


}).on('error', (e) => {
    console.error(e);
});

let worker: mediasoup.types.Worker;
let rooms: any = {};

const mediaCodecs: mediasoup.types.RtpCodecCapability[] = [
    {
        kind: 'audio' as const,
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2
    },
    {
        kind: 'video' as const,
        mimeType: 'video/VP8',
        clockRate: 90000,
        parameters: {
            'x-google-start-bitrate': 1000
        }
    }
];

const createWorker = async () => {
    const worker = await mediasoup.createWorker({
        rtcMinPort: 2000,
        rtcMaxPort: 2020,
    });

    console.log('mediasoup worker created');

    worker.on('died', () => {
        console.error('mediasoup worker died');
        process.exit(1);
    });

    return worker;
}

const createWebRtcTransport = async (router: any) => {
    return new Promise(async (resolve, reject) => {
        try {
            const webRtcTransport_options = {
                listenInfos:
                    [
                        {
                            protocol: "udp",
                            ip: `${process.env.WEBRTC_LISTEN_IP}`,
                        },
                        {
                            protocol: "tcp",
                            ip: `${process.env.WEBRTC_LISTEN_IP}`,
                        }
                    ],
                    
                enableUdp: true,
                enableTcp: true,
                preferUdp: true,
                enableSctp: true,

                // stunServers: [
                //     {
                //         urls: 'stun:stun.l.google.com:19302',

                //     }
                // ]
            }
            console.log('WebRTC transport options: ', webRtcTransport_options);

            let transport = await router.createWebRtcTransport(webRtcTransport_options);
            console.log('Transport created:', transport.id);

            transport.on('dtlsstatechange', (dtlsState: any) => {
                if (dtlsState === 'closed') {
                    transport.close();
                }
            });

            transport.on('@close', () => {
                console.log('Transport closed');
            });

            resolve(transport);

        } catch (error) {
            reject(error);
        }
    });
}

(async () => {
    worker = await createWorker();
})();

try {
    io.on('connection', async (socket) => {
        console.log('Client connected: ', socket.id);

        socket.emit('connected', {
            socketId: socket.id,
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected: ', socket.id);
        });

        socket.on('leave-room', ({ roomId }) => {
            console.log('Client: ', socket.id, ' left room: ', roomId);

            if (rooms[roomId]) {
                const peer = rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id);

                if (peer) {
                    peer.transports.forEach(async (transport: any) => {
                        await transport.transport.close();
                    });

                    peer.producers.forEach(async (producer: any) => {
                        if (producer.producer) {
                            await producer.producer.close();
                        } else if (producer.dataProducer) {
                            await producer.dataProducer.close();
                        }
                    });

                    peer.consumers.forEach(async (consumer: any) => {
                        if (consumer.consumer) {
                            await consumer.consumer.close();
                        } else if (consumer.dataConsumer) {
                            await consumer.dataConsumer.close();
                        }
                    });

                    rooms[roomId]['peers'] = rooms[roomId]['peers'].filter((peer: any) => peer.socketId !== socket.id);

                    if (rooms[roomId]['peers'].length === 0) {
                        rooms[roomId]['router'].close();
                        delete rooms[roomId];
                    }
                }
            }

            socket.broadcast.to(roomId).emit('peer-left', socket.id);

            socket.leave(roomId);
        });

        socket.on('join-room', async ({ roomId, username }, callback) => {
            console.log('Client joined room: ', roomId);

            socket.join(roomId);

            if (!rooms[roomId]) {
                rooms[roomId] = {};
                rooms[roomId]['router'] = await worker.createRouter({ mediaCodecs });
                rooms[roomId]['peers'] = [];
                rooms[roomId]['peers'].push({
                    socketId: socket.id,
                    username: username,
                    transports: [],
                    producers: [],
                    dataProducers: [],
                    consumers: [],
                    dataConsumers: [],
                });
            } else {
                rooms[roomId]['peers'].push({
                    socketId: socket.id,
                    username: username,
                    transports: [],
                    producers: [],
                    consumers: [],
                });
            }

            // console.log('Peers in room: ', rooms[roomId]['peers']);

            const rtpCapabilities = rooms[roomId]['router'].rtpCapabilities;

            const otherPeers = rooms[roomId]['peers'].filter((peer: any) => peer.socketId !== socket.id);

            callback({ rtpCapabilities, otherPeers });
        });

        socket.on('new-peer', ({ roomId, username }) => {
            console.log('New peer joined room: ', roomId);

            socket.broadcast.to(roomId).emit('new-peer', rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id));
        });

        socket.on('createWebRtcTransport', async ({ roomId, direction }, callback) => {
            console.log('Create WebRTC transport');

            try {
                const router = rooms[roomId]['router'];
                const transport: any = await createWebRtcTransport(router);

                callback({
                    id: transport.id,
                    iceParameters: transport.iceParameters,
                    iceCandidates: transport.iceCandidates,
                    dtlsParameters: transport.dtlsParameters,
                    sctpParameters: transport.sctpParameters,
                });

                const peer = rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id);
                peer['transports'].push({
                    id: transport.id,
                    transport: transport,
                    direction: direction,
                });

                console.log(`WebRTC transport created: ${transport.id} direction: ${direction} for peer: ${socket.id} in room: ${roomId}`);
                console.log(`Transports for peer: ${socket.id} in room: ${roomId}: `, rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id).transports);
            } catch (error) {
                console.error(error);
                callback({
                    error: error,
                });
            }
        });

        socket.on('transport-connect', async ({ roomId, dtlsParameters, direction, transportId }) => {
            console.log('Transport connect direction: ', direction);
            console.log('Transport connect transportId: ', transportId);

            const transport = rooms[roomId]['peers']
                .find((peer: any) => peer.socketId === socket.id).transports
                .find((transport: any) => transport.id === transportId).transport;

            await transport.connect({ dtlsParameters });

            console.log(`WebRTC transport connected: ${transport.id} direction: ${direction} for peer: ${socket.id} in room: ${roomId}`);
        });

        socket.on('transport-produce', async ({ roomId, transportId, kind, rtpParameters, appData }, callback) => {
            console.log('Produce');

            const transport = rooms[roomId]['peers']
                .find((peer: any) => peer.socketId === socket.id).transports
                .find((transport: any) => transport.direction === 'send').transport;

            const producer = await transport.produce({ kind, rtpParameters });

            callback({ id: producer.id });

            const peer = rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id);
            peer['producers'].push({
                id: producer.id,
                producer: producer,
                kind: kind,
            });

            callback({ id: producer.id });

            console.log(`Producer created: ${producer.id} kind: ${kind} for peer: ${socket.id} in room: ${roomId}`);
            console.log(`Producers for peer: ${socket.id} in room: ${roomId}: `, rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id).producers);
        });

        socket.on('transport-produce-data', async ({ roomId, transportId, sctpStreamParameters, label, protocol, appData }, callback) => {
            console.log('Produce data');

            const transport = rooms[roomId]['peers']
                .find((peer: any) => peer.socketId === socket.id).transports
                .find((transport: any) => transport.direction === 'send').transport;

            const dataProducer = await transport.produceData({
                sctpStreamParameters,
                label,
                protocol,
            });

            callback({ id: dataProducer.id });

            const peer = rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id);
            peer['producers'].push({
                id: dataProducer.id,
                dataProducer: dataProducer,
            });

            console.log(`Data producer created: ${dataProducer.id} for peer: ${socket.id} in room: ${roomId}`);
            console.log(`Data producers for peer: ${socket.id} in room: ${roomId}: `, rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id).producers);

        });

        socket.on('transport-consume', async ({ roomId, producerId, rtpCapabilities, transportId }, callback) => {
            console.log('Consume');

            const router = rooms[roomId]['router'];

            console.log(`can consume: producer ${producerId}, ${rtpCapabilities} })}`);
            if (!router.canConsume({ producerId, rtpCapabilities })) {
                console.error('Can not consume');
                return;
            }

            const transport = rooms[roomId]['peers']
                .find((peer: any) => peer.socketId === socket.id).transports
                .find((transport: any) => transport.id === transportId).transport;

            const consumer = await transport.consume({
                producerId,
                rtpCapabilities,
                paused: true,
            });

            consumer.on('producerclose', () => {
                console.log('Producer closed');
                consumer.close();
            });

            consumer.on('transportclose', () => {
                console.log('Transport closed');
                consumer.close();
            });

            callback({
                id: consumer.id,
                producerId: producerId,
                kind: consumer.kind,
                rtpParameters: consumer.rtpParameters,
            });

            const peer = rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id);
            peer['consumers'].push({
                consumer: consumer,
                kind: consumer.kind,
            });

            console.log(`Consumer created: ${consumer.id} kind: ${consumer.kind} for peer: ${socket.id} in room: ${roomId}`);
            console.log('Consumers in room: ', rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id).consumers);
        });

        socket.on('transport-consume-data', async ({ roomId, dataProducerId, transportId }, callback) => {
            console.log('Consume data');

            console.log(`Consume data: ${dataProducerId}`);

            const transport = rooms[roomId]['peers']
                .find((peer: any) => peer.socketId === socket.id).transports
                .find((transport: any) => transport.id === transportId).transport;

            const dataConsumer = await transport.consumeData({
                dataProducerId,
                // sctpStreamParameters,
                // label,
                // protocol,
            });

            dataConsumer.on('transportclose', () => {
                console.log('Data consumer transport closed');
                dataConsumer.close();
            });

            dataConsumer.on('dataproducerclose', () => {
                console.log('Data producer closed');
                dataConsumer.close();
            });

            dataConsumer.on('message', (message: any) => {
                console.log('Data consumer message: ', message);
            });

            callback({
                id: dataConsumer.id,
                dataProducerId: dataProducerId,
                sctpStreamParameters: dataConsumer.sctpStreamParameters,
            });

            const peer = rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id);
            peer['consumers'].push({
                dataConsumer: dataConsumer,
            });

            console.log(`Data consumer created: ${dataConsumer.id} for peer: ${socket.id} in room: ${roomId}`);
            console.log('Data consumers in room: ', rooms[roomId]['peers'].find((peer: any) => peer.socketId === socket.id).dataConsumers);
        });

        socket.on('consumer-resume', async ({ roomId, serverConsumerId }) => {
            console.log('Consumer resume');
            console.log(`Consumer resume: ${serverConsumerId}`);

            const consumer = rooms[roomId]['peers']
                .find((peer: any) => peer.socketId === socket.id).consumers
                .find((consumer: any) => consumer.consumer?.id === serverConsumerId).consumer;

            await consumer.resume();
        });

    });
} catch (error) {
    console.error(error);
}
