import type React from "react";
import { createContext, useCallback, useContext, useState } from "react";

interface LoginModalContextType {
  isOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const LoginModalContext = createContext<LoginModalContextType | null>(null);

export function LoginModalProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const openLoginModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <LoginModalContext.Provider
      value={{ isOpen, openLoginModal, closeLoginModal }}
    >
      {children}
    </LoginModalContext.Provider>
  );
}

export function useLoginModal() {
  const context = useContext(LoginModalContext);
  if (!context) {
    throw new Error("useLoginModal must be used within a LoginModalProvider");
  }
  return context;
}
