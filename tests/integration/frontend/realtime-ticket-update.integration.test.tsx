import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";

vi.mock("../../../nmmcqueue-frontend/src/features/monitoring/hooks/use-announcement-queue", () => ({
  useAnnouncementQueue: vi.fn(() => ({
    currentAnnouncement: null,
    enqueueAnnouncement: vi.fn(),
  })),
}));

import { useWindowMonitor } from "../../../nmmcqueue-frontend/src/features/monitoring/hooks/use-window-monitor";

type MockEventSourceInstance = {
  onmessage: ((event: MessageEvent<string>) => void) | null;
  close: () => void;
};

const instances: MockEventSourceInstance[] = [];

class MockEventSource {
  onmessage: ((event: MessageEvent<string>) => void) | null = null;
  close = vi.fn();

  constructor(_url: string, _opts?: EventSourceInit) {
    instances.push(this);
  }
}

describe("Realtime ticket update integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    instances.length = 0;

    vi.stubGlobal("EventSource", MockEventSource as unknown as typeof EventSource);
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        json: async () => ({
          success: true,
          data: {
            active: [
              {
                stationNo: 1,
                windowName: "Window 1",
                displayTicket: "P-100",
                calledAt: null,
              },
            ],
            upcoming: ["P-101"],
          },
        }),
      })) as unknown as typeof fetch
    );
  });

  it("updates queue state when monitor-upsert SSE event arrives", async () => {
    const { result } = renderHook(() => useWindowMonitor());

    await waitFor(() => {
      expect(result.current.windows[0]?.displayTicket).toBe("P-100");
    });

    const source = instances[0];
    expect(source).toBeDefined();

    source.onmessage?.(
      {
        data: JSON.stringify({
          type: "monitor-upsert",
          payload: {
            window: {
              stationNo: 1,
              windowName: "Window 1",
              displayTicket: "P-102",
              calledAt: null,
            },
          },
        }),
      } as MessageEvent<string>
    );

    await waitFor(() => {
      expect(result.current.windows[0]?.displayTicket).toBe("P-102");
    });
  });
});
