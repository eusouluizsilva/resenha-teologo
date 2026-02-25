import { useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function UserSync() {
  const { user, isLoaded } = useUser();
  const getOrCreateUser = useMutation(api.users.getOrCreateUser);

  useEffect(() => {
    if (!isLoaded || !user) return;

    getOrCreateUser({
      clerkId: user.id,
      name: user.fullName ?? user.username ?? "Sem nome",
      email: user.primaryEmailAddress?.emailAddress ?? "",
      imageUrl: user.imageUrl ?? undefined,
    });
  }, [isLoaded, user]);

  return null;
}
