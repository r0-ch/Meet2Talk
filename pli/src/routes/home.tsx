import { useState } from "react";
import { useNavigate } from "react-router-dom";
import React from "react";
import backgroundImage from '../img/worldwide.jpg'; // Chemin vers une image neutre

export default function Home() {
  const [username, setUsername] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState(""); // État initial vide pour la langue
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showWelcomeBox, setShowWelcomeBox] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const navigate = useNavigate();

  const generateRoomId = () => {
    return Math.floor(1000000 + Math.random() * 9000000);
  };

  const addTag = (e: any) => {
    e.preventDefault();
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (e: any, tagToRemove: string) => {
    e.preventDefault();
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (username.trim() === "") {
      setError("Please enter a username.");
      return;
    }
    if (selectedLanguage === "") {
      setError("Please choose a language.");
      return;
    }
    setError("");

    const roomId = generateRoomId();
    navigate(`/room/${roomId}`, { state: { username, selectedLanguage } });
  };

  const toggleForm = () => {
    if (showForm) {
      setIsAnimatingOut(true);
      setTimeout(() => {
        setShowForm(false);
        setShowWelcomeBox(true);
        setIsAnimatingOut(false);
      }, 500);
    } else {
      setShowForm(true);
      setShowWelcomeBox(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${backgroundImage})`, filter: 'blur(4px)' }}
      />
      <div className="absolute inset-0 bg-black opacity-40" /> {/* Couche sombre */}
      {showWelcomeBox && (
        <div className="relative text-center bg-gray-900 bg-opacity-80 p-10 rounded-lg shadow-3xl">
          <h1 className="text-4xl font-bold mb-6 text-white">Welcome to Meet2Talk</h1>
          <button
            onClick={toggleForm}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-3xl transition-transform transform hover:scale-105"
          >
            Start To Talk
          </button>
        </div>
      )}
      {/* Popup Form */}
      {showForm && (
        <div className={`fixed inset-0 flex items-center justify-center ${isAnimatingOut ? 'animate-slide-down' : 'animate-slide-up'}`}>
          <div className="bg-gray-900 bg-opacity-80 p-8 rounded-lg shadow-3xl w-100">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">Join a Room</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Enter your username"
                value={username}
                maxLength={15}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 bg-gray-800 bg-opacity-70 shadow-lg"
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value)}
                className="w-full px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 bg-gray-800 bg-opacity-70 shadow-lg"
              >
                <option value="">Choose your language</option>
                <option value="fr">Français</option>
                <option value="en">English</option>
                <option value="zh">中文</option>
                <option value="es">Español</option>
                <option value="de">Deutsch</option>
                <option value="ja">日本語</option>
                <option value="ko">한국어</option>
              </select>
              <div className="w-full flex items-center">
                <input
                  type="text"
                  placeholder="Add a tag"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  className="flex-grow focus:outline-none px-4 py-2 focus:ring-2 focus:ring-blue-500 text-gray-200 bg-gray-800 bg-opacity-70 shadow-lg rounded-l"
                />
                <button
                  onClick={addTag}
                  className="bg-blue-600 text-white px-4 py-2 rounded-r ml-2 hover:bg-blue-700 focus:outline-none shadow-3xl"
                >
                  Add Tag
                </button>
              </div>
              <div className="flex flex-wrap space-x-2 mt-4">
                {tags.map((tag, index) => (
                  <span key={index} className="bg-gray-700 text-gray-200 px-4 py-2 rounded-full flex items-center">
                    {tag}
                    <button
                      onClick={(e) => removeTag(e, tag)}
                      className="ml-2 text-red-500 hover:text-red-700 focus:outline-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="submit"
                disabled={username.trim() === "" || selectedLanguage === ""}
                className={`w-full py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 ${username.trim() === "" || selectedLanguage === "" ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700 shadow-3xl"}`}
              >
                Join Room
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
