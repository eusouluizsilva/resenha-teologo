import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Navbar from "../../components/ui/Navbar";
import ForumSection from "../../components/ui/ForumSection";

export default function CommunityPage() {
  const { user } = useUser();
  const me = useQuery(api.users.getMe, user ? { clerkId: user.id } : "skip");

  if (!me) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
          Carregando...
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-950 py-10 px-6">
        <div className="max-w-4xl mx-auto">
          <ForumSection meId={me._id} meRole={me.role} />
        </div>
      </main>
    </>
  );
}
