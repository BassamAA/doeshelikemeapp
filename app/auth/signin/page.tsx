import SignInButtons from "./signin-buttons";

const providers = [
  { id: "google", name: "Google" },
  { id: "apple", name: "Apple" },
];

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-[#0b0d10] text-[var(--foreground)] flex items-center justify-center px-6">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 text-center">
        <h1 className="text-2xl font-semibold mb-2">Sign in</h1>
        <p className="text-sm text-[var(--muted)] mb-4">Securely continue to your profiles.</p>
        <SignInButtons providers={providers} />
      </div>
    </div>
  );
}
