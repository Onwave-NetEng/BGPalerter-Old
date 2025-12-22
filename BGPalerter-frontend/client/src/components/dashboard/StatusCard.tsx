import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  status: "healthy" | "warning" | "error" | "unknown";
  description?: string;
  lastUpdated?: Date;
  className?: string;
  helpId?: string;
}

const statusConfig = {
  healthy: {
    color: "text-green-500",
    bg: "bg-green-500/10",
    border: "border-green-500/50",
  },
  warning: {
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    border: "border-yellow-500/50",
  },
  error: {
    color: "text-red-500",
    bg: "bg-red-500/10",
    border: "border-red-500/50",
  },
  unknown: {
    color: "text-muted-foreground",
    bg: "bg-muted/10",
    border: "border-muted/50",
  },
};

export function StatusCard({
  title,
  value,
  icon: Icon,
  status,
  description,
  lastUpdated,
  className,
  helpId,
}: StatusCardProps) {
  const config = statusConfig[status];

  return (
    <Card 
      className={cn("border-2", config.border, className)}
      {...(helpId ? { 'data-help-id': helpId } : {})}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-2 rounded-lg", config.bg)}>
          <Icon className={cn("h-4 w-4", config.color)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {lastUpdated && (
          <p className="text-xs text-muted-foreground mt-2">
            Last updated: {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
