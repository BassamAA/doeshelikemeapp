"use client";

import { signIn } from "next-auth/react";

type Provider = {
  id: string;
  name: string;
};

export default function SignInButtons({ providers }: { providers: Provider[] }) {
  if (!providers.length) return null;
  return (
    <div className="space-y-3">
      {providers.map((provider) => (
        <button
          key={provider.name}
          onClick={() => signIn(provider.id, { callbackUrl: "/app" })}
          className="w-full rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-[#0b0d10]"
        >
          Continue with {provider.name}
        </button>
      ))}
    </div>
  );
}
