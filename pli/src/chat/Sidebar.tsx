import React from "react";
import { usePeersContext } from "./PeersContext";
import UserCard from "./UserCard";
import { useNavigate } from "react-router-dom";

const Sidebar = ({ username, isSidebarVisible }) => {
    const {peers} = usePeersContext()
    const navigate = useNavigate()

    return (
        <div
            className={`fixed z-40 pt-[4em] top-0 left-0 h-full bg-gray-800 text-white shadow-lg transition-transform duration-300 ease-in-out ${
                isSidebarVisible ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ width: "280px" }}
        >
            {/* Header */}
            <div className="bg-gray-900 p-4 border-b border-gray-700">
                <h2 className="text-xl font-bold text-white">Users in Room</h2>
                <p className="text-gray-400 text-sm mt-1">Welcome, {username}</p>
            </div>

            {/* List of Users */}
            <div className="p-4 overflow-y-auto h-full">
                <ul className="space-y-4">
                    {peers.map((peer, index) => (
                        <UserCard key={index} peer={peer} />
                    ))}
                </ul>
            </div>
            {/* Footer */}
            <div className="absolute bottom-0 left-0 w-full bg-gray-900 p-4 border-t border-gray-700">
                <button
                    className="w-full text-sm text-gray-400 hover:text-white transition"
                    onClick={() => navigate("/")}
                >
                    Logout
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
