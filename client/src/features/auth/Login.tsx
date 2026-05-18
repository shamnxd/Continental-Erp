import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginUser, setError } from "../../store/slices/authSlice";
import { Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import { AppRoute } from "../../constants/routes.enum";

export function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Auto-redirect if already signed in statefully
  useEffect(() => {
    if (user) {
      navigate(AppRoute.DASHBOARD, { replace: true });
    }
  }, [user, navigate]);

  // Clear errors dynamically when the user starts typing
  useEffect(() => {
    if (error) {
      dispatch(setError(null));
    }
  }, [email, password, dispatch]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const result = await dispatch(loginUser({ email, password }));
      if (loginUser.fulfilled.match(result)) {
        navigate(AppRoute.DASHBOARD, { replace: true });
      }
    } catch (err) {
      console.warn("Sign-in handling failure:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4">
      {/* Background radial glowing effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-pink-700/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-950/80 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-slate-800/80">
          <div className="text-center mb-8">
            <div className="inline-flex h-16 w-16 mb-4 items-center justify-center shrink-0 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner relative">
              <div className="absolute inset-0 bg-pink-600/10 rounded-2xl blur-sm" />
              <img src="/clogo.png" alt="Continental Logo" className="h-10 w-10 object-contain relative z-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Continental</h1>
            <p className="text-sm text-slate-400">Service Management Dispatch System</p>
          </div>

          {/* High-end slide-in alert notice */}
          {error && (
            <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h5 className="text-sm font-semibold text-red-200">Sign-in Failed</h5>
                <p className="text-xs text-red-300/90 mt-1">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="dispatcher@continental.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={submitting}
                className="mt-1 bg-slate-900/50 border-slate-800 text-white placeholder-slate-600 focus:border-pink-600 focus:ring-pink-600/20 rounded-xl"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="password" className="text-slate-300 text-xs font-semibold uppercase tracking-wider">Secret Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={submitting}
                className="mt-1 bg-slate-900/50 border-slate-800 text-white placeholder-slate-600 focus:border-pink-600 focus:ring-pink-600/20 rounded-xl"
              />
            </div>

            <Button 
              type="submit" 
              disabled={submitting}
              className="w-full py-6 bg-gradient-to-r from-pink-700 to-pink-600 hover:from-pink-600 hover:to-pink-500 text-white font-bold rounded-xl shadow-lg shadow-pink-700/10 hover:shadow-pink-700/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Authorize & Sign In</span>
              )}
            </Button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-850 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldAlert className="h-4 w-4 text-pink-600/60" />
            <span>Secure Dispatch Gateway Session</span>
          </div>
        </div>
      </div>
    </div>
  );
}
