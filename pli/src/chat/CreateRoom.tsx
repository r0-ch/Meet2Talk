import { useNavigate } from 'react-router-dom';

const CreateRoom = () => {
    const navigate = useNavigate();

    const handleCreateRoom = () => {
        const user2Name = "Cyrik"; // Nom de l'utilisateur 2
        navigate(`/room/interface/${user2Name}`);
    };

    return (
        <button onClick={handleCreateRoom}>Create Room</button>
    );
};

export default CreateRoom;
