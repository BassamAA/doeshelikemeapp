import { redirect } from "next/navigation";
import { auth } from "../../../lib/auth";
import NewProfileForm from "./profile-form";

export default async function NewProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/auth/signin");
  return (
    <div className="min-h-screen bg-[#0b0d10] text-[var(--foreground)]">
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-3xl font-semibold mb-4">Create a person</h1>
        <NewProfileForm />
      </main>
    </div>
  );
}
