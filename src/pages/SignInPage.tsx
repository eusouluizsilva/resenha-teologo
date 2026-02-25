import { SignIn } from "@clerk/clerk-react";

export default function SignInPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-950 overflow-hidden">
      <img
        src="/bible-bg.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />
      <div className="relative z-10 flex flex-col items-center gap-6">
        <img src="/logo-resenha.png" alt="Resenha Teólogo" className="w-48" />
        <SignIn routing="path" path="/entrar" signUpUrl="/cadastro" />
      </div>
    </div>
  );
}
