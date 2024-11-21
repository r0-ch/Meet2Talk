import React, { useRef, useEffect, useState } from "react";
import { usePeersContext } from "./PeersContext";

interface UserControlsProps {
    socketId: string;
    onVolumeChange: (volume: number) => void;
    onClose: () => void;
    toggleTranscription: (peer) => void;
}

const UserControls: React.FC<UserControlsProps> = ({ socketId, onVolumeChange, onClose, toggleTranscription }) => {
    const { peers } = usePeersContext();
    const menuRef = useRef<HTMLDivElement>(null);

    const peer = peers.find((p) => p.socketId === socketId);

    const [volume, setVolume] = useState(peer?.volume);

    useEffect(() => {

        setVolume(peer.volume);

    }, [peer?.volume]);

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newVolume = parseFloat(e.target.value);
        setVolume(newVolume);
        onVolumeChange(newVolume);
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

    if (!peer) return null;

    return (
        <div
            ref={menuRef}
            className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg w-64"
        >
            <div className="px-4 py-2 border-b border-gray-200">
                <h4 className="text-lg font-semibold text-gray-800">{peer.username}</h4>
            </div>
            <div className="px-4 py-2">
                <label htmlFor="volume-control" className="block text-sm font-medium text-gray-700">
                    Volume
                </label>
                <input
                    id="volume-control"
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="mt-1 w-full"
                />
                <p className="text-xs mt-1 text-gray-500">Volume: {Math.round(volume * 100)}%</p>
            </div>
            <div>
                <button
                    onClick={() => toggleTranscription(peer)}
                    className="w-full py-2 text-sm text-left px-4 hover:bg-gray-100 focus:outline-none"
                >
                    Toggle Transcription
                </button>
            </div>
        </div>
    );
};

export default UserControls;
