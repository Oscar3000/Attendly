import { Button } from '@/components/button';

interface DashboardHeaderProps {
  onCreateInvite: () => void;
}

export default function DashboardHeader({ onCreateInvite }: DashboardHeaderProps) {
  return (
    <div className="flex justify-between items-center mb-8">
      <h1 className="text-4xl font-bold text-gray-900">
        Dashboard
      </h1>
      <Button variant="attendly" onClick={onCreateInvite}>
        Create Invite
      </Button>
    </div>
  );
}