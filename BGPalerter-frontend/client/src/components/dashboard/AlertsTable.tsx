import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Info, AlertCircle, CheckCircle, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Alert {
  id: string;
  timestamp: Date;
  type: string;
  prefix: string;
  severity: "critical" | "warning" | "info";
  message: string;
  resolved: boolean;
  acknowledged?: boolean;
}

interface AlertsTableProps {
  alerts: Alert[];
  className?: string;
  onAcknowledge?: (alertId: string) => void;
  onResolve?: (alertId: string) => void;
}

const severityConfig = {
  critical: {
    icon: AlertTriangle,
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/50",
  },
  warning: {
    icon: AlertCircle,
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/50",
  },
  info: {
    icon: Info,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    border: "border-blue-500/50",
  },
};

export function AlertsTable({ alerts, className, onAcknowledge, onResolve }: AlertsTableProps) {
  if (alerts.length === 0) {
    return (
      <div className={cn("flex flex-col items-center justify-center py-12", className)}>
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Active Alerts</h3>
        <p className="text-sm text-muted-foreground">
          Your BGP monitoring is running smoothly
        </p>
      </div>
    );
  }

  return (
    <div className={cn("rounded-md border", className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Timestamp</TableHead>
            <TableHead>Alert Type</TableHead>
            <TableHead>Prefix</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[120px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alerts.map((alert) => {
            const config = severityConfig[alert.severity];
            const Icon = config.icon;

            return (
              <TableRow key={alert.id}>
                <TableCell className="font-mono text-xs">
                  {new Date(alert.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", config.color)} />
                    <span>{alert.type}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono">{alert.prefix}</TableCell>
                <TableCell>
                  {alert.resolved ? (
                    <Badge variant="outline" className="border-green-500/50 text-green-500">
                      Resolved
                    </Badge>
                  ) : alert.acknowledged ? (
                    <Badge variant="outline" className="border-blue-500/50 text-blue-500">
                      Acknowledged
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={cn("border-2", config.border, config.color)}
                    >
                      {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                    </Badge>
                  )}
                </TableCell>
                <TableCell>
                  {!alert.resolved && !alert.acknowledged && onAcknowledge && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onAcknowledge(alert.id)}
                      className="h-8 px-2"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Acknowledge
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
