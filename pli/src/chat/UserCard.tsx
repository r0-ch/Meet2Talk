import React, { useState } from 'react';

const UserCard = ({ peer }) => {
    const [isControlsVisible, setControlsVisible] = useState(false);

    const toggleControls = () => setControlsVisible(!isControlsVisible);

    return (
        <li
            key={peer.socketId}
            className="flex items-center gap-3 p-2 bg-gray-700 rounded-lg shadow cursor-pointer hover:bg-gray-600"
        >
            <img
                src={peer.profilePicture}
                alt={peer.username}
                className="w-10 h-10 rounded-full border-2 border-gray-500"
            />
            <div className="flex flex-col">
                <span className="font-semibold text-white">{peer.username}</span>
                <span className="text-gray-400 text-xs">Active now</span>
            </div>
            
        </li>
    );
};

export default UserCard;