import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

export function EmailConfigForm() {
  const [smtpHost, setSmtpHost] = useState('smtp.example.com');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpSecure, setSmtpSecure] = useState(false);
  const [smtpUser, setSmtpUser] = useState('user@example.com');
  const [smtpPass, setSmtpPass] = useState('password');
  const [senderEmail, setSenderEmail] = useState('bgpalerter@example.com');
  const [notifiedEmails, setNotifiedEmails] = useState('admin@example.com\nops@example.com');
  const [copied, setCopied] = useState(false);

  const generateConfig = () => {
    const emails = notifiedEmails.split('\n').filter(e => e.trim());
    return `reports:
  - file: reportEmail
    channels:
      - hijack
      - newprefix
      - visibility
      - path
      - misconfiguration
      - rpki
    params:
      showPaths: 5
      senderEmail: ${senderEmail}
      smtp:
        host: ${smtpHost}
        port: ${smtpPort}
        secure: ${smtpSecure}
        auth:
          user: ${smtpUser}
          pass: ${smtpPass}
      notifiedEmails:
${emails.map(email => `        - ${email.trim()}`).join('\n')}`;
  };

  const handleCopy = () => {
    const config = generateConfig();
    navigator.clipboard.writeText(config);
    setCopied(true);
    toast.success('Configuration copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notification Configuration</CardTitle>
          <CardDescription>
            Configure BGPalerter to send email alerts. This generates the reportEmail configuration
            for your config.yml file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={smtpHost}
                onChange={(e) => setSmtpHost(e.target.value)}
                placeholder="smtp.example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={smtpPort}
                onChange={(e) => setSmtpPort(e.target.value)}
                placeholder="587"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="smtpSecure"
              checked={smtpSecure}
              onChange={(e) => setSmtpSecure(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="smtpSecure">Use TLS/SSL (secure connection)</Label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={smtpUser}
                onChange={(e) => setSmtpUser(e.target.value)}
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPass">SMTP Password</Label>
              <Input
                id="smtpPass"
                type="password"
                value={smtpPass}
                onChange={(e) => setSmtpPass(e.target.value)}
                placeholder="password"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="senderEmail">Sender Email Address</Label>
            <Input
              id="senderEmail"
              type="email"
              value={senderEmail}
              onChange={(e) => setSenderEmail(e.target.value)}
              placeholder="bgpalerter@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notifiedEmails">Notification Recipients (one per line)</Label>
            <Textarea
              id="notifiedEmails"
              value={notifiedEmails}
              onChange={(e) => setNotifiedEmails(e.target.value)}
              placeholder="admin@example.com&#10;ops@example.com"
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Configuration</CardTitle>
              <CardDescription>
                Copy this configuration and add it to your BGPalerter config.yml file
              </CardDescription>
            </div>
            <Button onClick={handleCopy} variant="outline" size="sm">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm font-mono">
            {generateConfig()}
          </pre>
        </CardContent>
      </Card>

      <Card className="border-yellow-500/50 bg-yellow-500/5">
        <CardHeader>
          <CardTitle className="text-yellow-600 dark:text-yellow-400">Important Notes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <strong>1. Add to config.yml:</strong> Copy the generated configuration above and add it to your
            BGPalerter config.yml file under the <code className="bg-muted px-1 rounded">reports</code> section.
          </p>
          <p>
            <strong>2. Restart BGPalerter:</strong> After updating config.yml, restart BGPalerter for changes to take effect:
            <code className="bg-muted px-2 py-1 rounded block mt-1 ml-4">
              sudo systemctl restart bgpalerter
            </code>
          </p>
          <p>
            <strong>3. Test Email:</strong> BGPalerter will send test emails on startup. Check your inbox to verify configuration.
          </p>
          <p>
            <strong>4. Email Parsing:</strong> This dashboard can parse BGPalerter email alerts and store them in the
            alert history database. Contact your administrator to set up email forwarding to the dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
