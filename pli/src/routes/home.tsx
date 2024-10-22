import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRightIcon, ChevronLeftIcon } from '@heroicons/react/24/solid';

export default function Home() {
  const [username, setUsername] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("fr");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState(""); // État pour afficher un message d'erreur
  const navigate = useNavigate();

  // Fonction pour ajouter un tag
  const addTag = (e: any) => {
    e.preventDefault();
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  // Fonction pour supprimer un tag
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  // Fonction pour gérer la soumission du formulaire
  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (username.trim() === "") {
      setError("Please enter a username."); // Afficher une erreur si le pseudo est vide
      return;
    }
    setError(""); // Réinitialise l'erreur si le pseudo est valide
    navigate(`room/create`);
  };

  return (
    
    <div className="flex h-screen">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? "w-64" : "w-0"} bg-gray-800 text-white flex flex-col p-6 transition-width duration-300 overflow-hidden border-r-2 border-indigo-600`}>
        {isSidebarOpen && (
          <>
            <h2 className="text-2xl font-bold mb-8"><a href="/">Meet2Talk</a></h2>
            <nav className="space-y-4 flex-grow">
              <a href="#" className="block py-2 px-4 hover:bg-gray-700 rounded">
                Settings
              </a>
              <a href="#" className="block py-2 px-4 hover:bg-gray-700 rounded">
                About us
              </a>
              
            </nav>
            <p className="block py-2 px-4 hover:bg-gray-700 rounded mt-auto">
              © PLI Inc. Tous droits réservés.
            </p>
          </>
        )}
      </div>

      {/* Sidebar Toggle Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="bg-gray-700 text-white p-2 rounded mb-4 self-end hover:bg-gray-600 transition"
      >
        {isSidebarOpen ? <ChevronLeftIcon className="h-5 w-5" /> : <ChevronRightIcon className="h-5 w-5" />}
      </button>
      {/* Main Content */}
      <div className="flex flex-grow items-center justify-center bg-gray-100">
        <div className="bg-white p-8 rounded shadow-lg w-96">
      <h1 className="flex text-4xl font-bold mb-6 justify-center text-center">Welcome to Meet2Talk</h1>
          <h1 className="text-3xl font-bold mb-6 text-center">Join a Random Room</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {error && <p className="text-red-500 text-sm">{error}</p>} {/* Message d'erreur si le pseudo est vide */}

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
            <div className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center">
              <input
                type="text"
                placeholder="Add a tag"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="focus:outline-none focus:ring-2 focus:ring-blue-500 flex-grow"
              />
              <button
                onClick={addTag}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 focus:outline-none ml-2"
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
              disabled={username.trim() === ""} // Désactive le bouton si le pseudo est vide
              className={`w-full py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 ${username.trim() === "" ? "bg-gray-400 cursor-not-allowed" : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
            >
              Join Room
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
