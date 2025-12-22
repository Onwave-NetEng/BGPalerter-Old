import { useState, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Bell, Mail, MessageSquare, Send, TestTube } from 'lucide-react';

export function NotificationSettings() {
  const { data: settings, refetch } = trpc.notifications.getSettings.useQuery();
  const updateMutation = trpc.notifications.updateSettings.useMutation();
  const testWebhookMutation = trpc.notifications.testWebhook.useMutation();

  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState('');
  const [teamsEnabled, setTeamsEnabled] = useState(false);
  const [teamsWebhookUrl, setTeamsWebhookUrl] = useState('');
  const [slackEnabled, setSlackEnabled] = useState(false);
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('');
  const [discordEnabled, setDiscordEnabled] = useState(false);
  const [discordWebhookUrl, setDiscordWebhookUrl] = useState('');
  const [minSeverity, setMinSeverity] = useState<'critical' | 'warning' | 'info'>('info');

  useEffect(() => {
    if (settings) {
      setEmailEnabled(settings.emailEnabled);
      setEmailRecipients((settings.emailRecipients as string[] || []).join('\n'));
      setTeamsEnabled(settings.teamsEnabled);
      setTeamsWebhookUrl(settings.teamsWebhookUrl || '');
      setSlackEnabled(settings.slackEnabled);
      setSlackWebhookUrl(settings.slackWebhookUrl || '');
      setDiscordEnabled(settings.discordEnabled);
      setDiscordWebhookUrl(settings.discordWebhookUrl || '');
      setMinSeverity(settings.minSeverity);
    }
  }, [settings]);

  const handleSave = async () => {
    try {
      const emailList = emailRecipients.split('\n').filter(e => e.trim());
      
      await updateMutation.mutateAsync({
        emailEnabled,
        emailRecipients: emailList,
        teamsEnabled,
        teamsWebhookUrl: teamsWebhookUrl || undefined,
        slackEnabled,
        slackWebhookUrl: slackWebhookUrl || undefined,
        discordEnabled,
        discordWebhookUrl: discordWebhookUrl || undefined,
        minSeverity,
      });

      await refetch();
      toast.success('Notification settings saved successfully');
    } catch (error) {
      toast.error('Failed to save notification settings');
    }
  };

  const handleTestWebhook = async (channel: 'teams' | 'slack' | 'discord') => {
    try {
      const result = await testWebhookMutation.mutateAsync({ channel });
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error(`Failed to test ${channel} webhook`);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </CardTitle>
          <CardDescription>
            Configure how and where you receive BGP alert notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Minimum Severity Filter */}
          <div className="space-y-2">
            <Label htmlFor="minSeverity">Minimum Severity Level</Label>
            <Select value={minSeverity} onValueChange={(value: any) => setMinSeverity(value)}>
              <SelectTrigger id="minSeverity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical Only</SelectItem>
                <SelectItem value="warning">Warning and Above</SelectItem>
                <SelectItem value="info">All Alerts</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              Only send notifications for alerts at or above this severity level
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>
          <CardDescription>
            Send email notifications when BGP alerts occur
          </CardDescription>
        </CardHeader>
        {emailEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="emailRecipients">Email Recipients (one per line)</Label>
              <Textarea
                id="emailRecipients"
                value={emailRecipients}
                onChange={(e) => setEmailRecipients(e.target.value)}
                placeholder="admin@example.com&#10;ops@example.com"
                rows={4}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Note: Email notifications require BGPalerter's reportEmail module to be configured.
              See the Email Config tab for setup instructions.
            </p>
          </CardContent>
        )}
      </Card>

      {/* Microsoft Teams */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Microsoft Teams</CardTitle>
            </div>
            <Switch
              checked={teamsEnabled}
              onCheckedChange={setTeamsEnabled}
            />
          </div>
          <CardDescription>
            Send notifications to Microsoft Teams channels via webhook
          </CardDescription>
        </CardHeader>
        {teamsEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="teamsWebhookUrl">Teams Webhook URL</Label>
              <Input
                id="teamsWebhookUrl"
                type="url"
                value={teamsWebhookUrl}
                onChange={(e) => setTeamsWebhookUrl(e.target.value)}
                placeholder="https://outlook.office.com/webhook/..."
              />
              <p className="text-sm text-muted-foreground">
                Create an Incoming Webhook in your Teams channel and paste the URL here
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestWebhook('teams')}
              disabled={!teamsWebhookUrl || testWebhookMutation.isPending}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Teams Webhook
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Slack */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <CardTitle>Slack</CardTitle>
            </div>
            <Switch
              checked={slackEnabled}
              onCheckedChange={setSlackEnabled}
            />
          </div>
          <CardDescription>
            Send notifications to Slack channels via webhook
          </CardDescription>
        </CardHeader>
        {slackEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slackWebhookUrl">Slack Webhook URL</Label>
              <Input
                id="slackWebhookUrl"
                type="url"
                value={slackWebhookUrl}
                onChange={(e) => setSlackWebhookUrl(e.target.value)}
                placeholder="https://hooks.slack.com/services/..."
              />
              <p className="text-sm text-muted-foreground">
                Create an Incoming Webhook in your Slack workspace and paste the URL here
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestWebhook('slack')}
              disabled={!slackWebhookUrl || testWebhookMutation.isPending}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Slack Webhook
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Discord */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              <CardTitle>Discord</CardTitle>
            </div>
            <Switch
              checked={discordEnabled}
              onCheckedChange={setDiscordEnabled}
            />
          </div>
          <CardDescription>
            Send notifications to Discord channels via webhook
          </CardDescription>
        </CardHeader>
        {discordEnabled && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="discordWebhookUrl">Discord Webhook URL</Label>
              <Input
                id="discordWebhookUrl"
                type="url"
                value={discordWebhookUrl}
                onChange={(e) => setDiscordWebhookUrl(e.target.value)}
                placeholder="https://discord.com/api/webhooks/..."
              />
              <p className="text-sm text-muted-foreground">
                Create a Webhook in your Discord channel settings and paste the URL here
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleTestWebhook('discord')}
              disabled={!discordWebhookUrl || testWebhookMutation.isPending}
            >
              <TestTube className="h-4 w-4 mr-2" />
              Test Discord Webhook
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          size="lg"
        >
          Save Notification Settings
        </Button>
      </div>
    </div>
  );
}
