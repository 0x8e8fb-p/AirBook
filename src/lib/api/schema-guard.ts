// ─── Schema Guard ──────────────────────────────────────────────────
// Tracks per-provider health signals so the orchestrator and status
// page can detect scraper drift early. Two signals matter most:
//
//   1. Consecutive empty results — Google flips RPC schemas every
//      few months. The first warning sign is empty arrays where we
//      expect fares. After N in a row we mark the provider degraded.
//
//   2. Sliding error rate — transient network failures are fine; a
//      sustained error rate above the threshold means something is
//      structurally wrong (auth, blocked, parser stale).
//
// Pure in-process state. Reset on process restart, which is fine —
// Vercel cold-starts are frequent enough that we re-learn quickly.
// ──────────────────────────────────────────────────────────────────

export interface SchemaGuardConfig {
  /** Window size for the rolling error-rate calculation. */
  windowSize: number;
  /** Consecutive empty results before flagging drift. */
  emptyDriftThreshold: number;
  /** Error rate (0–1) over the window before flagging unhealthy. */
  errorRateThreshold: number;
}

export const DEFAULT_SCHEMA_GUARD_CONFIG: SchemaGuardConfig = {
  windowSize: 100,
  emptyDriftThreshold: 5,
  errorRateThreshold: 0.3,
};

type EventKind = "ok" | "empty" | "error";

interface ProviderState {
  events: EventKind[];
  consecutiveEmpty: number;
  lastError?: { message: string; at: number };
  totalRequests: number;
}

export interface ProviderHealth {
  provider: string;
  healthy: boolean;
  consecutiveEmpty: number;
  errorRate: number;
  totalRequests: number;
  warnings: string[];
  lastError?: { message: string; at: number };
}

export class SchemaGuard {
  private readonly states = new Map<string, ProviderState>();

  constructor(private readonly config: SchemaGuardConfig = DEFAULT_SCHEMA_GUARD_CONFIG) {}

  private getOrCreate(provider: string): ProviderState {
    let state = this.states.get(provider);
    if (!state) {
      state = { events: [], consecutiveEmpty: 0, totalRequests: 0 };
      this.states.set(provider, state);
    }
    return state;
  }

  private pushEvent(state: ProviderState, kind: EventKind): void {
    state.events.push(kind);
    if (state.events.length > this.config.windowSize) {
      state.events.shift();
    }
    state.totalRequests += 1;
  }

  recordSuccess(provider: string, offerCount: number): void {
    const state = this.getOrCreate(provider);
    if (offerCount > 0) {
      this.pushEvent(state, "ok");
      state.consecutiveEmpty = 0;
    } else {
      this.pushEvent(state, "empty");
      state.consecutiveEmpty += 1;
    }
  }

  recordError(provider: string, message: string): void {
    const state = this.getOrCreate(provider);
    this.pushEvent(state, "error");
    state.consecutiveEmpty = 0;
    state.lastError = { message, at: Date.now() };
  }

  getHealth(provider: string): ProviderHealth {
    const state = this.states.get(provider);
    if (!state || state.events.length === 0) {
      return {
        provider,
        healthy: true,
        consecutiveEmpty: 0,
        errorRate: 0,
        totalRequests: 0,
        warnings: [],
      };
    }

    const errorCount = state.events.filter((e) => e === "error").length;
    const errorRate = errorCount / state.events.length;
    const warnings: string[] = [];

    if (state.consecutiveEmpty >= this.config.emptyDriftThreshold) {
      warnings.push(
        `Possible schema drift: ${state.consecutiveEmpty} consecutive empty responses`,
      );
    }
    if (errorRate >= this.config.errorRateThreshold) {
      warnings.push(
        `High error rate: ${(errorRate * 100).toFixed(0)}% over last ${state.events.length} requests`,
      );
    }

    return {
      provider,
      healthy: warnings.length === 0,
      consecutiveEmpty: state.consecutiveEmpty,
      errorRate,
      totalRequests: state.totalRequests,
      warnings,
      lastError: state.lastError,
    };
  }

  getAllHealth(): ProviderHealth[] {
    return Array.from(this.states.keys()).map((p) => this.getHealth(p));
  }

  reset(provider?: string): void {
    if (provider) {
      this.states.delete(provider);
    } else {
      this.states.clear();
    }
  }
}

// Shared instance — providers and the orchestrator both write to it
// so the status page sees a single coherent view.
export const sharedSchemaGuard = new SchemaGuard();
