import React from 'react';
import ReactDOM from 'react-dom/client';
import "./style.css"
import "./index.css";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
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

serviceWorkerRegistration.unregister();

reportWebVitals();