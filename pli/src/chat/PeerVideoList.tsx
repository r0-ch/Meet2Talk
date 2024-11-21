import { usePeersContext } from "./PeersContext"
import PeerVideo from "./PeerVideo"

const PeerVideoList = () => {
    const { peers, dispatch } = usePeersContext()


    return (
        <div>
            {peers.map((peer, index) => {
                return (
                    <PeerVideo key={index} peer={peer} />
                );
            })}
        </div>
    )
}

export default PeerVideoList;