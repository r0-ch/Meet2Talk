import { io, Socket } from "socket.io-client";
import mediasoup, { Device } from "mediasoup-client";
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import backgroundImage from '../img/worldwide.jpg'; // Chemin vers l'image

const ChatRoom = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { username = 'Guest' } = useLocation().state as { username: string } || {};
    const socketRef = useRef<Socket | null>(null);
    const localSocketIdRef = useRef<string | null>(null);
    const rtpCapabilitiesRef = useRef<mediasoup.types.RtpCapabilities | null>(null);
    const localDeviceRef = useRef<Device | null>(null);
    const localProducerTransportRef = useRef<mediasoup.types.Transport | null>(null);
    const localVideoProducerRef = useRef<mediasoup.types.Producer | null>(null);
    const localAudioProducerRef = useRef<mediasoup.types.Producer | null>(null);
    const localDataProducerRef = useRef<mediasoup.types.DataProducer | null>(null);
    const [remotePeers, setRemotePeers] = useState<any>([]);
    const [remoteVideoElements, setRemoteVideoElements] = useState<HTMLElement[]>([]);
    const [remoteTrackGroups, setRemoteTrackGroups] = useState<any>([]);
    const [messages, setMessages] = useState<{ username: string, message: string, translated: string | null }[]>([]);
    const roomJoinedRef = useRef<boolean>(false);
    // const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    // const { username } = location.state || { username: 'You' };
    const [currentMessage, setCurrentMessage] = useState('');
    // const [messages, setMessages] = useState<{ text: string; user: number }[]>([]);
    const [profilePictures, setProfilePictures] = useState<string[]>([]);
    const [users, setUsers] = useState<{ username: string }[]>([]);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false); // État pour la visibilité de la sidebar
    const messagesEndRef = useRef<HTMLDivElement>(null); // Déclaration du type
    const allProfilePictures = [
        "https://picsum.photos/id/77/367/267",
        "https://picsum.photos/id/40/367/267",
        "https://picsum.photos/id/58/367/267",
        "https://picsum.photos/id/122/367/267",
        "https://picsum.photos/id/183/367/267",
        "https://picsum.photos/id/217/367/267",
        "https://picsum.photos/id/219/367/267",
        "https://picsum.photos/id/250/367/267",
        "https://picsum.photos/id/275/367/267",
        "https://picsum.photos/id/306/367/267",
    ];

    const getRandomProfiles = () => {
        const shuffled = [...allProfilePictures].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    };

    let videoParams: any = {
        encoding: [
            { rid: 'r0', maxBitrate: 100000, scalabilityMode: 'S1T3' },
            { rid: 'r1', maxBitrate: 300000, scalabilityMode: 'S1T3' },
            { rid: 'r2', maxBitrate: 900000, scalabilityMode: 'S1T3' }
        ],
        codecOptions: {
            videoGoogleStartBitrate: 1000
        }
    };

    let audioParams: any = {
        codecOptions: {
            opusStereo: 1
        }
    };

    useEffect(() => {
        const socket = io(`${process.env.REACT_APP_BACKEND}`, {
            path: '/socket.io',
            withCredentials: true,
            // tryAllTransports: true,
        });
        console.log(`api: ${process.env.REACT_APP_BACKEND}`);
        socketRef.current = socket;

        // socket.on("connect_error", () => {
        //     // revert to classic upgrade
        //     socket.io.opts.transports = ["polling", "websocket"];
        // });

        startCall();

        window.addEventListener('beforeunload', leaveRoom);

        return () => {
            leaveRoom();
        };
    }, []);

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentMessage.trim()) {
            sendMessage(currentMessage);
        }
    };
    // Permet de mettre à jour la liste des utilisateurs
    useEffect(() => {
        if (!users.some(user => user.username === username)) {
            setUsers((prevUsers) => [...prevUsers, { username }]);
        }
    }, [username]);

    // Fonction pour scroller jusqu'au dernier message
    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    // Utilisation de useEffect pour scroller dès que `messages` change
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Leave the room
    const leaveRoom = () => {
        socketRef.current?.emit('leave-room', { roomId });
        socketRef.current?.disconnect();
    };

    // Get and return the local stream
    const getLocalStream = async () => {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
        });

        console.log('Local stream: ', mediaStream);

        return mediaStream;
    };

    // Handle the local stream and set it to the local video element
    const handleLocalStream = (localStream: MediaStream) => {
        return new Promise<void>((resolve) => {
            const localVideoElement = document.getElementById('localVideo') as HTMLVideoElement;
            localVideoElement.srcObject = localStream;

            const videoTrack = localStream.getVideoTracks()[0];
            const audioTrack = localStream.getAudioTracks()[0];

            videoParams = {
                track: videoTrack,
                ...videoParams
            };

            audioParams = {
                track: audioTrack,
                ...audioParams
            };

            localVideoElement.onloadedmetadata = () => {
                resolve();
            };
        });
    };

    // Create and retun a new device
    const createDevice = () => {
        return new Promise<void>(async (resolve, reject) => {
            try {
                localDeviceRef.current = new Device();
                if (rtpCapabilitiesRef.current !== null) {
                    await localDeviceRef.current?.load({ routerRtpCapabilities: rtpCapabilitiesRef.current });
                    console.log('Device created: ', localDeviceRef.current);
                    resolve();
                } else {
                    reject(new Error("RTP Capabilities not set"));
                }
            } catch (error) {
                console.error("Failed to create device:", error);
                reject(error);
            }
        });
    };


    const createSendTransport = () => {
        return new Promise<void>((resolve) => {
            socketRef.current?.emit('createWebRtcTransport', { roomId, direction: 'send' }, (data: any) => {
                if (data.error) {
                    console.error('Create send transport error: ', data.error);
                    return;
                }

                console.log('Create send transport: ', data);

                localProducerTransportRef.current = localDeviceRef.current?.createSendTransport(data) || null;
                console.log('Local producer transport: ', localProducerTransportRef.current);

                localProducerTransportRef.current?.on('connect', async ({ dtlsParameters }, callback, errback) => {
                    console.log('Producer transport connected');
                    socketRef.current?.emit('transport-connect', { roomId, dtlsParameters, direction: 'send', transportId: data.id });
                    callback();
                });

                localProducerTransportRef.current?.on('produce', async ({ kind, rtpParameters, appData }, callback, errback) => {
                    console.log('Produce event');

                    try {
                        socketRef.current?.emit('transport-produce', {
                            roomId,
                            transportId: localProducerTransportRef.current?.id,
                            kind,
                            rtpParameters,
                            appData
                        }, ({ id }: any) => {
                            console.log('Produce: ', id);
                            callback({ id });
                        })
                    } catch (error) {
                        console.error('Produce error: ', error);
                        errback(error as Error);
                    }
                });

                localProducerTransportRef.current?.on('producedata', async ({ sctpStreamParameters, label, protocol }, callback, errback) => {
                    console.log('Produce data event');

                    try {
                        socketRef.current?.emit('transport-produce-data', {
                            roomId,
                            transportId: localProducerTransportRef.current?.id,
                            sctpStreamParameters,
                            label,
                            protocol
                        }, ({ id }: any) => {
                            console.log('Produce data: ', id);
                            callback({ id });
                        });
                    } catch (error) {
                        console.error('Produce data error: ', error);
                        errback(error as Error);
                    }
                });

                resolve();
            });
        });
    }

    const produceVideo = async () => {
        localVideoProducerRef.current = await localProducerTransportRef.current?.produce(videoParams) || null;
        console.log('Local video producer: ', localVideoProducerRef.current);

        localVideoProducerRef.current?.on('trackended', () => {
            console.log('Track ended');
        });

        localVideoProducerRef.current?.on('transportclose', () => {
            console.log('Transport close');
        });
    }

    const produceAudio = async () => {
        localAudioProducerRef.current = await localProducerTransportRef.current?.produce(audioParams) || null;
        console.log('Local audio producer: ', localAudioProducerRef.current);

        localAudioProducerRef.current?.on('trackended', () => {
            console.log('Track ended');
        });

        localAudioProducerRef.current?.on('transportclose', () => {
            console.log('Transport close');
        });
    }

    const produceData = async () => {

        try {
            // localDataProducerRef.current = await localProducerTransportRef.current?.produceData({
            //     ordered: true,
            //     label: 'chat',
            //     protocol: 'chat'
            // }) || null;

            const localDataProducer = new Promise<any>((resolve) => {
                const dataProducer = localProducerTransportRef.current?.produceData({
                    ordered: true,
                    label: 'chat',
                    protocol: 'chat'
                });
                resolve(dataProducer);
            });

            localDataProducerRef.current = await localDataProducer;

            console.log('Local data producer: ', localDataProducerRef.current);

            localDataProducerRef.current?.on('transportclose', () => {
                console.log('Data producer transport close');
            });

            localDataProducerRef.current?.on('close', () => {
                console.log('Data producer close');
            });

            localDataProducerRef.current?.on('bufferedamountlow', () => {
                console.log('Data producer buffered amount low');
            });

            localDataProducerRef.current?.on('error', (error) => {
                console.error('Data producer error: ', error);
            });

            localDataProducerRef.current?.on('open', () => {
                console.log('Data producer open');
            });

            localDataProducerRef.current?.on('close', () => {
                console.log('Data producer close');
            });

            localDataProducerRef.current?.send('Hello');
        } catch (error) {
            console.error('Produce data error: ', error);
        }

    }

    const createReceiveTransport = async () => {
        return new Promise<any>((resolve) => {
            socketRef.current?.emit('createWebRtcTransport', { roomId, direction: 'recv' }, (data: any) => {
                console.log('Create receive transport: ', data);
                const consumerTransport = localDeviceRef.current?.createRecvTransport(data);

                consumerTransport?.on('connect', async ({ dtlsParameters }, callback, errback) => {
                    console.log('Consumer transport connected');
                    socketRef.current?.emit('transport-connect', { roomId, dtlsParameters, direction: 'recv', transportId: data.id });
                    callback();
                });

                resolve({ consumerTransport, serverReceiveTransportId: data.id });
            });
        });
    };

    const createConsumer = async (consumerTransport: any, producer: any, serverReceiveTransportId: any) => {
        return new Promise<any>((resolve) => {
            socketRef.current?.emit('transport-consume', {
                roomId,
                producerId: producer.id,
                rtpCapabilities: localDeviceRef.current?.rtpCapabilities,
                transportId: serverReceiveTransportId
            }, async (data: any) => {
                console.log('Consume: ', data);

                const consumer = await consumerTransport.consume({
                    id: data.id,
                    producerId: data.producerId,
                    kind: data.kind,
                    rtpParameters: data.rtpParameters,
                });

                console.log('Consumer: ', consumer);

                resolve({ consumer, id: data.id });
            });
        });
    };

    const createDataConsumer = async (consumerTransport: any, producer: any, serverReceiveTransportId: any) => {
        return new Promise<any>((resolve) => {
            socketRef.current?.emit('transport-consume-data', {
                roomId,
                dataProducerId: producer.id,
                rtpCapabilities: localDeviceRef.current?.rtpCapabilities,
                transportId: serverReceiveTransportId
            }, async (data: any) => {
                console.log('Consume data: ', data);

                const consumer = await consumerTransport.consumeData({
                    id: data.id,
                    dataProducerId: data.dataProducerId,
                    sctpStreamParameters: data.sctpStreamParameters,
                    label: 'chat',
                    protocol: 'chat'
                });

                consumer.on('message', (message: string) => {
                    console.log('Message: ', JSON.parse(message));
                    setMessages((prevMessages) => {
                        const updatedMessages = [...prevMessages, JSON.parse(message)];
                        console.log('Messages updated: ', updatedMessages);
                        return updatedMessages;
                    });
                });

                consumer.on('transportclose', () => {
                    console.log('Consumer transport close');
                });

                console.log('Consumer: ', consumer);

                resolve({ consumer, id: data.id });
            });
        });
    };

    const handleRemotePeer = async (peer: any) => {
        const { consumerTransport, serverReceiveTransportId } = await createReceiveTransport();
        console.log('Receive transport: ', consumerTransport);

        let serverConsumerId;

        const tracks: MediaStreamTrack[] = [];
        for (const producer of peer.producers) {
            if (producer.kind === 'audio' || producer.kind === 'video') {
                const { consumer, id } = await createConsumer(consumerTransport, producer, serverReceiveTransportId);
                serverConsumerId = id;
                console.log('Consumer: ', consumer);
                tracks.push(consumer.track);
                console.log('Tracks: ', tracks);
            }

            if (producer.dataProducer) {
                await createDataConsumer(consumerTransport, producer, serverReceiveTransportId);
            }
        }

        // const remoteVideoElement = document.createElement('video');
        // remoteVideoElement.dataset.socketId = peer.socketId;
        // const mediaStream = new MediaStream();
        // tracks.forEach((track) => {
        //     mediaStream.addTrack(track);
        // });
        // console.log('mediaStream: ', mediaStream);
        // remoteVideoElement.srcObject = mediaStream;

        // setRemoteVideoElements((prevElements: any) => {
        //     const updatedElements = [...prevElements, remoteVideoElement];
        //     console.log('Remote video elements: ', updatedElements);
        //     return updatedElements;
        // });

        setRemoteTrackGroups((prevTrackGroups: any) => {
            const updatedTrackGroups = [...prevTrackGroups, { socketId: peer.socketId, tracks }];
            console.log('Remote track groups: ', updatedTrackGroups);
            return updatedTrackGroups;
        });

        socketRef.current?.emit('consumer-resume', { roomId, serverConsumerId: serverConsumerId });
    };

    const informPeers = () => {
        socketRef.current?.emit('new-peer', { roomId, socketId: localSocketIdRef.current });
    }

    const joinRoom = () => {
        return new Promise<any>((resolve) => {
            socketRef.current?.emit('join-room', { roomId, username }, (data: any) => {
                console.log('Joined room: ', roomId);
                rtpCapabilitiesRef.current = data.rtpCapabilities;
                console.log('RTP Capabilities: ', rtpCapabilitiesRef.current);

                roomJoinedRef.current = true;

                // setRemotePeers((prevPeers: any) => {
                //     const updatedPeers = data.otherPeers;
                //     console.log('Other peers:', updatedPeers);
                //     return updatedPeers;
                // });

                // for (const peer of data.otherPeers) {
                //     handleRemotePeer(peer);
                // }

                resolve({ peers: data.otherPeers });
            });
        });
    };

    const handlePeerLeft = async () => {
        socketRef.current?.on('peer-left', (socketId: any) => {
            console.log('Peer left: ', socketId);

            setRemotePeers((prevPeers: any) => {
                const updatedPeers = prevPeers.filter((peer: any) => peer.socketId !== socketId);
                console.log('Remote peers updated: peer left: ', updatedPeers);
                return updatedPeers;
            });

            setRemoteTrackGroups((prevTrackGroups: any) => {
                const updatedTrackGroups = prevTrackGroups.filter((trackGroup: any) => trackGroup.socketId !== socketId);
                console.log('Remote track groups updated: peer left: ', updatedTrackGroups);
                return updatedTrackGroups;
            });
        });
    };


    const sendMessage = (message: string) => {
        const data = {
            username,
            message,
            translated: null
        }
        console.log('Sending message: ', data);
        localDataProducerRef.current?.send(JSON.stringify(data));

        setMessages((prevMessages: any) => {
            const updatedMessages = [...prevMessages, data];
            console.log('Messages updated: ', updatedMessages);
            return updatedMessages;
        });
    }

    // Start the call, this is the main function
    const startCall = async () => {

        socketRef.current?.on('connected', ({ socketId }) => {
            console.log('Connected to the server with socket id: ', socketId);
            localSocketIdRef.current = socketId;
        });

        const { peers } = await joinRoom();
        await handleLocalStream(await getLocalStream());
        await createDevice();
        await createSendTransport();
        await produceAudio();
        await produceVideo();
        await produceData();
        await informPeers();

        handlePeerLeft();

        if (peers.length > 0) {
            for (const peer of peers) {
                handleRemotePeer(peer);
            }
        }

        socketRef.current?.on('new-peer', (peer: any) => {
            console.log('New peer: ', peer);

            // setRemotePeers((prevPeers: any) => {
            //     const updatedPeers = [...prevPeers, peer];
            //     console.log('Remote peers updated: new peer: ', updatedPeers);
            //     return updatedPeers;
            // });

            handleRemotePeer(peer);
        });
    };


    // return (
    //     <div>
    //         <h1>Room: {roomId}</h1>
    //         <h2>Username: {username}</h2>
    //         <div id="videos">
    //             <video id="localVideo" autoPlay controls></video>
    //             {remoteTrackGroups && remoteTrackGroups.map((trackGroup: any, index: number) => {
    //                 const mediaStream = new MediaStream();
    //                 trackGroup.tracks.forEach((track: MediaStreamTrack) => {
    //                     mediaStream.addTrack(track);
    //                 });

    //                 return (
    //                     <video key={index} ref={video => { if (video) { video.srcObject = mediaStream; video.dataset.socketId = trackGroup.socketId; } }} autoPlay controls></video>
    //                 );

    //             })}
    //         </div>
    //         <input type="text" id="message" />
    //         <button onClick={() => sendMessage((document.getElementById('message') as HTMLInputElement).value)}>Send</button>
    //         <div>
    //             {messages && messages.map((message: any, index: number) => {
    //                 return (
    //                     <div key={index}>{message.username}: {message.message}</div>
    //                 );
    //             })}
    //         </div>
    //     </div>
    // );
    return (
        <div className="relative flex items-center justify-center h-screen bg-gray-900">
            {/* Image de fond floutée */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${backgroundImage})`, filter: 'blur(6px)' }}
            />
            <div className="absolute inset-0 bg-black opacity-60" /> {/* Couche sombre */}

            {/* Conteneur principal avec la sidebar */}
            <div className="relative z-10 flex w-[95%] h-[95vh] mx-auto p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-3xl overflow-hidden">
                {/* Sidebar utilisateurs */}
                {isSidebarVisible && (
                    <div className="flex flex-col w-[10%] h-full bg-gray-700 p-4 rounded-lg shadow-lg">
                        <h3 className="text-lg font-semibold text-gray-300 mb-4">Users in Room</h3>
                        <ul className="space-y-2">
                            {users.map((user, index) => (
                                <li key={index} className="text-white">{user.username}</li>
                            ))}
                        </ul>
                    </div>
                )}
                {/* Contenu principal */}
                <div className="flex flex-col w-full h-full space-y-4 bg-white-800 bg-opacity-80 overflow-hidden p-2 relative">
                    {/* Bouton pour cacher/montrer la sidebar */}
                    <div className="absolute top-4 left-4 z-20">
                        <button
                            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                            className="text-gray-300 bg-blue-600 px-3 py-2 rounded hover:bg-blue-700 transition"
                        >
                            {/* Icône de menu burger */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-6 w-6"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* Section des Vidéos */}
                    {!isChatExpanded && (
                        <div className="flex justify-center space-x-6 w-full p-4 border-gray-500 border-b-2">
                            <video autoPlay controls id="localVideo" className="w-[25%] h-[100%] border border-gray-600 rounded-md" />
                        </div>
                    )}

                    {/* Section chat expand/minimize */}
                    <div className="w-full flex justify-end mb-2">
                        <button
                            onClick={() => setIsChatExpanded(!isChatExpanded)}
                            className="text-gray-300 hover:text-gray-100"
                        >
                            {isChatExpanded ? 'Minimize' : 'Expand'}
                        </button>
                    </div>

                    {/* Boîte des Messages */}
                    <div className={`w-full ${isChatExpanded ? 'h-[95%]' : 'h-[95%]'} p-4 rounded-lg overflow-y-auto relative`}>
                        {messages.length === 0 ? (
                            <p className="text-gray-300 text-center">No message</p>
                        ) : (
                            messages.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex items-center mb-3 ${msg.username === "Anonyme" ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`p-3 rounded-lg max-w-md break-words ${msg.username === "Anonyme" ? 'bg-gray-700' : 'bg-gray-700'} text-gray-200`}
                                    >
                                        <span className="font-semibold block mb-1">{msg.username}:</span>
                                        <span>{msg.message}</span>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} /> {/* Référence pour scroll */}
                    </div>

                    {/* Formulaire de Message */}
                    <form onSubmit={handleSendMessage} className="w-full">
                        <div className="relative">
                            <input
                                type="text"
                                value={currentMessage}
                                onChange={(e) => setCurrentMessage(e.target.value)}
                                className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow"
                                placeholder="Write a message..."
                            />
                            <button
                                type="submit"
                                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                            >
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChatRoom;
