import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { StatusCard } from "@/components/dashboard/StatusCard";
import { MonitorCard } from "@/components/dashboard/MonitorCard";
import { AlertsTable } from "@/components/dashboard/AlertsTable";
import { HelpWrapper } from "@/components/HelpWrapper";
import {
  Activity,
  Shield,
  Heart,
  Globe,
  Eye,
  Route,
  Plus,
  FileCheck,
  RefreshCw,
  LogOut,
  HelpCircle,
  BarChart3,
} from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date>(new Date());

  // Fetch BGPalerter data
  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = trpc.bgpalerter.status.useQuery();
  const { data: monitors, isLoading: monitorsLoading, refetch: refetchMonitors } = trpc.bgpalerter.monitors.useQuery();
  const { data: alerts, isLoading: alertsLoading, refetch: refetchAlerts } = trpc.bgpalerter.alerts.useQuery({ limit: 10 });

  const acknowledgeMutation = trpc.alerts.acknowledge.useMutation({
    onSuccess: () => {
      refetchAlerts();
      toast.success('Alert acknowledged successfully');
    },
    onError: (error) => {
      toast.error(`Failed to acknowledge alert: ${error.message}`);
    },
  });

  const handleAcknowledgeAlert = (alertId: string) => {
    acknowledgeMutation.mutate({ id: parseInt(alertId) });
  };

  const refreshMutation = trpc.bgpalerter.refresh.useMutation({
    onSuccess: () => {
      refetchStatus();
      refetchMonitors();
      refetchAlerts();
      setLastRefreshTime(new Date());
      if (!autoRefreshEnabled) {
        toast.success("Dashboard refreshed successfully");
      }
      setIsRefreshing(false);
    },
    onError: (error) => {
      toast.error(`Refresh failed: ${error.message}`);
      setIsRefreshing(false);
    },
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefreshEnabled) return;

    const interval = setInterval(() => {
      setIsRefreshing(true);
      refreshMutation.mutate();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefreshEnabled, refreshMutation]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshMutation.mutate();
  };

  const handleLogout = () => {
    logout();
  };

  // Monitor icons mapping
  const monitorIcons: Record<string, any> = {
    monitorHijack: Globe,
    monitorRPKI: Shield,
    monitorVisibility: Eye,
    monitorPath: Route,
    monitorNewPrefix: Plus,
    monitorROAS: FileCheck,
  };

  const isLoading = statusLoading || monitorsLoading || alertsLoading;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white font-bold text-base md:text-lg">O</span>
                </div>
                <div>
                  <h1 className="text-base md:text-xl font-bold text-foreground">Onwave</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">BGPalerter Dashboard</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 md:gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs text-muted-foreground hide-mobile">
                <span className="hidden lg:inline">Last updated: {lastRefreshTime.toLocaleTimeString()}</span>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefreshEnabled}
                    onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                    className="rounded"
                  />
                  <span>Auto-refresh (30s)</span>
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="touch-target"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''} md:mr-2`} />
                <span className="hidden md:inline">Refresh</span>
              </Button>
              <Link href="/routing" className="hide-mobile">
                <Button variant="outline" size="sm" className="touch-target">
                  <Route className="h-4 w-4 mr-2" />
                  Routing Data
                </Button>
              </Link>
              <Link href="/rules" className="hide-mobile">
                <Button variant="outline" size="sm" className="touch-target">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Alert Rules
                </Button>
              </Link>
              <Link href="/performance" className="hide-mobile">
                <Button variant="outline" size="sm" className="touch-target">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Performance
                </Button>
              </Link>
              <Button variant="ghost" size="sm" className="touch-target hide-mobile">
                <HelpCircle className="h-4 w-4 mr-2" />
                Help
              </Button>
              <div className="flex items-center gap-2 px-2 md:px-3 py-2 rounded-lg bg-secondary">
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-xs md:text-sm font-semibold">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="text-sm hidden md:block">
                  <div className="font-medium">{user?.name || 'User'}</div>
                  <div className="text-xs text-muted-foreground capitalize">{user?.role || 'viewer'}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="touch-target">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 md:px-6 py-4 md:py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-8">
            {/* Status Overview */}
            <section>
              <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">System Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <HelpWrapper helpId="dashboard-status-ris">
                  <StatusCard
                    title="RIS Connector"
                    value={(status as any)?.connectors?.[0]?.connected ? "Connected" : "Disconnected"}
                    icon={Activity}
                    status={(status as any)?.connectors?.[0]?.connected ? "healthy" : "error"}
                    description="RIPE RIS Live connection"
                    lastUpdated={(status as any)?.lastUpdated}
                  />
                </HelpWrapper>
                <HelpWrapper helpId="dashboard-status-rpki">
                  <StatusCard
                    title="RPKI Status"
                    value={(status as any)?.rpki?.data ? "Data Loaded" : "No Data"}
                    icon={Shield}
                    status={(status as any)?.rpki?.data ? ((status as any)?.rpki?.stale ? "warning" : "healthy") : "error"}
                    description={`Provider: ${(status as any)?.rpki?.provider || 'Unknown'}`}
                    lastUpdated={(status as any)?.lastUpdated}
                  />
                </HelpWrapper>
                <HelpWrapper helpId="dashboard-status-container">
                  <StatusCard
                    title="Container Health"
                    value="Healthy"
                    icon={Heart}
                    status="healthy"
                    description="BGPalerter is running"
                    lastUpdated={(status as any)?.lastUpdated}
                  />
                </HelpWrapper>
              </div>
            </section>

            {/* Monitor Status */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Monitor Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {(monitors as any[])?.map((monitor: any) => (
                  <MonitorCard
                    key={monitor.type}
                    name={monitor.name}
                    type={monitor.type}
                    icon={monitorIcons[monitor.type] || Activity}
                    active={monitor.active}
                  />
                ))}
              </div>
            </section>

            {/* Recent Alerts */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Recent Alerts</h2>
                <Link href="/alerts">
                  <Button variant="outline" size="sm">
                    View All Alerts
                  </Button>
                </Link>
              </div>
              <AlertsTable 
                alerts={alerts || []} 
                onAcknowledge={handleAcknowledgeAlert}
              />
            </section>

            {/* Quick Actions */}
            <section>
              <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button variant="default" className="h-24 flex flex-col gap-2">
                  <Heart className="h-6 w-6" />
                  <span>Test Health</span>
                </Button>
                <Button variant="default" className="h-24 flex flex-col gap-2">
                  <FileCheck className="h-6 w-6" />
                  <span>View Logs</span>
                </Button>
                <Button variant="default" className="h-24 flex flex-col gap-2">
                  <Shield className="h-6 w-6" />
                  <span>Configuration</span>
                </Button>
                <Button variant="default" className="h-24 flex flex-col gap-2">
                  <RefreshCw className="h-6 w-6" />
                  <span>Restart Service</span>
                </Button>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
