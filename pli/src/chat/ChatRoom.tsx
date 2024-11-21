import { io, Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import Peer from "simple-peer";
import { ToastContainer, toast, Bounce } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import RecordRTC from "recordrtc";
import config from "../loadenv";

import PeerVideo from "./PeerVideo";
import { usePeersContext } from "./PeersContext";
import Sidebar from "./Sidebar";
import TranscriptionsDisplay from "./TranscriptionsDisplay";

interface RemotePeer {
    socketId?: string;
    username?: string;
    profilePicture?: string;
    peer?: Peer.Instance;
    stream?: MediaStream | null;
    videoElement?: HTMLVideoElement | null;
    audioElement?: HTMLAudioElement | null;
    volume?: number | null;
}

let iceServers: any[] = []

async function loadIceServers() {
    const response =
        await fetch("https://rtc.live.cloudflare.com/v1/turn/keys/785369f4bacaadc93151ced64f395b80/credentials/generate", {
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

const ChatRoom = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const { username = 'Guest', selectedLanguage = "en" } = useLocation().state as { username: string, selectedLanguage: string } || {};
    const navigate = useNavigate();
    const socketRef = useRef<Socket | null>(null);
    const localSocketIdRef = useRef<string | null>(null);
    const whisperSocketRef = useRef<Socket | null>(null);
    const localMediaStreamRef = useRef<MediaStream | null>(null);

    const peersRef = useRef<any[]>([]);
    // const [peers, setPeers] = useState<any[]>([]);
    const { peers, dispatch } = usePeersContext();

    const [messages, setMessages] = useState<{ type: string, socketId: string, username: string, content: string, translated: string | null }[]>([]);
    const currentMessageRef = useRef<HTMLInputElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null); // Déclaration du type
    const [transcriptions, setTranscriptions] = useState<{ type: string, socketId: string, username: string, content: string, translated: string | null }[]>([]);
    const [lastTranscriptions, setLastTranscriptions] = useState<{}>({});
    const [transcriptionsPerUser, setTranscriptionsPerUser] = useState({});
    interface TranscriptionsPerUser {
        [socketId: string]: {
            username: string;
            messages: { content: string }[];
        };
    }


    const [profilePictures, setProfilePictures] = useState<string[]>([]);
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

    const [translationEnabled, setTranslationEnabled] = useState(false);
    const translationEnabledRef = useRef(false);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const [isSidebarVisible, setIsSidebarVisible] = useState(false); // État pour la visibilité de la sidebar
    const [isLoading, setIsLoading] = useState(true);

    const getRandomProfiles = () => {
        const shuffled = [...allProfilePictures].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2);
    };

    useEffect(() => {
        console.log(`roomId: ${roomId}`);
        console.log(`username: ${username}`);
        console.log(`selectedLanguage: ${selectedLanguage}`);
        console.log(`api: ${config.backurl}`);

        const socket = io(`${new URL(config.backurl).origin}`, {
            withCredentials: true,
        });
        socketRef.current = socket;
        localSocketIdRef.current = socket.id;

        const whisperSocket = io(`${new URL(config.whisperurl).origin}`, {
            path: '/socket.io/whisper',
        });
        whisperSocketRef.current = whisperSocket;

        setProfilePictures(getRandomProfiles());

        socket.on("connect_error", (err) => {
            console.log('connect_error', err);
            socket.io.opts.transports = ["polling", "websocket"];
        });

        socket.emit("join-room", { roomId, username }, async (otherUsers: any) => {
            console.log('room joined: other users: ', otherUsers);

            openToast('You joind the room!', 'success');

            setIsLoading(true);

            console.log("Loading ICE servers...");
            await loadIceServers();
            console.log("ICE servers loaded.");

            console.log("Getting local stream...");
            const media = await getLocalStream();
            localMediaStreamRef.current = media;
            console.log("Local stream acquired.");

            handleTranscription(media);

            setIsLoading(false);

            otherUsers.forEach((remoteUser: any) => {
                handlePeer(remoteUser, true);
            });
        });

        socket.on("cannot-join", () => {
            navigate("/")
        })

        socket.on("user-joined", async (user: any) => {
            console.log('user-joined', user);

            await handlePeer(user, false);
        });

        socket.on("receive-signal", ({ signal, from }) => {
            const peer = peersRef.current.find((p: any) => p.socketId === from);
            if (peer) {
                peer.peer.signal(signal);
            }
        });


        socket.on("transcription-requested", ({ socketId, enabled }) => {

            const peer = peersRef.current.find((p: any) => p.socketId === socketId);
            if (peer) {
                peer.transcriptionRequested = enabled;
            }

            // setPeers((prevPeers) => prevPeers.map((p) => {
            //     if (p.socketId === socketId) {
            //         return peer;
            //     }
            //     return p;
            // }));

            dispatch({ type: "updatePeer", payload: { socketId, transcriptionRequested: enabled } });

            console.log('transcription-requested', socketId, enabled);
        });

        whisperSocket.on('transcription', async (data) => {
            console.log('transcription', data);
            handleSendTranscription(data);
        })

        socket.on("user-disconnected", (socketId) => {
            console.log('user-disconnected', socketId);

            handlePeerLeft(socketId);
        });

        window.addEventListener('beforeunload', () => {
            socket.disconnect();
        });

        return () => {
            socket.disconnect();
        };
    }, []);


    async function handlePeer(user: any, initiator: boolean) {
        if (!initiator) openToast(`${user.username} is joining...`, 'info');

        const remotePeer = new Peer({
            initiator: initiator,
            trickle: false,
            stream: localMediaStreamRef.current,
            config: {
                iceServers: iceServers
            }
        });

        const peer = {
            peer: remotePeer,
            socketId: user.socketId,
            username: user.username,
            profilePicture: allProfilePictures[Math.floor(Math.random() * allProfilePictures.length)],
            isConnected: false
        };

        peersRef.current.push(peer);
        // setPeers((prevPeers) => [...prevPeers, peer]);
        dispatch({ type: "addPeer", payload: peer });

        remotePeer.on("connect", () => {
            console.log('peer', peer.socketId, 'connected')

            if (!initiator) openToast(`${user.username} is connected!`, 'success');

            const updatedPeers = peersRef.current.map((p: any) => {
                if (p.socketId === user.socketId) {
                    return { ...p, isConnected: true };
                }
                return p;
            });

            peersRef.current = updatedPeers;

            // setPeers(updatedPeers);
            dispatch({ type: "updatePeer", payload: { socketId: user.socketId, isConnected: true } });
        })

        remotePeer.on("signal", (data) => {
            socketRef.current?.emit("send-signal", {
                to: user.socketId,
                signal: data,
                from: socketRef.current?.id,
            });
        });

        remotePeer.on("stream", (stream) => {
            console.log('stream', stream);

            if (!initiator) openToast(`${user.username} is streaming!`, 'info');

            const updatedPeers = peersRef.current.map((p: any) => {
                if (p.socketId === user.socketId) {
                    return { ...p, stream };
                }
                return p;
            });

            peersRef.current = updatedPeers;

            // setPeers(updatedPeers);
            dispatch({ type: "updatePeer", payload: { socketId: user.socketId, stream } });
        });

        remotePeer.on("data", (data) => {
            const message = JSON.parse(data.toString());
            console.log('message', message);

            if (message.type === "message") {
                if (translationEnabledRef.current) {
                    console.log('translating message...');
                    translate(message.content, selectedLanguage).then((translated) => {
                        setMessages((prevMessages) => [...prevMessages, { ...message, translated }]);
                    });
                } else {
                    setMessages((prevMessages) => [...prevMessages, message]);
                }
            } else if (message.type === "transcription") {
                setTranscriptions((prevTranscriptions) => [...prevTranscriptions, message]);
                setLastTranscriptions((prevLastTranscriptions) => ({
                    ...prevLastTranscriptions,
                    [message.socketId]: message
                }));
                setTranscriptionsPerUser((prev) => {
                    console.log('test', prev);
                    return {
                        ...prev,
                        [message.socketId]: {
                            username: message.username,
                            messages: [...prev[message.socketId]?.messages || [], message]
                        }
                    }
                })
            }
        });

        return;
    }

    async function handlePeerLeft(socketId: string) {
        const peer = peersRef.current.find((p: any) => p.socketId === socketId);
        if (peer) {
            peer.peer.destroy();
            peersRef.current = peersRef.current.filter((p: any) => p.socketId !== socketId);
            // setPeers((prevPeers) => prevPeers.filter((p: any) => p.socketId !== socketId));
            dispatch({ type: "removePeer", payload: socketId });

            setTranscriptionsPerUser((prev) => {
                const newTranscriptions = { ...prev };
                delete newTranscriptions[socketId];
                return newTranscriptions;
            });

            openToast(`${peer.username} left the room!`, 'warn');
        }

        return;
    }


    // Get and return the local stream
    const getLocalStream = async () => {
        try {
            const audioStreamPromise = navigator.mediaDevices.getUserMedia({
                audio: {
                    channelCount: 1,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                }
            }).catch(() => null);
            const videoStreamPromise = navigator.mediaDevices.getUserMedia({ video: true }).catch(() => null);

            const [audioStream, videoStream] = await Promise.all([audioStreamPromise, videoStreamPromise]);

            if (audioStream && videoStream) {
                const combinedStream = new MediaStream([
                    ...audioStream.getAudioTracks(),
                    ...videoStream.getVideoTracks()
                ]);
                return combinedStream;
            }

            return audioStream || videoStream || null;

        } catch (err) {
            console.error("Erreur d'accès aux périphériques:", err);
            return null;
        }
    };

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
        // setTranslationEnabled(!translationEnabled);
        translationEnabledRef.current = !translationEnabledRef.current;
        // we retrieve all messages and translate them
        const translatedMessages = await Promise.all(messages.map(async (msg) => {
            if (msg.translated || msg.socketId === localSocketIdRef.current) {
                return msg;
            }
            const translated = await translate(msg.content, selectedLanguage);
            return { ...msg, translated };
        }));

        setMessages(translatedMessages);
    }

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentMessageRef.current.value.trim()) {
            const sendData = {
                type: "message",
                username,
                content: currentMessageRef.current.value,
                socketId: socketRef.current.id,
                translated: null
            }

            peersRef.current.forEach((peer) => {
                console.log(peer)
                if (peer.isConnected) {
                    peer.peer.send(JSON.stringify(sendData));
                } else {
                    openToast(`Message not sent to ${peer.username}: not connected yet !`, 'warn')
                }
            });

            setMessages((prevMessages) => [...prevMessages, sendData]);

        }
        if (currentMessageRef.current) {
            currentMessageRef.current.value = "";
        }
    };

    async function handleSendTranscription(transcription: any) {
        peersRef.current.forEach((peer) => {
            if (peer.transcriptionRequested === true) {
                peer.peer.send(JSON.stringify({
                    type: "transcription",
                    username,
                    content: transcription.transcription,
                    socketId: socketRef.current.id,
                    translated: null
                }));
                console.log('transcription sent');
            }
        });
    }

    async function toggleTranscribe(peer: any) {
        let enabled;
        if (!peer.transcriptionEnabled || peer.transcriptionEnabled === false) {
            enabled = true;
        } else {
            enabled = false;
        }

        peer.transcriptionEnabled = enabled;

        peersRef.current = peersRef.current.map((p) => {
            if (p.socketId === peer.socketId) {
                return peer;
            }
            return p;
        });

        // setPeers((prevPeers) => prevPeers.map((p) => {
        //     if (p.socketId === peer.socketId) {
        //         return peer;
        //     }
        //     return p;
        // }));

        dispatch({ type: "updatePeer", payload: { socketId: peer.socketId, transcriptionEnabled: enabled } });

        openToast(`Transcription ${enabled ? 'enabled' : 'disabled'} for ${peer.username}`, 'info');

        socketRef.current?.emit('toggle-transcription', { socketId: peer.socketId, enabled: peer.transcriptionEnabled });
    }

    let handleDataAvailable = (event: any) => {
        if (event.size > 0) {
            blobToBase64(event).then(b64 => {
                // console.log('sending audio to whisper service...');
                whisperSocketRef.current?.emit('audio', { audio: b64, language: selectedLanguage });
            })
        }
    };

    function blobToBase64(blob: Blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onload = () => {
                const result = reader.result as string;
                const base64String = result.split(',')[1];
                resolve(base64String);
            };
            reader.onerror = (error) => reject(error);
        });
    }

    async function handleTranscription(stream: MediaStream) {
        if (!stream) {
            console.error('No stream to transcribe');
            return;
        }
        let recorder = new RecordRTC(stream, {
            type: 'audio',
            recorderType: RecordRTC.StereoAudioRecorder,
            mimeType: 'audio/wav',
            timeSlice: 4000,
            desiredSampRate: 16000,
            numberOfAudioChannels: 1,
            ondataavailable: handleDataAvailable
        });

        recorder.startRecording();
    }

    function getPeer(socketId: string) {
        return peersRef.current.find((p: any) => p.socketId === socketId);
    }

    async function openToast(content: string, type: string) {
        toast[type](content, {
            position: "top-right",
            autoClose: 2000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: false,
            draggable: true,
            progress: undefined,
            theme: "dark",
            transition: Bounce,
        })
    }

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

    const scrollRefs = useRef({});

    // Effet pour gérer le scroll automatique pour tous les utilisateurs
    useEffect(() => {
        if (transcriptionsPerUser) {
            Object.keys(transcriptionsPerUser).forEach((key) => {
                if (scrollRefs.current[key]) {
                    scrollRefs.current[key].scrollTop = scrollRefs.current[key].scrollHeight;
                }
            });
        }
    }, [transcriptionsPerUser]);

    return (
        <>
            <ToastContainer />
            {isLoading ? (
                <div className="flex items-center justify-center h-screen bg-gray-900">
                    <div className="text-white">Loading...</div>
                </div>
            ) : (
                <div className="relative flex items-center justify-center h-screen bg-gray-900">
                    {/* Image de fond floutée */}
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${('/worldwide.jpg')})`, filter: 'blur(3px)' }}
                    />
                    <div className="absolute inset-0 bg-black opacity-60" /> {/* Couche sombre */}

                    <div className="relative z-10 flex w-full h-full mx-auto shadow-3xl overflow-hidden">
                        {/* Sidebar utilisateurs */}
                        {/* <div
                            className={`fixed z-30 top-0 left-0 h-full bg-gray-700 p-4 rounded-lg shadow-lg transition-transform duration-300 ease-in-out ${isSidebarVisible ? 'translate-x-0' : '-translate-x-full'}`}
                            style={{ width: '250px', paddingTop: '5rem' }}
                        >
                            <h3 className="text-lg font-semibold text-gray-400 mb-4">Users in Room</h3>
                            <ul className="space-y-2">
                                <h4 id="usernames" className="text-white text-xl">{username}</h4>
                                {peers.map((peer, index) => (
                                    <div key={index}>
                                        <h4 className="text-white text-xl">{peer.username}</h4>
                                        <ul>
                                            <li onClick={() => toggleTranscribe(peer)}>transcribe</li>
                                        </ul>
                                    </div>
                                ))}
                            </ul>
                        </div> */}

                        {/* Bouton pour cacher/montrer la sidebar */}
                        <div className="absolute z-50 top-4 left-4 flex items-center">
                            <button
                                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                                className="text-gray-300 bg-blue-500 px-3 py-2 rounded hover:bg-blue-600 transition"
                            >
                                {/* Icône de flèche */}
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6 transform transition-transform duration-300"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    {isSidebarVisible ? (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 9l-5 5 5 5" />
                                    ) : (
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 15l5-5-5-5" />
                                    )}
                                </svg>
                            </button>
                        </div>

                        <Sidebar username={username} isSidebarVisible={isSidebarVisible} />

                        {/* Contenu principal */}
                        <div className="relative flex flex-col justify-between w-full h-full p-4 bg-gray-900 bg-opacity-80 overflow-hidden" style={{ justifyContent: 'space-between' }}>
                            {/* Section des Vidéos */}
                            <div className={`flex flex-wrap justify-center gap-4 p-4`}>
                                {/* Vidéo utilisateur local */}
                                <div className="flex items-center justify-center bg-gray-800 rounded-lg aspect-video min-w-52 max-w-80">
                                    {localMediaStreamRef.current ? (
                                        localMediaStreamRef.current.getVideoTracks().length > 0 ? (
                                            <video
                                                ref={(video) => video && (video.srcObject = localMediaStreamRef.current)}
                                                className="w-full h-full object-cover rounded-lg"
                                                autoPlay
                                                muted
                                            />
                                        ) : (
                                            <>
                                                <img
                                                    src={profilePictures[0]}
                                                    alt={username}
                                                    className="w-full h-full object-cover rounded-lg"
                                                />
                                                <audio
                                                    ref={(audio) => audio && (audio.srcObject = localMediaStreamRef.current)}
                                                    autoPlay
                                                    muted
                                                    style={{ display: 'none' }}
                                                />
                                            </>
                                        )
                                    ) : (
                                        <img
                                            src={profilePictures[0]}
                                            alt={username}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    )}
                                </div>

                                {/* Vidéos des pairs */}
                                {peers.map((peer, index) => {
                                    return (
                                        <PeerVideo key={index} peer={peer} toggleTranscription={toggleTranscribe} />
                                    );
                                })}
                            </div>

                            {/* <div className="w-full p-4 rounded-lg bg-gray-700 bg-opacity-80 overflow-y-auto mt-4 text-white">
                                {Object.entries(lastTranscriptions).map(([key, transcription]) => (
                                    <div key={key}>
                                        <h4 className="text-xl">{(transcription as any).username}:</h4>
                                        <p>{(transcription as any).content}</p>
                                    </div>
                                ))}
                            </div> */}

                            {/* <TranscriptionsDisplay transcriptionsPerUser={transcriptionsPerUser} /> */}

                            <div className="h-auto flex flex-row flex-wrap justify-center w-full p-6 rounded-lg bg-gray-800 bg-opacity-90 mt-6 text-white gap-6">
                                {transcriptionsPerUser && Object.keys(transcriptionsPerUser).length > 0 ? (
                                    Object.entries(transcriptionsPerUser).map(([key, value]) => {
                                        const isTranscriptionEnabled = peers.find((p: any) => p.socketId === key)?.transcriptionEnabled;

                                        return (
                                            <div
                                                key={key}
                                                className="flex-1 flex flex-col justify-between rounded-lg shadow-lg bg-gray-700 bg-opacity-80 border border-gray-600 p-2 w-[300px] max-w-[400px] transition-all hover:scale-105 hover:shadow-xl">
                                                {/* Conteneur scrollable des messages */}
                                                <ul
                                                    ref={(el) => (scrollRefs.current[key] = el)}
                                                    className="h-[8em] flex flex-col overflow-y-auto p-2 w-full space-y-2">
                                                    <div className="mt-auto">
                                                        {(value as any).messages.map((msg: any, index: number) => (
                                                            <li
                                                                key={index}
                                                                className="text-center my-1 text-lg text-gray-300 bg-gray-800 p-2 rounded-lg break-words overflow-hidden">
                                                                {msg.content}
                                                            </li>
                                                        ))}
                                                    </div>
                                                </ul>
                                                {/* Username en bas avec hover effect */}
                                                <h4
                                                    onClick={() => toggleTranscribe(getPeer(key))}
                                                    className={`flex items-center justify-between text-xl bg-gray-800 p-1 rounded-lg shadow-inner font-semibold mt-2 cursor-pointer transition-all ${isTranscriptionEnabled
                                                            ? 'hover:bg-red-500 hover:text-white'
                                                            : 'hover:bg-green-500 hover:text-white'
                                                        }`}>
                                                    <span className="flex-grow text-center">{(value as any).username}</span>
                                                    <span className="ml-2">{isTranscriptionEnabled ? '🟢' : '🔴'}</span>
                                                </h4>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-center text-lg text-gray-400">No transcriptions available</p>
                                )}
                            </div>

                            {/* Boîte de messages */}
                            <div className="w-full h-[50%] p-4 rounded-lg bg-gray-700 bg-opacity-80 overflow-y-auto mt-4">
                                {messages.length === 0 ? (
                                    <p className="text-gray-300 text-center">No message</p>
                                ) : (
                                    messages.map((msg, index) => (
                                        <div
                                            key={index}
                                            className={`flex items-center mb-3 ${msg.socketId !== socketRef.current.id ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div
                                                className={`p-3 rounded-lg max-w-md break-words ${msg.socketId !== socketRef.current.id ? 'bg-gray-700' : 'bg-blue-500'} text-gray-200`}
                                            >
                                                <span className="font-semibold block mb-1">{msg.username}:</span>
                                                <span>{translationEnabledRef.current && msg.translated ? msg.translated : msg.content}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} /> {/* Référence pour le scroll */}
                            </div>

                            {/* Bouton pour activer/désactiver la traduction */}
                            <div className="flex justify-start mb-2">
                                <button
                                    onClick={async () => await enableTranslation()}
                                    className={`${translationEnabledRef.current ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}`}
                                >
                                    Translate conversation
                                </button>
                            </div>

                            {/* Formulaire de message */}
                            <form onSubmit={handleSendMessage} className="w-full">
                                <div className="relative">
                                    <input
                                        ref={currentMessageRef}
                                        type="text"
                                        className="w-full p-3 rounded-lg bg-gray-700 text-gray-200 border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-600 shadow"
                                        placeholder="Write a message..."
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white p-2 rounded hover:bg-blue-700 transition"
                                    >
                                        Send
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default ChatRoom;