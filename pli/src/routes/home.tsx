import { useState } from "react";
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';

export default function JoinRoom() {
  const [username, setUsername] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("fr");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tags, setTags] = useState<string[]>([]); // État pour gérer les tags
  const [tagInput, setTagInput] = useState(""); // État pour l'entrée du tag

  const joinRandomRoom = () => {
    const randomRoom = Math.random().toString(36).substring(2, 10); // Génère un ID de room aléatoire
    console.log(`User: ${username} joined Room: ${randomRoom} with Language: ${selectedLanguage} and Tags: ${tags}`);
    // Rediriger ou gérer la logique pour rejoindre la room
  };

  // Fonction pour ajouter un tag
  const addTag = (e : any) => {
    e.preventDefault();
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput(""); // Réinitialise l'entrée du tag après ajout
    }
  };

  // Fonction pour supprimer un tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
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
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="fr">Français</option>
              <option value="en">English</option>
              <option value="zh">中文</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
            </select>

            {/* Input pour ajouter des tags */}
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addTag}
                className="w-full bg-green-500 text-white py-2 rounded transition duration-300 ease-in-out transform hover:bg-green-600 hover:scale-105"
              >
                Add Tag
              </button>
            </div>
            {/* Afficher la liste des tags */}
            <div className="flex flex-wrap space-x-2 mt-4">
              {tags.map((tag, index) => (
                <span key={index} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-full flex items-center">
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
            <button
              type="submit"
              className="w-full bg-gray-200 text-white py-2 rounded transition duration-300 ease-in-out transform hover:bg-blue-600 hover:scale-105"
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
