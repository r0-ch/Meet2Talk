import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';

const RoomInterface = () => {
    const { roomId } = useParams<{ roomId: string }>();
    const location = useLocation();
    const { username } = location.state || { username: 'You' };
    const [currentMessage, setCurrentMessage] = useState('');
    const [messages, setMessages] = useState<{ text: string; user: number }[]>([]);
    const [profilePictures, setProfilePictures] = useState<string[]>([]);
    const [isChatExpanded, setIsChatExpanded] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null); // Référence pour le défilement

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
        setProfilePictures(getRandomProfiles());
    }, []);

    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (currentMessage.trim()) {
            const user = messages.length % 2 === 0 ? 1 : 2;
            setMessages([...messages, { text: currentMessage, user }]);
            setCurrentMessage('');
        }
    };

    // Utilise useEffect pour défiler vers le bas à chaque ajout de message
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    return (
        <div className="flex flex-col items-center bg-gray-50 min-h-screen py-10">
            {/* Section des images de profil / caméras */}
            {!isChatExpanded && (
                <div className="flex justify-center space-x-4 gap-x-20 mb-4 w-288 bg-white p-8 border border-gray-300 rounded-lg shadow-lg">
                    <div className="w-96 h-64 flex items-center justify-center overflow-hidden border border-gray-300 rounded-lg">
                        <img
                            src={profilePictures[0]}
                            alt="Profile 1"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="w-96 h-64 flex items-center justify-center overflow-hidden border border-gray-300 rounded-lg">
                        <img
                            src={profilePictures[1]}
                            alt="Profile 2"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            )}

            {/* Affichage des messages */}
            <div
                className={`w-288 ${isChatExpanded ? 'h-[700px]' : 'h-[500px]'} border border-gray-300 p-4 rounded-lg overflow-y-auto bg-white shadow-md relative`}
            >
                <div className="sticky top-0 flex justify-end z-10">
                    <button
                        onClick={() => setIsChatExpanded(!isChatExpanded)}
                        className="text-gray-600 hover:text-gray-800"
                    >
                        {isChatExpanded ? '➖' : '➕'}
                    </button>
                </div>
                {messages.length === 0 ? (
                    <p className="text-gray-600 text-center">Aucun message</p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex items-center mb-3 ${msg.user === 1 ? 'justify-start' : 'justify-end'}`}
                        >
                            {msg.user === 1 && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-gray-300 mr-2">
                                    <img
                                        src={profilePictures[0]}
                                        alt="Profile 1"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div
                                className={`p-3 rounded-lg max-w-md break-words text-white ${
                                    msg.user === 1 ? 'bg-red-400' : 'bg-blue-400'
                                }`}
                            >
                                <span className="font-semibold block mb-1">
                                    {msg.user === 1 ? 'Anonyme' : username}:
                                </span>
                                <span>{msg.text}</span>
                            </div>
                            {msg.user === 2 && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-gray-300 ml-2">
                                    <img
                                        src={profilePictures[1]}
                                        alt="Profile 2"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} /> {/* Référence pour scroller au bas */}
            </div>

            {/* Formulaire de saisie de message */}
            <form onSubmit={handleSendMessage} className="mt-4 w-288">
                <div className="relative">
                    <input
                        type="text"
                        value={currentMessage}
                        onChange={(e) => setCurrentMessage(e.target.value)}
                        className="w-full p-4 pr-16 rounded-lg bg-white text-gray-700 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400 shadow"
                        placeholder="Écrivez un message..."
                    />
                    <button
                        type="submit"
                        className="absolute right-2 top-2 bottom-2 bg-blue-400 text-white p-3 rounded-lg hover:bg-blue-500 transition"
                    >
                        Envoyer
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RoomInterface;
