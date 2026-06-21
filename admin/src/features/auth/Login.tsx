import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { loginUser, setError } from "../../store/slices/authSlice";
import { Loader2, AlertCircle } from "lucide-react";
import { AppRoute } from "../../constants/routes.enum";

export function Login() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      navigate(AppRoute.DASHBOARD, { replace: true });
    }
  }, [user, navigate]);

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
      console.warn("Sign-in error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm">

        {/* Logo + title */}
        <div className="mb-10 flex flex-col items-center gap-3">
          <img
            src="/clogo.png"
            alt="Continental Logo"
            className="h-12 w-12 object-contain"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Continental
          </h1>
          <p className="text-sm text-slate-500">Service Management System</p>
        </div>

        {/* Error notice */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-100">
            <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-sm font-medium text-slate-700">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@continental.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={submitting}
              className="h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-pink-500 focus-visible:border-pink-500 rounded-lg"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-sm font-medium text-slate-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={submitting}
              className="h-10 border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus-visible:ring-pink-500 focus-visible:border-pink-500 rounded-lg"
            />
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full h-10 bg-gradient-to-r from-pink-700 to-pink-600 hover:from-pink-600 hover:to-pink-500 text-white font-semibold rounded-lg transition-all active:scale-[0.98] cursor-pointer"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Signing in...
              </span>
            ) : (
              "Sign in"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
