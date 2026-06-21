import { useNavigate } from "react-router";
import { Button } from "./ui/button";

export function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 text-slate-900 text-center">
      <div className="max-w-md w-full flex flex-col items-center">
        {/* Title */}
        <span className="text-pink-700 font-extrabold text-lg tracking-wider uppercase mb-1">
          Oops!
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
          Something went wrong
        </h2>
        <p className="text-slate-500 text-sm leading-relaxed max-w-sm mx-auto mb-8">
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <Button
          onClick={() => navigate("/")}
          className="px-6 py-5 rounded-lg bg-pink-700 hover:bg-pink-800 text-white text-sm font-semibold transition-all shadow-sm active:scale-95 mb-10"
        >
          Return to Dashboard
        </Button>

        {/* Minimal crane illustration matching the user's uploaded style */}
        <div className="w-full max-w-[280px] opacity-90 mt-4 select-none">
          <svg viewBox="0 0 200 120" className="w-full h-auto text-pink-700 fill-current">
            {/* Ground line */}
            <line x1="10" y1="110" x2="190" y2="110" stroke="currentColor" strokeWidth="1.5" />
            
            {/* Construction Crane */}
            <line x1="60" y1="110" x2="60" y2="30" stroke="currentColor" strokeWidth="2" />
            <line x1="60" y1="35" x2="140" y2="35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <line x1="130" y1="35" x2="130" y2="55" stroke="currentColor" strokeWidth="1" />
            
            {/* Hook and crate/box on crane */}
            <path d="M128,55 Q130,58 132,55" fill="none" stroke="currentColor" strokeWidth="1" />
            <rect x="118" y="59" width="24" height="20" rx="3" className="text-pink-600/10 fill-current" stroke="currentColor" strokeWidth="1.5" />
            <line x1="118" y1="69" x2="142" y2="69" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2" />
            
            {/* Character standing, looking at crane */}
            <circle cx="85" cy="82" r="4" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <line x1="85" y1="86" x2="85" y2="102" stroke="currentColor" strokeWidth="1.5" />
            {/* Arms */}
            <path d="M80,92 L76,86" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            <path d="M90,92 L94,88" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            {/* Legs */}
            <line x1="83" y1="102" x2="81" y2="110" stroke="currentColor" strokeWidth="1.5" />
            <line x1="87" y1="102" x2="89" y2="110" stroke="currentColor" strokeWidth="1.5" />

            {/* Little cloud outlines */}
            <path d="M20,50 A6,6 0 0,1 32,45 A8,8 0 0,1 45,50 L20,50" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
            <path d="M155,40 A5,5 0 0,1 163,36 A6,6 0 0,1 173,40 L155,40" fill="none" stroke="currentColor" strokeWidth="0.75" strokeDasharray="2 2" />
          </svg>
        </div>
      </div>
    </div>
  );
}
