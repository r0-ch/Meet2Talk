import React, { useEffect, useRef } from 'react';

const PeerVideo = ({ peer }) => {
    const videoRef = useRef(null);
    const audioRef = useRef(null);

    useEffect(() => {
        if (peer.stream) {
            if (peer.stream.getVideoTracks().length > 0) {
                videoRef.current.srcObject = peer.stream;
            } else if (peer.stream.getAudioTracks().length > 0) {
                audioRef.current.srcObject = peer.stream;
            }
        }
    }, [peer.stream]);

    const hasVideo = peer.stream && peer.stream.getVideoTracks().length > 0;
    const hasAudio = peer.stream && peer.stream.getAudioTracks().length > 0;

    return (
        <div className="flex items-center justify-center bg-gray-800 rounded-lg aspect-video min-w-52 max-w-80">
            {hasVideo ? (
                <video
                    ref={videoRef}
                    className="w-full h-full object-cover rounded-lg"
                    autoPlay
                    controls
                    muted
                />
            ) : hasAudio ? (
                <>
                    <img
                        src={peer.profilePicture}
                        alt={peer.username}
                        className="w-full h-full object-cover rounded-lg"
                    />
                    <audio ref={audioRef} autoPlay muted style={{ display: 'none' }} />
                </>
            ) : (
                <img
                    src={peer.profilePicture}
                    alt={peer.username}
                    className="w-full h-full object-cover rounded-lg"
                />
            )}
        </div>
    );
};

export default PeerVideo;
