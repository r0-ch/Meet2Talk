import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const CreateRoom = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Récupérer le username passé dans le state
    const { username } = location.state || { username: 'You' };

    // Fonction pour générer un roomId aléatoire de 7 chiffres
    const generateRoomId = () => {
        return Math.floor(1000000 + Math.random() * 9000000); // Génère un nombre entre 1000000 et 9999999
    };

    const handleCreateRoom = () => {
        const roomId = generateRoomId();  // Génère un roomId aléatoire
        // Naviguer vers la route avec roomId visible et username dans le state
        navigate(`/room/interface/${roomId}`, { state: { username } });
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-gray-200">
            <h1 className="text-4xl font-bold mb-4 animate-fade-in">Bonjour {username}</h1>
            <p className="text-lg text-gray-400 mb-8 text-center animate-fade-in">
                Cliquez sur le bouton ci-dessous pour créer une salle d'attente ou rejoindre une salle existante.
            </p>
            <button 
                onClick={handleCreateRoom} 
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold rounded-lg shadow-lg transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
            >
                Create Room
            </button>
        </div>
    );
};

export default CreateRoom;
