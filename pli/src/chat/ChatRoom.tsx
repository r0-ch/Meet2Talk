import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import backgroundImage from '../img/worldwide.jpg'; // Chemin vers l'image

interface RemoteParticipant {
    peerConnection: RTCPeerConnection;
    socketId: string;
    username: string;
    dataChannel?: RTCDataChannel;
    tracks?: MediaStreamTrack[];
}


let iceServers: any[] = []

async function loadIceServers() {
    const response =
    await fetch("https://rtc.live.cloudflare.com/v1/turn/keys/785369f4bacaadc93151ced64f395b80/credentials/generate",{
      method: "POST",
      headers: {
          Authorization: "Bearer a5e6faf386390a06a24b2fd1d411b3f20e8ee3b0537b4265edc88286b9ab502d",
          "Content-Type": "application/json"
      },
      body: JSON.stringify({ ttl: 86400 })
    });
    const res = await response.json();

    iceServers = [{
        urls: "stun:stun.relay.metered.ca:80",
        },
        {
        ...res.iceServers
        }]
  }

const remoteParticipants = new Map<string, RemoteParticipant>();

const ChatRoom = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { username = 'Guest', selectedLanguage = "en" } = useLocation().state as { username: string, selectedLanguage: string } || {};
    const socketRef = useRef<Socket | null>(null);
    const localSocketIdRef = useRef<string | null>(null);
    const [messages, setMessages] = useState<{ socketId: string, username: string, message: string, translated: string | null }[]>([]);
    const [currentMessage, setCurrentMessage] = useState('');
    const [profilePictures, setProfilePictures] = useState<string[]>([]);
    const [translationEnabled, setTranslationEnabled] = useState(false);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false); // État pour la visibilité de la sidebar
    const messagesEndRef = useRef<HTMLDivElement>(null); // Déclaration du type
    const localVideoElement = useRef<HTMLVideoElement | null>(null);
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

    useEffect(() => {
        const socket = io(`${new URL(process.env.REACT_APP_BACKEND as string).origin}`, {
            withCredentials: true,
        });
        console.log(`api: ${process.env.REACT_APP_BACKEND}`);
        socketRef.current = socket;
        socket.on("connect_error", (err) => {
            console.log('connect_error', err);
            socket.io.opts.transports = ["polling", "websocket"];
        });
        // socket.on("connect_error", () => {
        //     // revert to classic upgrade
        //     socket.io.opts.transports = ["polling", "websocket"];
        // });

        socket.on("connect", async () => {
            await loadIceServers();
            localSocketIdRef.current = socket.id!;
            console.log('socket connected', socket.id);
            const media = await getLocalStream();
            await handleLocalStream(media);
            const { Sockets } = await fetch(`${process.env.REACT_APP_BACKEND}/get-room/${roomId}`).then((res) => res.json()) as { Sockets: { socketId: string, username: string }[] };

            socket.emit("join-room", {
                roomId,
                username,
            });

            socket.on("offer", async ({ by, offer, username }) => {
                handleOffer(offer, by, username);
            });

            socket.on("answer", (data) => {
                handleAnswer(data.answer, data.by);
            });

            socket.on("ice-candidate", (data) => {
                handleIceCandidate(data.candidate, data.by);
            });

            socket.on("user-disconnected", (socketId: string) => {
                console.log('user disconnected', socketId);
                const peerToDisconnect = remoteParticipants.get(socketId);
                if (peerToDisconnect) {
                    peerToDisconnect.peerConnection.close();
                }

                remoteParticipants.delete(socketId);
            });

            Sockets.forEach(async ({ socketId, username }) => {
                connectToSocket(socketId, username, media);
            });
        });

        window.addEventListener('beforeunload', () => {
            socket.disconnect();
        });

        return () => {
            socket.disconnect();
        };
    }, []);


    async function connectToSocket(socketId: string, username: string, stream: MediaStream) {
        if(iceServers.length === 0) {
            await loadIceServers();
        }

        const peerConnection = await createPeerConnection();

        const dataChannel = peerConnection.createDataChannel("chat");

        for(const track of stream.getTracks()) {
            peerConnection.addTrack(track, stream);
        }

        peerConnection.onicecandidate = (event) => {
            if(event.candidate) {
                socketRef.current?.emit("ice-candidate", {
                    candidate: event.candidate,
                    socketId,
                });
            }
        }

        peerConnection.ontrack = (event) => {
            const remoteParticipant = remoteParticipants.get(socketId);
            if(remoteParticipant) {
                remoteParticipant.tracks = event.streams[0].getTracks();
                remoteParticipants.set(socketId, remoteParticipant);
            }
        }

        remoteParticipants.set(socketId, {
            peerConnection,
            socketId,
            username,
            dataChannel,
        });

        peerConnection.addEventListener("iceconnectionstatechange", async (event) => {
            if (peerConnection.iceConnectionState === "disconnected") {
              /* possibly reconfigure the connection in some way here */
              /* then request ICE restart */
              peerConnection.restartIce();
            }else if(peerConnection.iceConnectionState === "closed") {
                console.log("ICE CONNECTION CLOSED", socketId);
                const remoteParticipant = remoteParticipants.get(socketId);
                if(remoteParticipant) {
                    remoteParticipant.peerConnection.close();
                    remoteParticipants.delete(socketId);
                }
            }
          });

        peerConnection.onnegotiationneeded = async () => {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socketRef.current?.emit("offer", {
                socketId,
                offer,
                username,
            });
        }


    }

    async function handleOffer(offer: RTCSessionDescriptionInit, socketId: string, username: string) {
        console.log("OFFER RECEIVED", socketId);
        const peerConnection = await getOrCreatePeerConnection(socketId);

        peerConnection
            .setRemoteDescription(offer)
            .then(() =>
                getLocalStream()
        ).then((media) => {
            for(const track of media.getTracks()) {
                peerConnection.addTrack(track, media);
            }
            return peerConnection.createAnswer();
        }).then((answer) => {
            return peerConnection.setLocalDescription(answer);
        }).then(() => {
            socketRef.current?.emit("answer", {
                socketId,
                answer: peerConnection.localDescription,
            });
            console.log("ANSWER SENT", socketId);
        });

    }


    // Leave the room

    // Get and return the local stream
    const getLocalStream = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            // Vérification des pistes disponibles
            const hasVideoTrack = mediaStream.getVideoTracks().length > 0;
            const hasAudioTrack = mediaStream.getAudioTracks().length > 0;

            if (!hasVideoTrack || !hasAudioTrack) {
                console.warn("Aucune piste vidéo ou audio disponible");
            }

            return mediaStream;
        } catch (err) {
            console.error("Erreur d'accès aux périphériques:", err);
            return new MediaStream(); // Retourne un flux vide
        }
    };

    // Handle the local stream and set it to the local video element
    const handleLocalStream = (localStream: MediaStream) => {
        return new Promise<void>((resolve) => {
            if (localVideoElement.current) {
                if (localStream.getVideoTracks().length > 0) {
                    // Si une vidéo est disponible, on l’affiche
                    localVideoElement.current.srcObject = localStream;
                } else {
                    // Sinon, on masque le conteneur
                    localVideoElement.current.style.display = "none";
                    resolve();
                }

                localVideoElement.current.onloadedmetadata = () => {
                    resolve();
                };
            }
        });
    };


    function handleAnswer(answer: RTCSessionDescriptionInit, socketId: string) {
        const peerConnection = remoteParticipants.get(socketId)?.peerConnection;
        if (peerConnection) {
            peerConnection.setRemoteDescription(answer);
        }
    }

    async function getOrCreatePeerConnection(socketId: string) {
        const peer = remoteParticipants.get(socketId);
        if(peer) {
            return peer.peerConnection;
        }
        if(iceServers.length === 0) {
            await loadIceServers();
        }
        const peerConnection = await createPeerConnection();
        peerConnection.onicecandidate = (event) => {
            if(event.candidate) {
                socketRef.current?.emit("ice-candidate", {
                    candidate: event.candidate,
                    socketId,
                });
            }
        }

        peerConnection.ontrack = (event) => {
            const remoteParticipant = remoteParticipants.get(socketId);
            if(remoteParticipant) {
                remoteParticipant.tracks = event.streams[0].getTracks();
                remoteParticipants.set(socketId, remoteParticipant);
            }
        }

        remoteParticipants.set(socketId, {
            peerConnection,
            socketId,
            username: username,
        });
        peerConnection.ondatachannel = (event) => {
            const dc = event.channel;
            dc.onmessage = (event) => {
                const message = JSON.parse(event.data);
                if(message.socketId === localSocketIdRef.current) return;
                setMessages((prevMessages) => [...prevMessages, message]);
            }

            dc.onopen = () => {
                const remoteParticipant = remoteParticipants.get(socketId);
                if(remoteParticipant) {
                    remoteParticipant.dataChannel = dc;
                    remoteParticipants.set(socketId, remoteParticipant);
                }
            }
        }

        peerConnection.addEventListener("iceconnectionstatechange", async (event) => {
            if(peerConnection.iceConnectionState === "disconnected") {
                console.log("Reconnecting...");
                peerConnection.restartIce();
                const offer = await peerConnection.createOffer();
                await peerConnection.setLocalDescription(offer);
                socketRef.current?.emit("offer", {
                    socketId,
                    offer: peerConnection.localDescription,
                    username,
                });
            }
        });

        return peerConnection;
    }

    function handleIceCandidate(candidate: RTCIceCandidate, socketId: string) {
        const peerConnection = remoteParticipants.get(socketId)?.peerConnection;
        console.log("ICE CANDIDATE FROM REMOTE", socketId, candidate, Array.from(remoteParticipants).map((p) => p[1].socketId));
        if (peerConnection) {
          console.log("ICE CANDIDATE RECEIVED", socketId, candidate);
          peerConnection.addIceCandidate(candidate);
        }
      }

    async function createPeerConnection() {

        const peerConnection = new RTCPeerConnection({
            iceServers: iceServers,
            iceCandidatePoolSize: 2,
            iceTransportPolicy: "relay",
        });
        return peerConnection;
    }

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
            if (msg.translated || msg.socketId === localSocketIdRef.current) {
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
            remoteParticipants.forEach((participant) => {
                if (participant.dataChannel?.readyState === "open") {
                    participant.dataChannel.send(JSON.stringify({
                        username,
                        message: currentMessage,
                        socketId: localSocketIdRef.current,
                        translated: null,
                    }));
                }
            });

            setMessages((prevMessages) => [
                ...prevMessages,
                {
                    username,
                    message: currentMessage,
                    socketId: localSocketIdRef.current!,
                    translated: null,
                },
            ]);
        }
        setCurrentMessage('');
    };

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
                        <li className="text-white">{username}</li>
                        {remoteParticipants.size > 0 && Array.from(remoteParticipants).map((user, index) => (
                            <li key={index} className="text-white">{user[1].username}</li>
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
                            <video autoPlay controls ref={localVideoElement} className="w-[25%] h-[100%] border border-gray-600 rounded-md" />

                            {remoteParticipants.size > 0 && Array.from(remoteParticipants).map((remote, index) => {
                                const mediaStream = new MediaStream();
                                remote[1].tracks?.forEach((track) => {
                                    mediaStream.addTrack(track);
                                });

                                return (
                                    <video className="w-[25%] h-[100%] border border-gray-600 rounded-md"
                                        key={index} ref={video => {
                                            if (video) { video.srcObject = mediaStream; video.dataset.socketId = remote[1].socketId; }
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
                                    className={`flex items-center mb-3 ${msg.socketId !== localSocketIdRef.current ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`p-3 rounded-lg max-w-md break-words ${msg.socketId !== localSocketIdRef.current ? 'bg-gray-700' : 'bg-blue-500'} text-gray-200`}
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
