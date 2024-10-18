import { useNavigate } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';

const CreateRoom = () => {
    const navigate = useNavigate();

    function create() {
        const id = uuidv4();
        navigate(`/room/create${id}`);
    }

    return (
        <button onClick={create}>Create room</button>
    );
}

export default CreateRoom;