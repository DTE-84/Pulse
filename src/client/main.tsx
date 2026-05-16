import { createRoot } from "react-dom/client";
import App from "./App";
import { registerSW } from 'virtual:pwa-register';

// Register service worker for PWA
registerSW({ immediate: true });

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
