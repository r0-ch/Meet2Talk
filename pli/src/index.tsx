import React from 'react';
import ReactDOM from 'react-dom/client';
import "./style.css"
import "./index.css";
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import CreateRoom from './chat/CreateRoom';
import Room from './chat/Room';
import RoomInterface from './chat/RoomInterface';
import Home from './routes/home';
import Test from './chat/Test';
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
    path: "/room/create",
    element: <CreateRoom />,
  },
  {
    path: "/room/interface/:roomId",
    // element: <RoomInterface />,
    // element: <Test />,
    element: <ChatRoom />,
  },
  {
    path: "/room/:id",
    element: <Room />,
  }
  // {
  //   path: "/room",
  //   element: <RoomCreate/>,
  // },
  // {
  //   path: "/room/:roomId";
  //   element: <Room/>,
  // }
]);

root.render(
  <RouterProvider router={router} />
);

serviceWorkerRegistration.unregister();

reportWebVitals();