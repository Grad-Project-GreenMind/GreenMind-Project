

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css"; 

// google library
import { GoogleOAuthProvider } from '@react-oauth/google';

ReactDOM.createRoot(document.getElementById("root")).render(
  <GoogleOAuthProvider clientId="490826070341-0cnnc0p98s7ac8u94nl203vu85qvbi2f.apps.googleusercontent.com">
    <App />
  </GoogleOAuthProvider>
);