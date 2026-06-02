import { createRoot } from "react-dom/client";
import App from "./App";
import { registerSW } from 'virtual:pwa-register';

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (const registration of registrations) {
      registration.unregister();
    }
  });
}

// Register service worker for PWA
registerSW({ immediate: true });

const container = document.getElementById("root");
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}
