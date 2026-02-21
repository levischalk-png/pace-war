"use client";

import { useEffect, useRef, useState } from "react";

export function ServiceWorkerRegister() {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    const isDev =
      process.env.NODE_ENV === "development" ||
      window.location.hostname === "localhost";
    if (isDev) return;

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", {
          updateViaCache: "none",
        });

        registration.update();

        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener("statechange", () => {
            if (
              newWorker.state === "installed" &&
              navigator.serviceWorker.controller
            ) {
              waitingWorkerRef.current = newWorker;
              setShowUpdateModal(true);
            }
          });
        });
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register);
    }

    return () => {
      window.removeEventListener("load", register);
    };
  }, []);

  const handleUpdateNow = () => {
    const w = waitingWorkerRef.current;
    if (w) {
      navigator.serviceWorker.addEventListener(
        "controllerchange",
        () => window.location.reload(),
        { once: true }
      );
      w.postMessage({ type: "SKIP_WAITING" });
    }
    setShowUpdateModal(false);
  };

  if (!showUpdateModal) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-labelledby="update-title"
      aria-modal="true"
    >
      <div className="w-full max-w-sm rounded-2xl border-2 border-black bg-white p-6 shadow-lg">
        <p
          id="update-title"
          className="mb-4 text-center text-lg font-semibold text-black"
        >
          Nieuwe versie beschikbaar!
        </p>
        <p className="mb-6 text-center text-sm text-gray-600">
          Vernieuw de pagina om de nieuwste Pace War te gebruiken.
        </p>
        <button
          type="button"
          onClick={handleUpdateNow}
          className="w-full rounded-xl border-2 border-black bg-esport-blue px-4 py-3 font-bold text-white transition-all hover:bg-esport-blue-dark focus:outline-none focus:ring-2 focus:ring-esport-blue focus:ring-offset-2"
        >
          Update nu
        </button>
      </div>
    </div>
  );
}

