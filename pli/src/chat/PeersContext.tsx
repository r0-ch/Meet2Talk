import { createContext, useState, useReducer, useContext } from "react";
import Peer from "simple-peer";

const peersContext = createContext(null);

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

function usePeersContext() {
    const context = useContext(peersContext);
    if (!context) {
        throw new Error("usePeersContext must be used within a PeersProvider");
    }
    return context;
}

function PeersProvider({ children }) {
    // const [peers, setPeers] = useState([]);

    function peersReducer(state, action) {
        // console.log("peersReducer", action);

        switch (action.type) {
            case "getPeer":
                const peer = state.find((peer) => peer.socketId === action.payload);
                return peer;
            case "addPeer":
                const existingPeer = state.find((peer) => peer.socketId === action.payload.socketId);
                if (existingPeer) {
                    console.warn(`Peer with socketId ${action.payload.socketId} already exists`);
                    return state;
                }
                return [...state, action.payload];


            case "removePeer":
                return state.filter((peer) => peer.socketId !== action.payload);

            case "updatePeer":
                // console.log("Updating peer", action.payload);
                return state.map((peer) =>
                    peer.socketId === action.payload.socketId
                        ? { ...peer, ...action.payload }
                        : peer
                );



            default:
                return state;
        }
    }

    const [peers, dispatch] = useReducer(peersReducer, []);

    return (
        <peersContext.Provider value={{ peers, dispatch }}>
            {children}
        </peersContext.Provider>
    );
}

export { peersContext, PeersProvider, usePeersContext };