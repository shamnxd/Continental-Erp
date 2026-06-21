import { DotLottiePlayer } from "@dotlottie/react-player";
import { useTheme } from "../hooks/useTheme";

/**
 * Reusable full-screen loading component.
 * Adapts its background to the active corporate theme (dark/light).
 * Drop-in for any area that needs a loading state.
 */
export function LoadingScreen() {
  const isDark = useTheme();

  return (
    <div
      className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDark ? "bg-slate-950" : "bg-white"
      }`}
    >
      <div className="flex items-center justify-center h-48 w-48 shrink-0">
        <DotLottiePlayer
          src="/Cat Crying emojiSticker animation.lottie"
          autoplay
          loop
          style={{ height: "160px", width: "160px" }}
        />
      </div>
    </div>
  );
}
