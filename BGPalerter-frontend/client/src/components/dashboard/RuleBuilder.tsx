import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

interface RuleCondition {
  field: string;
  operator: string;
  value: string;
}

interface AlertRule {
  id?: number;
  name: string;
  description: string;
  enabled: boolean;
  ruleType: "prefix_length" | "as_path_pattern" | "roa_mismatch" | "announcement_rate" | "custom";
  conditions: RuleCondition[];
  severity: "critical" | "warning" | "info";
  notificationChannels: string[];
}

interface RuleBuilderProps {
  rule?: AlertRule;
  onSave: (rule: AlertRule) => void;
  onCancel: () => void;
}

const ruleTypeOptions = [
  { value: "prefix_length", label: "Prefix Length Change" },
  { value: "as_path_pattern", label: "AS Path Pattern" },
  { value: "roa_mismatch", label: "ROA Mismatch" },
  { value: "announcement_rate", label: "Announcement Rate" },
  { value: "custom", label: "Custom Condition" },
];

const fieldOptions: Record<string, { value: string; label: string }[]> = {
  prefix_length: [
    { value: "prefix_length", label: "Prefix Length" },
    { value: "prefix", label: "Prefix" },
  ],
  as_path_pattern: [
    { value: "as_path", label: "AS Path" },
    { value: "as_path_length", label: "AS Path Length" },
  ],
  roa_mismatch: [
    { value: "roa_status", label: "ROA Status" },
    { value: "origin_asn", label: "Origin ASN" },
  ],
  announcement_rate: [
    { value: "announcements_per_minute", label: "Announcements per Minute" },
    { value: "withdrawals_per_minute", label: "Withdrawals per Minute" },
  ],
  custom: [
    { value: "custom_field", label: "Custom Field" },
  ],
};

const operatorOptions = [
  { value: "equals", label: "Equals" },
  { value: "not_equals", label: "Not Equals" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "contains", label: "Contains" },
  { value: "matches_regex", label: "Matches Regex" },
];

export function RuleBuilder({ rule, onSave, onCancel }: RuleBuilderProps) {
  const [formData, setFormData] = useState<AlertRule>(
    rule || {
      name: "",
      description: "",
      enabled: true,
      ruleType: "prefix_length",
      conditions: [{ field: "", operator: "equals", value: "" }],
      severity: "warning",
      notificationChannels: [],
    }
  );

  const handleAddCondition = () => {
    setFormData({
      ...formData,
      conditions: [...formData.conditions, { field: "", operator: "equals", value: "" }],
    });
  };

  const handleRemoveCondition = (index: number) => {
    const newConditions = formData.conditions.filter((_, i) => i !== index);
    setFormData({ ...formData, conditions: newConditions });
  };

  const handleConditionChange = (index: number, field: keyof RuleCondition, value: string) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  const handleChannelToggle = (channel: string) => {
    const channels = formData.notificationChannels.includes(channel)
      ? formData.notificationChannels.filter((c) => c !== channel)
      : [...formData.notificationChannels, channel];
    setFormData({ ...formData, notificationChannels: channels });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a rule name");
      return;
    }

    if (formData.conditions.some((c) => !c.field || !c.value)) {
      toast.error("Please complete all condition fields");
      return;
    }

    onSave(formData);
  };

  const availableFields = fieldOptions[formData.ruleType] || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{rule ? "Edit Alert Rule" : "Create Alert Rule"}</CardTitle>
        <CardDescription>
          Define custom conditions to trigger alerts based on BGP events
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Rule Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Large Prefix Length Change"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this rule monitors..."
              rows={3}
            />
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={formData.enabled}
              onCheckedChange={(checked) => setFormData({ ...formData, enabled: checked })}
            />
            <Label>Rule Enabled</Label>
          </div>
        </div>

        {/* Rule Type */}
        <div>
          <Label>Rule Type</Label>
          <Select
            value={formData.ruleType}
            onValueChange={(value: any) =>
              setFormData({ ...formData, ruleType: value, conditions: [{ field: "", operator: "equals", value: "" }] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ruleTypeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Conditions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Conditions</Label>
            <Button variant="outline" size="sm" onClick={handleAddCondition}>
              <Plus className="h-4 w-4 mr-1" />
              Add Condition
            </Button>
          </div>

          {formData.conditions.map((condition, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs">Field</Label>
                <Select
                  value={condition.field}
                  onValueChange={(value) => handleConditionChange(index, "field", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFields.map((field) => (
                      <SelectItem key={field.value} value={field.value}>
                        {field.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label className="text-xs">Operator</Label>
                <Select
                  value={condition.operator}
                  onValueChange={(value) => handleConditionChange(index, "operator", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {operatorOptions.map((op) => (
                      <SelectItem key={op.value} value={op.value}>
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1">
                <Label className="text-xs">Value</Label>
                <Input
                  value={condition.value}
                  onChange={(e) => handleConditionChange(index, "value", e.target.value)}
                  placeholder="Enter value"
                />
              </div>

              {formData.conditions.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveCondition(index)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        {/* Severity */}
        <div>
          <Label>Severity</Label>
          <Select
            value={formData.severity}
            onValueChange={(value: any) => setFormData({ ...formData, severity: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="info">Info</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Notification Channels */}
        <div className="space-y-3">
          <Label>Notification Channels</Label>
          <div className="space-y-2">
            {["email", "teams", "slack", "discord"].map((channel) => (
              <div key={channel} className="flex items-center gap-2">
                <Switch
                  checked={formData.notificationChannels.includes(channel)}
                  onCheckedChange={() => handleChannelToggle(channel)}
                />
                <Label className="capitalize">{channel}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>
            <Save className="h-4 w-4 mr-2" />
            Save Rule
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
