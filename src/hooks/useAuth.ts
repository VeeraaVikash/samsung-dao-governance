"use client";

import { useState, useEffect, useCallback } from "react";
import type { SessionUser } from "@/types";

interface AuthState {
  user: SessionUser | null;
  loading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const user = await res.json();
        setState({ user, loading: false });
      } else {
        setState({ user: null, loading: false });
      }
    } catch {
      setState({ user: null, loading: false });
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const login = async (employeeId: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, password }),
    });
    const data = await res.json();
    if (res.ok) {
      setState({ user: data.user, loading: false });
      return { success: true, user: data.user };
    }
    return { success: false, error: data.error };
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setState({ user: null, loading: false });
  };

  return { ...state, login, logout, refresh };
}
