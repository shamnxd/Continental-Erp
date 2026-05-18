import { Navigate } from "react-router";
import { useAppSelector } from "../store/hooks";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAppSelector((state) => state.auth);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white p-4">
        {/* Sleek animated glassmorphism card */}
        <div className="relative p-12 bg-white/[0.03] backdrop-blur-xl border border-white/[0.05] rounded-3xl shadow-2xl flex flex-col items-center max-w-sm w-full text-center overflow-hidden">
          {/* Top-right glowing gradient circle */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />
          {/* Bottom-left glowing gradient circle */}
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Pulsing logo holder */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-teal-500/20 rounded-full blur-lg animate-pulse" />
            <div className="relative h-16 w-16 flex items-center justify-center shrink-0 rounded-2xl bg-slate-800/80 border border-white/[0.08] shadow-inner">
              <img 
                src="/clogo.png" 
                alt="Continental Logo" 
                className="h-10 w-10 object-contain animate-bounce" 
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          <h2 className="text-xl font-bold tracking-tight text-white mb-2">Continental System</h2>
          <p className="text-sm text-slate-400 mb-8">Authorizing secure corporate credentials...</p>
          
          <div className="relative flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-teal-400 animate-spin" />
            <div className="absolute h-12 w-12 rounded-full border border-teal-500/20 animate-ping opacity-75" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
