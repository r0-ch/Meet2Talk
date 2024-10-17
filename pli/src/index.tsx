import React from 'react';
import ReactDOM from 'react-dom/client';
import "./style.css"
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Register from "./register";
import Login from "./login";
import CreateRoom from './chat/CreateRoom';
import Room from './chat/Room';
import JoinRoom from './routes/home';

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <JoinRoom/>,
  },
  {
    path: "/register",
    element: <Register/>,
  },
  {
    path: "/login",
    element: <Login/>,
  },
  {
    path: "/room",
    element: <CreateRoom/>,
  },
  {
    path: "/room/:id",
    element: <Room/>,
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
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

serviceWorkerRegistration.unregister();

reportWebVitals();