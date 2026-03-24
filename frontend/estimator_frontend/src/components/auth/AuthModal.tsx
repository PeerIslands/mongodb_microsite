"use client";

import { useEffect } from "react";

import { useAuthModal } from "@/contexts/AuthModalContext";
import { useAuthStore } from "@estimator/store/authStore";

type AuthModalProps = {
  onClose: () => void;
  initialMode?: "login" | "signup";
};

export default function AuthModal({ onClose, initialMode = "login" }: AuthModalProps) {
  const { openLoginModal } = useAuthModal();

  useEffect(() => {
    const handleSuccess = () => {
      useAuthStore.getState().syncFromMicrosite();
      onClose();
    };

    void initialMode;
    openLoginModal(handleSuccess);
  }, [initialMode, onClose, openLoginModal]);

  return null;
}
