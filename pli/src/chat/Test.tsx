import { useEffect } from "react";
import { io } from "socket.io-client";
import mediasoup, {Device} from "mediasoup-client";

const Test = () => {
    useEffect(() => {
        console.log('Test component mounted');

        const roomName = window.location.pathname.split('/')[2];

        const socket = io('https://localhost:8000/mediasoup', { 
            withCredentials: true,
            // transports: ['websocket']
         });

        const localVideo = document.getElementById('localVideo') as HTMLVideoElement;

        socket.on('connection-success', ({ socketId, existsProducer }) => {
            console.log(socketId, existsProducer);
            getLocalStream();
        });

        let device: mediasoup.Device;
        let rtpCapabilities: mediasoup.types.RtpCapabilities;
        let producerTransport: mediasoup.types.Transport;
        let producer: mediasoup.types.Producer;
        let consumerTransports: any[] = [];
        let consumer: mediasoup.types.Consumer;
        let isProducer = false;

        let params: any = {
            encoding: [
                { rid: 'r0', maxBitrate: 100000, scalabilityMode: 'S1T3' },
                { rid: 'r1', maxBitrate: 300000, scalabilityMode: 'S1T3' },
                { rid: 'r2', maxBitrate: 900000, scalabilityMode: 'S1T3' }
            ],
            codecOptions: {
                videoGoogleStartBitrate: 1000
            }
        };

        let consumingTransports: any = [];

        const getLocalStream = async () => {
            const media = await navigator.mediaDevices.getUserMedia({
              audio: false,
              video: {
                width: {
                  min: 640,
                  max: 1920,
                },
                height: {
                  min: 400,
                  max: 1080,
                }
              }
            })

            localVideo.srcObject = media;

            const track = media.getVideoTracks()[0];
            params = {
                track,
                ...params
            }

            joinRoom();
        };

        const joinRoom = async () => {
            socket.emit('joinRoom', { roomName }, (data: any) => {
                console.log('Router RTP Capabilities:', data);

                rtpCapabilities = data.rtpCapabilities;

                createDevice();
            });
        }

        // const goConsume = async () => {
        //     goConnect(false);
        // };

        // const goConnect = async (producerOrConsumer: any) => {
        //     isProducer = producerOrConsumer;
        //     device === undefined ? getRtpCapabilities() : goCreateTransport();
        // };

        // const goCreateTransport = async () => {
        //     isProducer ? createSendTransport() : createRecvTransport();
        // };

        const createDevice = async () => {
            try {
                device = new Device();

                await device.load({ routerRtpCapabilities: rtpCapabilities });

                console.log('RtpCapabilities:', device.rtpCapabilities);

                createSendTransport();
            } catch (err) {
                console.error(err);
            }
        };

        const getRtpCapabilities = async () => {
            socket.emit('createRoom', (data: any) => {
                console.log('RTP Capabilities:', data);

                rtpCapabilities = data.rtpCapabilities;

                createDevice();
            });
        };


        const getProducers = async () => {
            socket.emit('getProducers', (producerIds: []) => {
                producerIds.forEach(signalNewConsumerTransport);
            });
        }; 

        const createSendTransport = async () => {
            socket.emit('createWebRtcTransport', { consumer: false } , ({ params }: { params: any }) => {
                if (params.error) {
                    console.log('Error:', params.error);
                    console.error(params.error);
                    return;
                }

                console.log('createWebRtcTransport:', params);

                producerTransport = device.createSendTransport(params);

                producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
                    try {
                        await socket.emit('transport-connect', { 
                            dtlsParameters
                        });

                        callback();
                    } catch (err) {
                        errback(err as Error);
                    }
                });

                socket.on('new-producer', ({ producerId }) => signalNewConsumerTransport(producerId));

                producerTransport.on('produce', async (parameters, callback, errback) => {
                    console.log('Produce:', parameters);

                    try {
                        await socket.emit('transport-produce', {
                            transportId: producerTransport.id,
                            kind: parameters.kind,
                            rtpParameters: parameters.rtpParameters,
                            appData: parameters.appData
                        }, ({ id, producerExists }: { id: string, producerExists: any }) => {
                            callback({ id });

                            if (producerExists) {
                                getProducers();
                            }
                        });
                    } catch (err) {
                        errback(err as Error);
                    }
                });

                connectSendTransport();
            });

            
        };
        
        const connectSendTransport = async () => {
            producer = await producerTransport.produce(params);

            producer.on('trackended', () => {
                console.log('Track ended');
            });

            producer.on('transportclose', () => {
                console.log('Transport closed');
            }); 
        };

        const signalNewConsumerTransport = async (remoteProducerId: any) => {
            if (consumingTransports.includes(remoteProducerId)) return;
            consumingTransports.push(remoteProducerId);

            await socket.emit('createWebRtcTransport', { consumer: true }, ({ params }: { params: any }) => {
                if (params.error) {
                    console.error(params.error);
                    return;
                }

                console.log('createWebRtcTransport:', params);

                let consumerTransport: any;

                try {
                    consumerTransport = device.createRecvTransport(params);
                } catch (err) {
                    console.error(err);
                    return;
                }

                consumerTransport.on('connect', async ({ dtlsParameters }: { dtlsParameters: any }, callback: () => void, errback: (error: Error) => void) => {
                    try {
                        await socket.emit('transport-rcv-connect', { 
                            dtlsParameters,
                            serverConsumerTransportId: params.id
                        });

                        callback();
                    } catch (err) {
                        errback(err as Error);
                    }
                });

                // consumerTransport.on('consume', async (parameters, callback, errback) => {
                //     console.log('Consume:', parameters);

                //     try {
                //         await socket.emit('transport-consume', {
                //             transportId: consumerTransport.id,
                //             producerId: parameters.producerId,
                //             rtpCapabilities: device.rtpCapabilities
                //         }, ({ id, kind, rtpParameters }: { id: string, kind: string, rtpParameters: any }) => {
                //             callback({ id, kind, rtpParameters });
                //         });
                //     } catch (err) {
                //         errback(err as Error);
                //     }
                // });

                connectRecvTransport(consumerTransport, remoteProducerId, params.id);
            });
        };

        const connectRecvTransport = async (consumerTransport: any, remoteProducerId: any, serverConsumerTransportId: any) => {
            await socket.emit('consume', {
                rtpCapabilities: device.rtpCapabilities,
                remoteProducerId,
                serverConsumerTransportId
            }, async ({ params }: { params: any }) => {
                if (params.error) {
                    console.error(params.error);
                    return;
                }

                console.log('consume:', params);
                const consumer = await consumerTransport.consume({
                    id: params.id,
                    producerId: params.producerId,
                    kind: params.kind,
                    rtpParameters: params.rtpParameters
                });

                consumerTransports = [
                    ...consumerTransports,
                    {
                        consumerTransport,
                        serverConsumerTransportId,
                        producerId: remoteProducerId,
                        consumer
                    }
                ];

                const newElement = document.createElement('div');
                newElement.setAttribute('id', `td-${remoteProducerId}`);
                newElement.setAttribute('class', 'remoteVideo');
                newElement.innerHTML = `<video id="${remoteProducerId}" class="video" autoplay></video>`;
                document.getElementById('videoContainer')?.appendChild(newElement);

                const { track } = consumer;

                // const remoteVideo = document.getElementById('remoteVideo') as HTMLVideoElement;
                // remoteVideo.srcObject = new MediaStream([track]);
                const remoteVideoElement = document.getElementById(remoteProducerId) as HTMLVideoElement | null;
                if (remoteVideoElement) {
                    remoteVideoElement.srcObject = new MediaStream([track]);
                }

                // socket.emit('consumer-resume');
                socket.emit('consumer-resume', { serverConsumerId: params.serverConsumerId });
            });
        };

        socket.on('producer-closed', ({ remoteProducerId }) => {
            const producerToClose = consumerTransports.find(transportData => transportData.producerId === remoteProducerId);
            producerToClose?.consumerTransport.close();
            producerToClose?.consumer.close();

            consumerTransports = consumerTransports.filter(transportData => transportData.producerId !== remoteProducerId);

            const videoContainer = document.getElementById('videoContainer');
            const elementToRemove = document.getElementById(`td-${remoteProducerId}`);
            if (elementToRemove) {
                videoContainer?.removeChild(elementToRemove);
            }
        });



    });


    return (
    <div>
        <style>
            {`
                button {
                margin: 2;
                }
                tr {
                    vertical-align: top;
                }
                video {
                    width: 360px;
                    background-color: black;
                    padding: 10;
                    margin: 1px 1px;
                }
                .mainTable {
                    width: 100%;
                }
                .localColumn {
                    width: 246px;
                }
                .remoteColumn {
                    display: flex;
                    flex-wrap: wrap;
                }

                #localVideo {
                    width: 240;
                }
                .remoteVideo {
                    float: left;
                }

                .videoWrap {
                    margin: 3;
                    /* padding: 5; */
                    /* background-color: papayawhip; */
                    display: flex;
                    justify-content: center;
                }

                @media only screen and (max-width: 1060px) {
                    .video {
                        width: 300px;
                    }
                }

                @media only screen and (max-width: 940px) {
                    .video {
                        width: 240px;
                    }
                }
            `}
        </style>
        <div id="video">
            <table className="mainTable">
                <tbody>
                    <tr>
                        <td className="localColumn">
                            <video id="localVideo" autoPlay className="video" muted ></video>
                        </td>
                        <td className="remoteColumn">
                            <div id="videoContainer"></div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <table>
                <tbody>
                    <tr>
                        <td>
                            
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
    );
};

export default Test;