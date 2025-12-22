import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MonitorCardProps {
  name: string;
  type: string;
  icon: LucideIcon;
  active: boolean;
  className?: string;
}

export function MonitorCard({
  name,
  type,
  icon: Icon,
  active,
  className,
}: MonitorCardProps) {
  return (
    <Card className={cn("border-2 border-primary/40", className)}>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="p-4 rounded-full bg-primary/20">
            <Icon className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">{name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{type}</p>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "h-2 w-2 rounded-full",
                active ? "bg-green-500" : "bg-red-500"
              )}
            />
            <span className={cn(
              "text-sm font-medium",
              active ? "text-green-500" : "text-red-500"
            )}>
              {active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
