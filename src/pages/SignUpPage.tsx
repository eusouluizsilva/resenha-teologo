import { SignUp } from "@clerk/clerk-react";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-6">
        <img src="/logo-resenha.png" alt="Resenha Teólogo" className="w-48" />
        <SignUp routing="path" path="/cadastro" signInUrl="/entrar" />
      </div>
    </div>
  );
}
