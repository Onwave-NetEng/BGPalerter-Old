import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RuleBuilder } from "@/components/dashboard/RuleBuilder";
import { Plus, Edit, Trash2, Power, PowerOff } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function AlertRules() {
  const { user, logout } = useAuth();
  const [showBuilder, setShowBuilder] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);

  const { data: rules, isLoading, refetch } = trpc.rules.list.useQuery();

  const createMutation = trpc.rules.create.useMutation({
    onSuccess: () => {
      toast.success("Alert rule created successfully");
      setShowBuilder(false);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to create rule: ${error.message}`);
    },
  });

  const updateMutation = trpc.rules.update.useMutation({
    onSuccess: () => {
      toast.success("Alert rule updated successfully");
      setShowBuilder(false);
      setEditingRule(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update rule: ${error.message}`);
    },
  });

  const deleteMutation = trpc.rules.delete.useMutation({
    onSuccess: () => {
      toast.success("Alert rule deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to delete rule: ${error.message}`);
    },
  });

  const toggleMutation = trpc.rules.toggle.useMutation({
    onSuccess: () => {
      toast.success("Rule status updated");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to toggle rule: ${error.message}`);
    },
  });

  const handleSaveRule = (rule: any) => {
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, ...rule });
    } else {
      createMutation.mutate(rule);
    }
  };

  const handleEditRule = (rule: any) => {
    setEditingRule(rule);
    setShowBuilder(true);
  };

  const handleDeleteRule = (id: number) => {
    if (confirm("Are you sure you want to delete this rule?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleToggleRule = (id: number, enabled: boolean) => {
    toggleMutation.mutate({ id, enabled: !enabled });
  };

  const handleLogout = async () => {
    await logout();
  };

  if (showBuilder) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold">
                {editingRule ? "Edit Alert Rule" : "Create Alert Rule"}
              </h1>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-6 py-8">
          <RuleBuilder
            rule={editingRule}
            onSave={handleSaveRule}
            onCancel={() => {
              setShowBuilder(false);
              setEditingRule(null);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="sm">
                  ← Back to Dashboard
                </Button>
              </Link>
              <h1 className="text-xl font-bold">Alert Rules</h1>
            </div>

            <div className="flex items-center gap-3">
              <Button onClick={() => setShowBuilder(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Rule
              </Button>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary">
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                  <span className="text-white text-sm font-semibold">
                    {user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <div className="text-sm">
                  <div className="font-medium">{user?.name || "User"}</div>
                  <div className="text-xs text-muted-foreground capitalize">
                    {user?.role || "viewer"}
                  </div>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : rules && rules.length > 0 ? (
          <div className="grid gap-4">
            {rules.map((rule: any) => (
              <Card key={rule.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle>{rule.name}</CardTitle>
                        <Badge
                          variant={rule.enabled ? "default" : "secondary"}
                          className={rule.enabled ? "bg-green-500" : ""}
                        >
                          {rule.enabled ? "Enabled" : "Disabled"}
                        </Badge>
                        <Badge variant="outline" className="capitalize">
                          {rule.severity}
                        </Badge>
                      </div>
                      <CardDescription>{rule.description}</CardDescription>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleRule(rule.id, rule.enabled)}
                      >
                        {rule.enabled ? (
                          <PowerOff className="h-4 w-4" />
                        ) : (
                          <Power className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditRule(rule)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRule(rule.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-2">Rule Type</div>
                      <Badge variant="outline" className="capitalize">
                        {rule.ruleType.replace("_", " ")}
                      </Badge>
                    </div>

                    <div>
                      <div className="text-sm font-medium mb-2">Conditions</div>
                      <div className="space-y-1">
                        {rule.conditions.map((condition: any, index: number) => (
                          <div
                            key={index}
                            className="text-sm text-muted-foreground font-mono"
                          >
                            {condition.field} {condition.operator} "{condition.value}"
                          </div>
                        ))}
                      </div>
                    </div>

                    {rule.notificationChannels && rule.notificationChannels.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">
                          Notification Channels
                        </div>
                        <div className="flex gap-2">
                          {rule.notificationChannels.map((channel: string) => (
                            <Badge key={channel} variant="secondary" className="capitalize">
                              {channel}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {rule.triggerCount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        Triggered {rule.triggerCount} times
                        {rule.lastTriggered && (
                          <span>
                            {" "}
                            • Last: {new Date(rule.lastTriggered).toLocaleString()}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold">No Alert Rules</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Create custom alert rules to monitor specific BGP conditions and receive
                  notifications when they are triggered.
                </p>
                <Button onClick={() => setShowBuilder(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
