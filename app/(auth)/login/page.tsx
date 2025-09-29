// /app/(auth)/login/page.tsx
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { publicConfig } from "@/config/public";

declare global {
  interface Window {
    turnstile: {
      render: (element: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "error-callback"?: () => void;
        theme?: "light" | "dark" | "auto";
      }) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const turnstileRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string>("");
  const router = useRouter();

  useEffect(() => {
    if (publicConfig.turnstileEnabled && turnstileLoaded && turnstileRef.current && !widgetIdRef.current) {
      widgetIdRef.current = window.turnstile.render(turnstileRef.current, {
        sitekey: publicConfig.turnstileSiteKey,
        callback: (token: string) => {
          setTurnstileToken(token);
        },
        "error-callback": () => {
          setError("Turnstile verification failed");
        },
        theme: "light"
      });
    }
  }, [turnstileLoaded]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (publicConfig.turnstileEnabled && !turnstileToken) {
      setError("Please complete the verification");
      return;
    }

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, turnstileToken })
    });

    if (res.ok) {
      router.push("/");
    } else {
      const data = await res.json();
      setError(data.error || "Invalid credentials");
      // Reset Turnstile widget
      if (publicConfig.turnstileEnabled && widgetIdRef.current) {
        window.turnstile.reset(widgetIdRef.current);
        setTurnstileToken("");
      }
    }
  }

  return (
    <>
      {publicConfig.turnstileEnabled && (
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          onLoad={() => setTurnstileLoaded(true)}
          strategy="afterInteractive"
        />
      )}
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <form onSubmit={submit} className="bg-white p-6 rounded shadow w-full max-w-sm space-y-3">
          <h1 className="text-xl font-semibold">Sign in to MantisLite</h1>
          <input
            className="border w-full p-2 rounded"
            placeholder="Username"
            value={username}
            onChange={e=>setUsername(e.target.value)}
            required
          />
          <input
            className="border w-full p-2 rounded"
            placeholder="Password"
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />
          {publicConfig.turnstileEnabled && (
            <div ref={turnstileRef} className="flex justify-center" />
          )}
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            className="w-full border rounded p-2 bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            disabled={publicConfig.turnstileEnabled && !turnstileToken}
          >
            Sign in
          </button>
        </form>
      </main>
    </>
  );
}
