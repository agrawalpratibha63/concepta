"use client";

import dynamic from "next/dynamic";

const ClientApplication = dynamic(() => import("../../ClientApplication"), {
  ssr: false,
  loading: () => (
    <main className="min-h-screen flex items-center justify-center bg-white text-slate-700">
      <p className="font-medium">Loading Concepta…</p>
    </main>
  ),
});

export default function ApplicationRoute() {
  return <ClientApplication />;
}
