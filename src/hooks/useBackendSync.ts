import { useEffect } from "react";
import { useRequests, useTimeline } from "@/lib/store";
import { getBackendUrl, mapAttackLogToRequest, mapAttackLogsToTimeline } from "@/lib/api";

export function useBackendSync() {
  useEffect(() => {
    const sync = async () => {
      try {
        const url = getBackendUrl();
        const res = await fetch(`${url}/simulator/attacks`);
        if (res.ok) {
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

    // Poll every 3 seconds
    const interval = setInterval(sync, 3000);
    return () => clearInterval(interval);
  }, []);
}
