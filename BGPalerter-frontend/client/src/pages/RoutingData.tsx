import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Network, Route, TrendingUp, Globe } from 'lucide-react';
import { toast } from 'sonner';

export default function RoutingData() {
  const [asn, setAsn] = useState('AS58173');
  const [prefix, setPrefix] = useState('');
  const [searchASN, setSearchASN] = useState('AS58173');
  const [searchPrefix, setSearchPrefix] = useState('');

  const { data: prefixes, isLoading: prefixesLoading, refetch: refetchPrefixes } = 
    trpc.ris.getAnnouncedPrefixes.useQuery({ asn: searchASN }, { enabled: !!searchASN });

  const { data: routingStatus, isLoading: statusLoading, refetch: refetchStatus } = 
    trpc.ris.getRoutingStatus.useQuery({ prefix: searchPrefix }, { enabled: !!searchPrefix });

  const { data: asPathInfo, isLoading: pathLoading, refetch: refetchPath } = 
    trpc.ris.getASPathInfo.useQuery({ prefix: searchPrefix }, { enabled: !!searchPrefix });

  const { data: bgpUpdates, isLoading: updatesLoading, refetch: refetchUpdates } = 
    trpc.ris.getBGPUpdates.useQuery({ asn: searchASN, hours: 24 }, { enabled: !!searchASN });

  const handleSearchPrefixes = () => {
    if (!asn.trim()) {
      toast.error('Please enter an ASN');
      return;
    }
    setSearchASN(asn);
    refetchPrefixes();
  };

  const handleSearchRouting = () => {
    if (!prefix.trim()) {
      toast.error('Please enter a prefix');
      return;
    }
    setSearchPrefix(prefix);
    refetchStatus();
    refetchPath();
  };

  return (
    <div className="container py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">RIS Routing Data</h1>
        <p className="text-muted-foreground">
          Real-time BGP routing information from RIPE RIS route collectors
        </p>
      </div>

      <Tabs defaultValue="prefixes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prefixes">
            <Network className="h-4 w-4 mr-2" />
            Announced Prefixes
          </TabsTrigger>
          <TabsTrigger value="routing">
            <Route className="h-4 w-4 mr-2" />
            Routing Status
          </TabsTrigger>
          <TabsTrigger value="updates">
            <TrendingUp className="h-4 w-4 mr-2" />
            BGP Updates
          </TabsTrigger>
        </TabsList>

        {/* Announced Prefixes Tab */}
        <TabsContent value="prefixes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Announced Prefixes</CardTitle>
              <CardDescription>
                View all prefixes announced by an Autonomous System
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter ASN (e.g., AS58173)"
                  value={asn}
                  onChange={(e) => setAsn(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchPrefixes()}
                />
                <Button onClick={handleSearchPrefixes} disabled={prefixesLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {prefixesLoading && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading announced prefixes...
              </CardContent>
            </Card>
          )}

          {prefixes && prefixes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Announced Prefixes for {searchASN}</CardTitle>
                <CardDescription>
                  {prefixes.length} prefix{prefixes.length !== 1 ? 'es' : ''} found
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {prefixes.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-mono">{p.prefix}</span>
                      </div>
                      <Badge variant="secondary">AS{p.asn}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {prefixes && prefixes.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No prefixes found for {searchASN}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Routing Status Tab */}
        <TabsContent value="routing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search Routing Status</CardTitle>
              <CardDescription>
                Check routing status and AS path information for a prefix
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Enter prefix (e.g., 192.0.2.0/24)"
                  value={prefix}
                  onChange={(e) => setPrefix(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearchRouting()}
                />
                <Button onClick={handleSearchRouting} disabled={statusLoading || pathLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {(statusLoading || pathLoading) && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Loading routing information...
              </CardContent>
            </Card>
          )}

          {routingStatus && (
            <Card>
              <CardHeader>
                <CardTitle>Routing Status for {searchPrefix}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Status</div>
                    <Badge variant={routingStatus.announced ? "default" : "destructive"}>
                      {routingStatus.announced ? 'Announced' : 'Not Announced'}
                    </Badge>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Visibility</div>
                    <div className="text-2xl font-bold">{routingStatus.visibility}%</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Origins</div>
                    <div className="text-2xl font-bold">{routingStatus.origins.length}</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Upstreams</div>
                    <div className="text-2xl font-bold">{routingStatus.upstreams.length}</div>
                  </div>
                </div>

                {routingStatus.origins.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Origin ASNs</h4>
                    <div className="flex flex-wrap gap-2">
                      {routingStatus.origins.map((origin, idx) => (
                        <Badge key={idx} variant="outline">{origin}</Badge>
                      ))}
                    </div>
                  </div>
                )}

                {routingStatus.upstreams.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-2">Upstream ASNs</h4>
                    <div className="flex flex-wrap gap-2">
                      {routingStatus.upstreams.slice(0, 10).map((upstream, idx) => (
                        <Badge key={idx} variant="secondary">{upstream}</Badge>
                      ))}
                      {routingStatus.upstreams.length > 10 && (
                        <Badge variant="secondary">+{routingStatus.upstreams.length - 10} more</Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {asPathInfo && asPathInfo.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>AS Path Information</CardTitle>
                <CardDescription>
                  {asPathInfo.length} unique path{asPathInfo.length !== 1 ? 's' : ''} observed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {asPathInfo.map((path, idx) => (
                    <div key={idx} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">
                          Seen by {path.peer_count} peer{path.peer_count !== 1 ? 's' : ''} on {path.collector_count} collector{path.collector_count !== 1 ? 's' : ''}
                        </span>
                        <Badge variant="outline">Origin: {path.origin}</Badge>
                      </div>
                      <div className="font-mono text-sm">
                        {path.as_path.join(' → ')}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* BGP Updates Tab */}
        <TabsContent value="updates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent BGP Updates</CardTitle>
              <CardDescription>
                BGP announcements for {searchASN} in the last 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Input
                  placeholder="Enter ASN (e.g., AS58173)"
                  value={asn}
                  onChange={(e) => setAsn(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (setSearchASN(asn), refetchUpdates())}
                />
                <Button onClick={() => { setSearchASN(asn); refetchUpdates(); }} disabled={updatesLoading}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
              </div>

              {updatesLoading && (
                <div className="py-8 text-center text-muted-foreground">
                  Loading BGP updates...
                </div>
              )}

              {bgpUpdates && bgpUpdates.length > 0 && (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {bgpUpdates.map((update, idx) => (
                    <div key={idx} className="p-3 border rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-sm">{update.prefix}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(update.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="text-muted-foreground">Origin:</span>{' '}
                        <Badge variant="outline" className="ml-1">{update.origin_asn}</Badge>
                      </div>
                      {update.as_path.length > 0 && (
                        <div className="text-xs font-mono text-muted-foreground">
                          Path: {update.as_path.join(' → ')}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        Collector: {update.collector} | Peer: {update.peer_asn}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {bgpUpdates && bgpUpdates.length === 0 && (
                <div className="py-8 text-center text-muted-foreground">
                  No BGP updates found for {searchASN} in the last 24 hours
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
