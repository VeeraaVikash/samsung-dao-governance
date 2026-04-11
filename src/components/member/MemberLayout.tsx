import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { MemberSidebar } from './MemberSidebar';
import { useAuthStore } from '@/stores/useAuthStore';
import { useMemberDashboardStore } from '@/stores/useMemberDashboardStore';
import { useMemberPortalStore } from '@/stores/useMemberPortalStore';

export function MemberLayout() {
  const navigate = useNavigate();
  const { token, isHydrated } = useAuthStore();
  const { loadMetrics } = useMemberDashboardStore();
  const syncUserFromAuth = useMemberPortalStore((s) => s.syncUserFromAuth);
  const syncWalletFromAuth = useMemberPortalStore((s) => s.syncWalletFromAuth);
  const loadProfile = useMemberPortalStore((s) => s.loadProfile);
  const loadPortalData = useMemberPortalStore((s) => s.loadPortalData);

  useEffect(() => {
    if (!isHydrated) return;
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }
  }, [isHydrated, token, navigate]);

  useEffect(() => {
    if (token) {
      loadMetrics();
      syncUserFromAuth();
      syncWalletFromAuth();
      void loadProfile();
      void loadPortalData();
      const interval = setInterval(loadMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [token, loadMetrics, syncUserFromAuth, syncWalletFromAuth, loadProfile, loadPortalData]);

  return (
    <div className="flex bg-background">
      <MemberSidebar />
      <main className="flex-1 min-h-[calc(100vh-4rem)] overflow-y-auto">
        <div className="p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
