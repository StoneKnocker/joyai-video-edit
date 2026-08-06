import { useAppName } from "@/lib/public-env";
import { Link } from "./i18n-link";

export function AppLogo() {
  const appName = useAppName();
  return (
    <Link
      to="/"
      className="group flex shrink-0 cursor-pointer items-center"
    >
      <span className="font-semibold text-current text-xl tracking-tight">
        {appName}
      </span>
    </Link>
  );
}
