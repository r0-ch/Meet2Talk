import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const RoomInterface = () => {
    const navigate = useNavigate();
    const [currentMessage, setCurrentMessage] = useState('');
    const [messages, setMessages] = useState<{ text: string; user: number }[]>([]);
    const [profilePictures, setProfilePictures] = useState<string[]>([]); // Pour stocker les images de profil

     // Liste de 10 images de profil
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

    // Fonction pour choisir aléatoirement deux images de profil
    const getRandomProfiles = () => {
        const shuffled = [...allProfilePictures].sort(() => 0.5 - Math.random());
        return shuffled.slice(0, 2); // Prendre les deux premières images après le mélange
    };

    useEffect(() => {
        // Récupérer les images de profil à l'initialisation
        setProfilePictures(getRandomProfiles());
    }, []);

    // Fonction pour gérer l'envoi de messages
    const handleSendMessage = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault(); // Empêche le rechargement de la page
        if (currentMessage.trim()) {
            // Ajoute le message à la liste avec l'utilisateur
            const user = messages.length % 2 === 0 ? 1 : 2; // Utilisateur 1 ou 2 basé sur l'index
            setMessages([...messages, { text: currentMessage, user }]);
            setCurrentMessage(''); // Réinitialise le champ de saisie
        }
    };

    return (
        <div className="flex flex-col items-center">
            {/* Section des images de profil */}
            <div className="flex justify-center space-x-4 mb-4 gap-50 mt-20 gap-[63vw]">
                {/* Image de profil 1 */}
                <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border border-gray-500">
                    <img
                        src={profilePictures[0]} // Profil picture 1
                        alt="Profile 1"
                        className="w-full h-full object-cover"
                    />
                </div>
                {/* Image de profil 2 */}
                <div className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border border-gray-500">
                    <img
                        src={profilePictures[1]} // Profil picture 2
                        alt="Profile 2"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Affichage des messages */}
            <div className="w-[80%] h-[500px] border border-gray-300 p-2 rounded-md overflow-y-auto bg-white mb-4">
                {messages.length === 0 ? (
                    <p>Aucun message</p>
                ) : (
                    messages.map((msg, index) => (
                        <div
                            key={index}
                            className={`flex items-center mb-2 ${msg.user === 1 ? 'justify-start' : 'justify-end'}`}
                        >
                            {msg.user === 1 && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-gray-500 mr-2">
                                    <img
                                        src={profilePictures[0]} // Image de profil de l'utilisateur 1
                                        alt="Profile 1"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                            <div
                                className={`p-2 rounded ${msg.user === 1 ? 'bg-blue-200' : 'bg-green-200'}`}
                            >
                                <span className="font-semibold">Utilisateur {msg.user}: </span>
                                <span>{msg.text}</span>
                            </div>
                            {msg.user === 2 && (
                                <div className="w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border border-gray-500 ml-2">
                                    <img
                                        src={profilePictures[1]} // Image de profil de l'utilisateur 2
                                        alt="Profile 2"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            {/* Formulaire de saisie de message */}
            <form onSubmit={handleSendMessage} className="mt-3 w-[80%]">
                <input
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    className="border border-gray-300 p-2 w-full rounded"
                    placeholder="Écrivez un message..."
                />
                <button
                    type="submit"
                    className="mt-2 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
                >
                </button>
            </form>
        </div>
    );
}

export default RoomInterface;
