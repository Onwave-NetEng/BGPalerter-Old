import React, { useEffect, useState } from "react";

type BgpEvent = {
  id: number;
  ts: number;
  type: string;
  details: string | null;
};

type Health = {
  status: string;
  dbPath: string;
};

const App: React.FC = () => {
  const [health, setHealth] = useState<Health | null>(null);
  const [events, setEvents] = useState<BgpEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [h, e] = await Promise.all([
          fetch("/health").then((r) => r.json()),
          fetch("/api/bgp-events").then((r) => r.json())
        ]);
        setHealth(h);
        setEvents(e);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      }
    };
    load();
  }, []);

  return (
    <div className="min-h-screen p-6">
      <h1 className="text-2xl font-semibold mb-4">BGPalerter Dashboard</h1>

      {error && (
        <div className="mb-4 text-red-400">
          Error: {error}
        </div>
      )}

      {health && (
        <div className="mb-6">
          <h2 className="text-lg font-medium mb-1">Backend Health</h2>
          <p>Status: {health.status}</p>
          <p>DB path: {health.dbPath}</p>
        </div>
      )}

      <div>
        <h2 className="text-lg font-medium mb-2">Recent BGP Events</h2>
        <table className="min-w-full text-sm bg-slate-800 rounded">
          <thead>
            <tr>
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Timestamp</th>
              <th className="px-3 py-2 text-left">Type</th>
              <th className="px-3 py-2 text-left">Details</th>
            </tr>
          </thead>
          <tbody>
            {events.map((ev) => (
              <tr key={ev.id} className="border-t border-slate-700">
                <td className="px-3 py-1">{ev.id}</td>
                <td className="px-3 py-1">
                  {new Date(ev.ts * 1000).toISOString()}
                </td>
                <td className="px-3 py-1">{ev.type}</td>
                <td className="px-3 py-1 whitespace-pre-wrap">
                  {ev.details}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td className="px-3 py-2" colSpan={4}>
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;