import React from 'react';
import ReactDOM from 'react-dom/client';
import "./style.css"
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import JoinRoom from './routes/home';


const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <JoinRoom/>,
  },
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