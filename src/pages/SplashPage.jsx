import { useApp } from "@/context/AppContext";
import { Progress } from "@/components/ui";

export default function SplashPage() {
  const { orgName, orgLogo } = useApp();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gradient-hero px-6">
      <div className="animate-slide-up flex flex-col items-center gap-6">
        {orgLogo ? (
          <img
            src={orgLogo}
            alt={orgName}
            className="h-20 w-20 rounded-2xl object-cover shadow-glow ring-4 ring-white/50"
          />
        ) : (
          <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center text-white text-3xl font-bold shadow-glow">
            {orgName?.[0] || "O"}
          </div>
        )}
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gradient">{orgName || "OwnCart"}</h1>
          <p className="text-sm text-muted mt-1">Loading your experience…</p>
        </div>
        <div className="w-48">
          <Progress value={65} />
        </div>
      </div>
    </div>
  );
}
