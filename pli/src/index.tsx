import ReactDOM from 'react-dom/client';
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from './routes/home';
import ChatRoom from './chat/ChatRoom';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/room/:roomId",
    element: <ChatRoom />,
  },
]);

root.render(
  <RouterProvider router={router} />
);
