import React, { useRef, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import io, { Socket } from "socket.io-client";
import styled from "styled-components";

const Container = styled.div`
    height: 100vh;
    width: 50%;
    margin: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
`;

const Messages = styled.div`
    width: 100%;
    height: 60%;
    border: 1px solid black;
    margin-top: 10px;
    overflow-y: scroll;
`;

const MessageBox = styled.textarea`
    width: 100%;
    height: 30%;
`;

const Button = styled.div`
    width: 50%;
    border: 1px solid black;
    margin-top: 15px;
    height: 5%;
    border-radius: 5px;
    cursor: pointer;
    background-color: black;
    color: white;
    font-size: 18px;
`;

const MyRow = styled.div`
    width: 100%;
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
`;

const MyMessage = styled.div`
    width: 45%;
    background-color: blue;
    color: white;
    padding: 10px;
    margin-right: 5px;
    text-align: center;
    border-top-right-radius: 10%;
    border-bottom-right-radius: 10%;
`;

const PartnerRow = styled(MyRow)`
    justify-content: flex-start;
`;

const PartnerMessage = styled.div`
    width: 45%;
    background-color: grey;
    color: white;
    border: 1px solid lightgray;
    padding: 10px;
    margin-left: 5px;
    text-align: center;
    border-top-left-radius: 10%;
    border-bottom-left-radius: 10%;
`;

interface Message {
    yours: boolean;
    value: string;
}

const Room: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const peerRef = useRef<RTCPeerConnection | null>(null);
    const socketRef = useRef<Socket | null>(null);
    const otherUser = useRef<string | null>(null);
    const sendChannel = useRef<RTCDataChannel | null>(null);
    const [text, setText] = useState<string>('');
    const [messages, setMessages] = useState<Message[]>([]);
    let makingOffer = useRef<boolean>(false);

    useEffect(() => {
        socketRef.current = io('http://localhost:8000');
        socketRef.current.emit('join room', id);

        socketRef.current.on('other user', (userId: string) => {
            initPeerConnection(userId);
            otherUser.current = userId;
        });

        socketRef.current.on('user joined', (userId: string) => {
            otherUser.current = userId;
        });

        socketRef.current.on('offer', handleOffer);
        socketRef.current.on('answer', handleAnswer);
        socketRef.current.on('ice-candidate', handleNewICECandidateMsg);

        return () => {
            socketRef.current?.disconnect();
        };
    }, [id]);

    const initPeerConnection = (userId: string) => {
        peerRef.current = createPeerConnection(userId);
        console.log(peerRef.current);
        sendChannel.current = peerRef.current.createDataChannel('sendChannel');
        console.log(sendChannel.current);
        sendChannel.current.onmessage = handleReceiveMessage;
    };

    const handleReceiveMessage = (e: MessageEvent) => {
        setMessages((messages) => [...messages, { yours: false, value: e.data }]);
    };

    const createPeerConnection = (userId: string): RTCPeerConnection => {
        const peer = new RTCPeerConnection({
            iceServers: [
                {
                    urls: 'stun:stun.l.google.com:1930'
                }
            ]
        });

        peer.onicecandidate = handleICECandidateEvent;
        peer.onnegotiationneeded = () => handleNegotiationNeededEvent(userId);
        peer.ondatachannel = (event) => {
            sendChannel.current = event.channel;
            sendChannel.current.onmessage = handleReceiveMessage;
        };

        return peer;
    };

    const handleNegotiationNeededEvent = async (userId: string) => {
        try {
            if (peerRef.current?.signalingState !== "stable") {
                return;
            }
            if (makingOffer.current) {
                return;
            }
            makingOffer.current = true;

            const offer = await peerRef.current?.createOffer();
            await peerRef.current?.setLocalDescription(offer!);
            const payload = {
                target: userId,
                caller: socketRef.current?.id,
                sdp: peerRef.current?.localDescription
            };
            socketRef.current?.emit('offer', payload);
        } catch (error) {
            console.error(error);
        } finally {
            makingOffer.current = false;
        }
    };

    const handleOffer = async (incoming: any) => {
        peerRef.current = createPeerConnection(incoming.caller);
        await peerRef.current?.setRemoteDescription(new RTCSessionDescription(incoming.sdp));
        const answer = await peerRef.current?.createAnswer();
        await peerRef.current?.setLocalDescription(answer!);
        const payload = {
            target: incoming.caller,
            caller: socketRef.current?.id,
            sdp: peerRef.current?.localDescription
        };
        socketRef.current?.emit('answer', payload);
        console.log(peerRef.current);

    };

    const handleAnswer = async (message: any) => {
        await peerRef.current?.setRemoteDescription(new RTCSessionDescription(message.sdp));
        console.log(peerRef.current);

    };

    const handleICECandidateEvent = (e: RTCPeerConnectionIceEvent) => {
        if (e.candidate) {
            const payload = {
                target: otherUser.current,
                candidate: e.candidate
            };
            socketRef.current?.emit('ice-candidate', payload);
        }
        console.log(peerRef.current);

    };

    const handleNewICECandidateMsg = async (incoming: any) => {
        const candidate = new RTCIceCandidate(incoming);
        await peerRef.current?.addIceCandidate(candidate);
        console.log(peerRef.current);

    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
    };

    const sendMessage = () => {
        if (sendChannel.current?.readyState === 'open') {
            sendChannel.current.send(text);
            setMessages((messages) => [...messages, { yours: true, value: text }]);
            setText('');
        } else {
            console.error("Data channel is not open");
        }
    };

    const renderMessage = (message: Message, index: number) => {
        if (message.yours) {
            return (
                <MyRow key={index}>
                    <MyMessage>{message.value}</MyMessage>
                </MyRow>
            );
        }

        return (
            <PartnerRow key={index}>
                <PartnerMessage>{message.value}</PartnerMessage>
            </PartnerRow>
        );
    };

    return (
        <Container>
            <Messages>
                {messages.map(renderMessage)}
            </Messages>
            <MessageBox value={text} onChange={handleChange} placeholder="Say something....." />
            <Button onClick={sendMessage}>Send..</Button>
        </Container>
    );
};

export default Room;
