import { useNavigate } from "react-router";
import { MoveLeft, HelpCircle } from "lucide-react";
import { Button } from "./ui/button";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen p-6 bg-slate-950 text-white overflow-hidden">
      {/* Background glowing light blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-700/10 rounded-full blur-[100px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-indigo-700/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      <div className="relative z-10 w-full max-w-md p-8 sm:p-10 rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-xl shadow-2xl text-center">
        <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl bg-gradient-to-tr from-pink-500 to-indigo-600 shadow-lg shadow-indigo-500/20 mb-6 sm:mb-8 mx-auto hover:rotate-6 transition-transform duration-300">
          <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
        </div>

        <h1 className="text-7xl sm:text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 mb-4 select-none">
          404
        </h1>

        <h2 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight mb-3">
          Page Not Found
        </h2>

        <p className="text-slate-400 text-sm leading-relaxed max-w-sm mx-auto mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="w-full h-px bg-slate-800 my-6" />

        <Button
          onClick={() => navigate("/")}
          className="inline-flex items-center gap-2 px-6 py-5 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 hover:from-pink-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-pink-500/25 transition-all active:scale-95"
        >
          <MoveLeft className="w-4 h-4" />
          Return to Dashboard
        </Button>
      </div>
    </div>
  );
}
