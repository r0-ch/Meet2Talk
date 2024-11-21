import React, { useEffect, useRef } from "react";

interface Message {
    type: string, 
    socketId: string, 
    username: string, 
    content: string,
    translated: string | null
}

interface TranscriptionsPerUser {
    [key: string]: Message;
}

const TranscriptionsDisplay = ({ transcriptionsPerUser }: { transcriptionsPerUser: TranscriptionsPerUser }) => {
    const containerRef = useRef(null);

    // Défile automatiquement vers le bas
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTop = containerRef.current.scrollHeight;
        }
    }, [transcriptionsPerUser]);

    return (
        <div
            ref={containerRef}
            className="w-full h-60 p-4 rounded-lg bg-gray-700 bg-opacity-90 overflow-x-auto flex gap-4"
        >
            {Object.entries(transcriptionsPerUser).map(([socketId, message]) => (
                <div
                    key={socketId}
                    className="flex-1 flex flex-col justify-end items-stretch bg-gray-800 rounded-lg p-3 w-64"
                >
                    {/* Message unique */}
                    <div className="flex-1 overflow-y-auto space-y-2">
                        <div className="bg-gray-600 p-2 rounded text-sm text-gray-100 shadow">
                            {message.translated || message.content}
                        </div>
                    </div>
                    {/* Nom d'utilisateur */}
                    <div className="mt-2 bg-gray-900 p-2 rounded shadow">
                        <h4 className="text-center text-lg font-bold text-gray-100">
                            {message.username}
                        </h4>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TranscriptionsDisplay;
