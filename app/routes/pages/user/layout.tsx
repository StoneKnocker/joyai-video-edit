import { Outlet } from "react-router";
import { requireAuth, requireUser } from "~/middlewares/auth-guard";

export const middleware = [requireAuth];

export async function loader() {
  return requireUser();
}

export default function UserLayout() {
  return <Outlet />;
}
