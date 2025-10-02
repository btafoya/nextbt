"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page on client side to avoid server-side redirect error
    router.replace("/");
  }, [router]);

  return null;
}