import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

import { NhostProvider } from "@nhost/react"; // modern provider
import { nhost } from "./nhost";
import { ApolloProvider } from "@apollo/client";
import { apollo } from "./appollo";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <NhostProvider nhost={nhost}>
      <ApolloProvider client={apollo}>
        <App />
      </ApolloProvider>
    </NhostProvider>
  </React.StrictMode>
);
