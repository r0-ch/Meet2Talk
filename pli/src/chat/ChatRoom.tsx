import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import backgroundImage from '../img/worldwide.jpg'; // Chemin vers l'image

const ChatRoom = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { username = 'Guest', selectedLanguage = "en" } = useLocation().state as { username: string, selectedLanguage: string } || {};
    const socketRef = useRef<Socket | null>(null);
    const localSocketIdRef = useRef<string | null>(null);
    const [remotePeers, setRemotePeers] = useState<any>([]);
    const [remoteVideoElements, setRemoteVideoElements] = useState<HTMLElement[]>([]);
    const [remoteTrackGroups, setRemoteTrackGroups] = useState<any>([]);
    const [messages, setMessages] = useState<{ socketId: string, username: string, message: string, translated: string | null }[]>([]);
    const roomJoinedRef = useRef<boolean>(false);
    // const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    // const { username } = location.state || { username: 'You' };
    const [currentMessage, setCurrentMessage] = useState('');
    // const [messages, setMessages] = useState<{ text: string; user: number }[]>([]);
    const [profilePictures, setProfilePictures] = useState<string[]>([]);
    const [translationEnabled, setTranslationEnabled] = useState(false);
    const [users, setUsers] = useState<{ username: string }[]>([]);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false); // État pour la visibilité de la sidebar
    const messagesEndRef = useRef<HTMLDivElement>(null); // Déclaration du type
    const LocalPeerConnection = useRef<RTCPeerConnection | null>(null);
    const dataChannel = useRef<RTCDataChannel | null>(null);
    const sessionId = useRef<string | null>(null);
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
            withCredentials: true,
        });
        console.log(`api: ${process.env.REACT_APP_BACKEND}`);
        socketRef.current = socket;

        // socket.on("connect_error", () => {
        //     // revert to classic upgrade
        //     socket.io.opts.transports = ["polling", "websocket"];
        // });

        socket.on("connect", async() => {
            await createPeerConnection();
        });
        window.addEventListener('beforeunload', () => {
            socket.disconnect();
        });

        return () => {
            socket.disconnect();
        };
    }, []);


    async function translate(text: string, target: string = "en") {
        return new Promise<string | null>(async (resolve, reject) => {
            try {
                if (translationEnabled) {
                    resolve(null);
                    return;
                }
                const res = await fetch("https://plx.ketsuna.com/translate", {
                    method: "POST",
                    body: JSON.stringify({
                        q: text,
                        source: "auto",
                        target: target,
                        format: "text",
                        alternatives: 3,
                        api_key: ""
                    }),
                    headers: { "Content-Type": "application/json" }
                })
                const data = await res.json();
                resolve(data.translatedText);
            } catch (error) {
                reject("Error translating text");
            }
        });
    }

    async function enableTranslation() {
        setTranslationEnabled(!translationEnabled);
        // we retrieve all messages and translate them
        const translatedMessages = await Promise.all(messages.map(async (msg) => {
            if (msg.translated || msg.username === username) {
                return msg;
            }
            const translated = await translate(msg.message, selectedLanguage);
            return { ...msg, translated };
        }));

        setMessages(translatedMessages);
    }

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentMessage.trim()) {
            // sendMessage(currentMessage);
        }
        setCurrentMessage('');
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



            localVideoElement.onloadedmetadata = () => {
                resolve();
            };
        });
    };

    async function createPeerConnection() {
        const localStream = await getLocalStream();
        await handleLocalStream(localStream);

        const peerConnection = new RTCPeerConnection({
            iceServers: [
              {
                urls: "stun:stun.cloudflare.com:3478",
              },
            ],
            bundlePolicy: "max-bundle",
          });

        const dc = peerConnection.createDataChannel("server-events");
        await peerConnection.setLocalDescription(
            await peerConnection.createOffer()
        );
        const transceivers = localStream.getTracks().map((track) =>
            peerConnection.addTransceiver(track, {
              direction: "sendonly",
            }),
          );


        console.log('Peer connection: ', transceivers);
        const {sessionId, sessionDescription} = await fetch(process.env.REACT_APP_BACKEND + "/join-room",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                roomId,
                localDescription: peerConnection.localDescription,
                tracks:transceivers.map(({ mid, sender }: any) => ({
                    location: "local",
                    mid,
                    trackName: sender.track?.id,
                  }))
            }),
        }).then((res) => res.json());



        socketRef.current?.emit("join-room", {roomId, sessionId});
        // const connected = new Promise((res, rej) => {
        //     // timeout after 5s
        //     setTimeout(rej, 5000);
        //     const iceConnectionStateChangeHandler = () => {
        //         if (peerConnection.iceConnectionState === "connected") {
        //             peerConnection.removeEventListener(
        //                 "iceconnectionstatechange",
        //                 iceConnectionStateChangeHandler
        //             );
        //             res(undefined);
        //         }
        //     };
        //     peerConnection.addEventListener(
        //         "iceconnectionstatechange",
        //         iceConnectionStateChangeHandler
        //     );
        // });

        await peerConnection.setRemoteDescription(sessionDescription);

        LocalPeerConnection.current = peerConnection;
        dataChannel.current = dc;
        sessionId.current = sessionId;
    }


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
                style={{ backgroundImage: `url(${backgroundImage})`, filter: 'blur(3px)' }}
            />
            <div className="absolute inset-0 bg-black opacity-60" /> {/* Couche sombre */}

            <div className="relative z-10 flex w-[95%] h-[95vh] mx-auto p-6 bg-gray-800 bg-opacity-80 rounded-lg shadow-3xl overflow-hidden">
                {/* Sidebar utilisateurs */}
                <div
                    className={`flex flex-col h-full bg-gray-700 p-4 rounded-lg shadow-lg transition-transform duration-300 ease-in-out ${isSidebarVisible ? 'translate-x-0' : 'translate-x-[-2000%]'}`}
                    style={{ width: isSidebarVisible ? '10%' : '0%' }}
                >
                    <h3 className="text-lg font-semibold text-gray-400 mb-4">Users in Room</h3>
                    <ul className="space-y-2">
                        {users.map((user, index) => (
                            <li key={index} className="text-white">{user.username}</li>
                        ))}
                    </ul>
                </div>

                {/* Contenu principal */}
                <div className={`flex flex-col ${isSidebarVisible ? 'w-[90%]' : 'w-full'} h-full space-y-4 bg-white-800 bg-opacity-80 overflow-hidden p-2 relative`}>
                    {/* Bouton pour cacher/montrer la sidebar */}
                    <div className="absolute top-4 left-4 z-20 flex items-center">
                        <button
                            onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                            className="text-gray-300 bg-blue-500 px-3 py-2 rounded hover:bg-blue-600 transition"
                        >
                            {/* Icône de flèche */}
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className={`h-6 w-6 transform transition-transform duration-300`} // Ajustement de la flèche
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                {isSidebarVisible ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9l-5 5 5 5" /> // Flèche vers la gauche
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15l5-5-5-5" /> // Flèche vers la droite
                                )}
                            </svg>
                        </button>
                    </div>

                    {/* Section des Vidéos */}
                    {!isChatExpanded && (
                        <div className="flex justify-center space-x-6 w-full p-4 border-gray-500 border-b-2">
                            <video autoPlay controls id="localVideo" className="w-[25%] h-[100%] border border-gray-600 rounded-md" />

                            {remoteTrackGroups && remoteTrackGroups.map((trackGroup: any, index: number) => {
                                const mediaStream = new MediaStream();
                                trackGroup.tracks.forEach((track: MediaStreamTrack) => {
                                    mediaStream.addTrack(track);
                                });

                                return (
                                    <video className="w-[25%] h-[100%] border border-gray-600 rounded-md"
                                        key={index} ref={video => {
                                            if (video) { video.srcObject = mediaStream; video.dataset.socketId = trackGroup.socketId; }
                                        }} autoPlay controls>
                                    </video>
                                );

                            })}
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
                                    className={`flex items-center mb-3 ${msg.socketId != localSocketIdRef.current ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`p-3 rounded-lg max-w-md break-words ${msg.socketId != localSocketIdRef.current ? 'bg-gray-700' : 'bg-blue-500'} text-gray-200`}
                                    >
                                        <span className="font-semibold block mb-1">{msg.username}:</span>
                                        <span>{translationEnabled && msg.translated ? msg.translated : msg.message}</span>
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} /> {/* Référence pour scroll */}
                    </div>

                    <div className="w-full flex justify-start mb-2 ml-2">
                        <button
                            onClick={async () => await enableTranslation()}
                            className={` ${translationEnabled ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}
                        >
                            Translate conversation
                        </button>
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
}

export default ChatRoom;
