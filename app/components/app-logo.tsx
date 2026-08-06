import { useAppName } from "@/lib/public-env";
import { Link } from "./i18n-link";

export function AppLogo() {
  const appName = useAppName();
  return (
    <Link
      to="/"
      className="group flex shrink-0 cursor-pointer items-center gap-3"
    >
      <img
        src="/logo.png"
        alt={appName}
        className="size-9 shrink-0 transition-opacity group-hover:opacity-90"
      />
      <span className="font-semibold text-current text-xl tracking-tight">
        {appName}
      </span>
    </Link>
  );
}
