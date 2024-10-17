import { useState } from "react";
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';


export default function JoinRoom() {
  const [username, setUsername] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // État pour gérer la visibilité de la sidebar

  const joinRandomRoom = () => {
    const randomRoom = Math.random().toString(36).substring(2, 10); // Génère un ID de room aléatoire
    console.log(`User: ${username} joined Room: ${randomRoom}`);
    // Rediriger ou gérer la logique pour rejoindre la room
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${
          isSidebarOpen ? "w-64" : "w-0"
        } bg-gray-800 text-white flex flex-col p-6 transition-width duration-300 overflow-hidden border-r-2 border-indigo-600`}
      >
        {isSidebarOpen && (
          <>
            <h2 className="text-2xl font-bold mb-8">Navigation</h2>
            <nav className="space-y-4">
              <a href="#" className="block py-2 px-4 hover:bg-gray-700 rounded">
                Home
              </a>
              <a href="#" className="block py-2 px-4 hover:bg-gray-700 rounded">
                Rooms
              </a>
              <a href="#" className="block py-2 px-4 hover:bg-gray-700 rounded">
                Profile
              </a>
              <a href="#" className="block py-2 px-4 hover:bg-gray-700 rounded">
                Settings
              </a>
            </nav>
          </>
        )}
      </div>
      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="bg-gray-700 text-white p-2 rounded mb-4 self-end hover:bg-gray-600 transition"
      >
        {isSidebarOpen ? (
          <ChevronLeftIcon className="h-5 w-5" />
        ) : (
          <ChevronRightIcon className="h-5 w-5" />
        )}
      </button>
      {/* Main Content */}
      <div className="flex flex-grow items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-lg w-96">
          <h1 className="text-3xl font-bold mb-6 text-center">Join a Random Room</h1>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              joinRandomRoom();
            }}
            className="space-y-4"
          >
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded transition duration-300 ease-in-out transform hover:bg-blue-600 hover:scale-105"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
