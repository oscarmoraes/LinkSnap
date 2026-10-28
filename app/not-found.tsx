import Link from "next/link";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#F1F5F9] p-4 text-zinc-900 antialiased">
      <div className="w-full max-w-md text-center space-y-4 rounded-3xl border border-zinc-200 bg-white p-8 shadow-xl shadow-zinc-900/5">
        <span className="inline-block rounded-full border border-blue-200 bg-blue-50 px-3 py-1 font-mono text-xs font-semibold text-blue-700">
          404 — Página não encontrada
        </span>
        <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-zinc-900">
          Ops, este link não existe.
        </h1>
        <p className="max-w-xs text-xs text-zinc-500 mx-auto">
          O caminho acessado não foi encontrado ou o link curto foi desativado.
        </p>
        <div className="flex items-center justify-center gap-3 pt-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-600/20 transition"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-xl border border-zinc-300 bg-white hover:bg-zinc-50 px-4 py-2.5 text-xs font-medium text-zinc-700 transition"
          >
            <Home className="h-3.5 w-3.5" />
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
