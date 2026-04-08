'use client';

import { useRouter } from 'next/navigation';
import { Button } from "@/components/button";

interface DashboardHeaderProps {
  onCreateInvite: () => void;
}

export default function DashboardHeader({
  onCreateInvite,
}: DashboardHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
      <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">Dashboard</h1>
      <div className="flex gap-3 sm:gap-4">
        <Button variant="attendly" onClick={onCreateInvite} width="auto" height="44px" fontSize="15px" className="flex-1 sm:flex-none px-4">
          Create Invite
        </Button>
        <button
          onClick={handleLogout}
          className="flex-1 sm:flex-none px-4 py-2 rounded-lg font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors text-sm sm:text-base"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
