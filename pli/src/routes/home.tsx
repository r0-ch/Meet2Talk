import { useState } from "react";
import { useNavigate } from "react-router-dom";
import config from "../loadenv";

export default function Home() {
  const [username, setUsername] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [showWelcomeBox, setShowWelcomeBox] = useState(true);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const [showCGUPopup, setShowCGUPopup] = useState(false); // État pour gérer l'affichage des CGU
  const [acceptedCGU, setAcceptedCGU] = useState(false); // État pour gérer l'acceptation des CGU
  const navigate = useNavigate();

  const addTag = (e: any) => {
    e.preventDefault();
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput("");
    }
  };

  const removeTag = (e: any, tagToRemove: string) => {
    e.preventDefault();
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (username.trim() === "") {
      setError("Please enter a username.");
      return;
    }
    if (selectedLanguage === "") {
      setError("Please choose a language.");
      return;
    }
    if (!acceptedCGU) {
      setError("You must accept the CGU to proceed.");
      return;
    }
    setError("");
    const room = await fetch(import.meta.env.VITE_REACT_APP_BACKEND + "/api/get-room").then((res) => res.json());

    navigate(`/room/${room.id}`, { state: { username, selectedLanguage } });
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

  const toggleCGUPopup = () => {
    setShowCGUPopup(!showCGUPopup); // Inverse l'affichage du pop-up CGU
  };

  const handleAcceptCGU = () => {
    setAcceptedCGU(true);
    setShowCGUPopup(false); // Fermer le pop-up une fois que les CGU sont acceptées
  };

  return (
    <div className="relative flex items-center justify-center min-h-screen">
      <div
        className="absolute inset-0 bg-cover bg-center animate-bg-scroll"
        style={{
          backgroundImage: `url('/worldwide.jpg')`,
          backgroundSize: "200% 200%",
          filter: "blur(2px)",
        }}
      />
      <div className="absolute inset-0 bg-black opacity-40" />
      {showWelcomeBox && (
        <div className="relative text-center bg-gray-900 bg-opacity-80 p-10 rounded-lg shadow-3xl">
          <h1 className="text-4xl font-bold mb-6 text-white">Welcome to Meet2Talk</h1>
          <button
            id="start-to-talk"
            onClick={toggleForm}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold shadow-3xl transition-transform transform hover:scale-105"
          >
            Start To Talk
          </button>
        </div>
      )}
      {/* Popup Form */}
      {showForm && (
        <div
          className={`fixed inset-0 flex items-center justify-center ${
            isAnimatingOut ? "animate-slide-down" : "animate-slide-up"
          }`}
        >
          <div className="bg-gray-900 bg-opacity-80 p-8 rounded-lg shadow-3xl w-100">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-200">Join a Room</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                maxLength={15}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-200 bg-gray-800 bg-opacity-70 shadow-lg"
              />

              {error && <p className="text-red-500 text-sm">{error}</p>}
              <select
                id="language"
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

              <div className="flex items-center">
                <input
                  id="tag"
                  type="text"
                  placeholder="Add a tag"
                  value={tagInput}
                  maxLength={15}
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
                  <span
                    key={index}
                    className="bg-gray-700 text-gray-200 px-4 py-2 rounded-full flex items-center"
                  >
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

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="accept-cgu"
                  checked={acceptedCGU}
                  onChange={() => setAcceptedCGU(!acceptedCGU)}
                  className="focus:ring-2 focus:ring-blue-500"
                />
                <label
                  htmlFor="accept-cgu"
                  className="text-gray-200 text-sm"
                >
                  I accept the{" "}
                  <button
                    type="button"
                    onClick={toggleCGUPopup}
                    className="text-blue-500"
                  >
                    Terms and Conditions
                  </button>
                </label>
              </div>

              <button
                id="join-room"
                type="submit"
                disabled={username.trim() === "" || selectedLanguage === "" || !acceptedCGU}
                className={`w-full py-2 rounded transition duration-300 ease-in-out transform hover:scale-105 ${
                  username.trim() === "" || selectedLanguage === "" || !acceptedCGU
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-3xl"
                }`}
              >
                Join Room
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CGU Popup */}
      {showCGUPopup && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl max-h-[80%] overflow-y-auto">
          <div className="text-sm text-justify space-y-4">
            <h3 className="text-lg font-semibold">Article 1 : Objet des CGU</h3>
            <p>
              Les présentes Conditions Générales d'Utilisation régissent l'accès et l'utilisation de la plateforme Meet2Talk, qui vise à promouvoir les rencontres internationales en facilitant les échanges linguistiques et culturels entre utilisateurs.
            </p>

            <h3 className="text-lg font-semibold">Article 2 : Acceptation des CGU</h3>
            <p>
              L'inscription et l'utilisation de la plateforme impliquent l'acceptation pleine et entière des présentes CGU. Tout utilisateur refusant ces conditions doit cesser d'utiliser les services.
            </p>

            <h3 className="text-lg font-semibold">Article 3 : Accès à la plateforme</h3>
            <ul className="list-disc pl-6">
              <li>
                <strong>Accessibilité :</strong> La plateforme est disponible sous forme de Progressive Web App (PWA) et est compatible avec les navigateurs modernes sur ordinateurs, tablettes et smartphones.
              </li>
              <li>
                <strong>Normes RGAA :</strong> La plateforme respecte les exigences d'accessibilité numérique définies par le RGAA pour garantir une utilisation inclusive à tous les utilisateurs, y compris les personnes en situation de handicap.
              </li>
            </ul>

            <h3 className="text-lg font-semibold">Article 4 : Authentification</h3>
            <p>
              Les utilisateurs doivent se connecter à l'aide d'un pseudonyme et d'une langue préférée, les informations personnelles ne sont pas stockées.
            </p>

            <h3 className="text-lg font-semibold">Article 5 : Fonctionnalités principales</h3>
            <ul className="list-disc pl-6">
              <li>Rencontre aléatoire entre deux utilisateurs pour des discussions en texte ou en audio.</li>
              <li>Option de traduction en temps réel des messages pour supprimer les barrières linguistiques.</li>
              <li>Système de signalement et de modération basé sur des outils NLP, garantissant un environnement sécurisé.</li>
            </ul>

            <h3 className="text-lg font-semibold">Article 6 : Responsabilités des utilisateurs</h3>
            <p>
              Les utilisateurs s'engagent à respecter les règles de courtoisie, ne pas diffuser de contenus offensants et à utiliser la plateforme conformément aux lois en vigueur.
            </p>


            <h3 className="text-lg font-semibold">Article 8 : Accessibilité et SEO</h3>
            <ul className="list-disc pl-6">
              <li>Conception respectant les normes RGAA pour une accessibilité optimale.</li>
              <li>Optimisation SEO via des balises structurées, une hiérarchie logique des titres et des performances accrues.</li>
            </ul>

            <h3 className="text-lg font-semibold">Article 9 : Loi applicable et juridiction</h3>
            <p>
              Les présentes CGU sont régies par la loi française. En cas de litige, les tribunaux compétents seront ceux du lieu du siège social de Meet2Talk.
            </p>
          </div>
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAcceptCGU}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
              Accepter
            </button>
          </div>
        </div>
      </div>
    )}
    </div>
  );
}
