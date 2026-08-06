import { Button } from "~/components/ui/button";
import { useLoginModal } from "~/hooks/use-login-modal";

export default function TestPage() {
  const { openLoginModal } = useLoginModal();

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <Button size="lg" onClick={openLoginModal}>
        Open Login
      </Button>
    </main>
  );
}
