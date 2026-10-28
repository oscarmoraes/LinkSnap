import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black p-4 text-[#ededed] antialiased">
      <div className="text-center space-y-4">
        <span className="inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 font-mono text-xs font-semibold text-blue-400">
          404 — Página não encontrada
        </span>
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
          Ops, este link não existe.
        </h1>
        <p className="max-w-sm text-xs text-neutral-400 mx-auto">
          O caminho acessado não foi encontrado ou o link curto foi desativado.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 px-4 py-2.5 text-xs font-semibold text-white shadow-lg transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Ir para o Dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-[#222222] bg-[#0c0d0e] hover:bg-[#141517] px-4 py-2.5 text-xs font-medium text-neutral-300 transition"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
