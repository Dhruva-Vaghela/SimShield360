import { useEffect, useRef } from "react";
import { useRequests, useTimeline } from "@/lib/store";
import { getBackendUrl, mapAttackLogToRequest, mapAttackLogsToTimeline } from "@/lib/api";

export function useBackendSync() {
  const etagRef = useRef<string | null>(null);

  useEffect(() => {
    const sync = async () => {
      try {
        const url = getBackendUrl();
        const headers: HeadersInit = {};
        if (etagRef.current) {
          headers["If-None-Match"] = etagRef.current;
        }

        const res = await fetch(`${url}/simulator/attacks`, { headers });

        // 304 Not Modified — data hasn't changed, skip store update
        if (res.status === 304) return;

        if (res.ok) {
          // Cache the new ETag for the next request
          const etag = res.headers.get("ETag");
          if (etag) etagRef.current = etag;

          const json = await res.json();
          if (json.success && Array.isArray(json.data)) {
            // Map MongoDB attack logs to client SimRequest structure
            const requests = json.data.map(mapAttackLogToRequest);
            useRequests.setState({ requests });

            // Map MongoDB log list to client TimelineEvent structures
            const events = mapAttackLogsToTimeline(json.data);
            useTimeline.setState({ events });
          }
        }
      } catch (err) {
        console.warn("Backend sync polling failed:", err);
      }
    };

    // Initial sync
    sync();

    // Poll every 10 seconds
    const interval = setInterval(sync, 10000);
    return () => clearInterval(interval);
  }, []);
}
