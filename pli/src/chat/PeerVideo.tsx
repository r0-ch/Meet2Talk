import React, { useEffect, useRef, useState } from "react";
import UserControls from "./UserControls";
import { usePeersContext } from "./PeersContext";

const PeerVideo = ({ peer, toggleTranscription }) => {
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { dispatch } = usePeersContext();

    const [isControlsVisible, setControlsVisible] = useState(false);

    useEffect(() => {
        dispatch({
            type: "updatePeer",
            payload: {
                socketId: peer.socketId,
                videoElement: videoRef.current,
                audioElement: audioRef.current,
                volume: 1,
            },
        });

        if (peer.stream) {
            if (videoRef.current) videoRef.current.srcObject = peer.stream;
            if (audioRef.current) audioRef.current.srcObject = peer.stream;
        }
    }, [peer.stream]);

    const toggleControls = () => setControlsVisible(!isControlsVisible);

    const handleVolumeChange = (volume: number) => {
        if (audioRef.current) audioRef.current.volume = volume;
        if (videoRef.current) videoRef.current.volume = volume;

        dispatch({ type: "updatePeer", payload: { socketId: peer.socketId, volume } });
    };

    const hasVideo = peer.stream?.getVideoTracks()?.length > 0;
    const hasAudio = peer.stream?.getAudioTracks()?.length > 0;

    return (
        <div className="relative flex items-center justify-center bg-gray-800 rounded-lg aspect-video min-w-52 max-w-80">
            {hasVideo ? (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-lg"
                    autoPlay
                    playsInline
                    onClick={toggleControls}
                />
            ) : (
                <img
                    src={peer.profilePicture}
                    alt={peer.username}
                    className="w-full h-full object-cover rounded-lg"
                    onClick={toggleControls}
                />
            )}
            {hasAudio && <audio ref={audioRef} autoPlay style={{ display: "none" }} />}

            {isControlsVisible && (
                <UserControls
                    socketId={peer.socketId}
                    onVolumeChange={handleVolumeChange}
                    onClose={() => setControlsVisible(false)}
                    toggleTranscription={toggleTranscription}
                />
            )}
        </div>
    );
};

export default PeerVideo;
