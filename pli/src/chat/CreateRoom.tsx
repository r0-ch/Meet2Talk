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
        <div>
            <h1>Bonjour {username}</h1>
            <button onClick={handleCreateRoom}>Create Room</button>
        </div>
    );
};

export default CreateRoom;
