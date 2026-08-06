import { Outlet } from "react-router";
import Footer from "~/components/footer";
import Header from "~/components/header";

export default function LandingLayout() {
  return (
    <div className="landing-theme min-h-screen bg-background pt-16 text-foreground">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
}
