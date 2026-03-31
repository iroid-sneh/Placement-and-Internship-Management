import './index.css';
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { AppErrorBoundary } from "./components/app/AppErrorBoundary";
import { AuthProvider } from "./context/AuthContext";

const root = createRoot(document.getElementById("root")!);
root.render(
  <AppErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </AppErrorBoundary>
);
