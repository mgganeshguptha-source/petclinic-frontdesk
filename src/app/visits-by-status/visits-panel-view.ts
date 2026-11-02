import { VisitsBridgeState } from '../host-bridge/visits-bridge.types';
import { VISIT_STATUS_LABELS } from '../visits/visit-status';

export interface CountLine {
  label: string;
  count: number;
}

export interface ScheduledVisitLine {
  id: number;
  date: string;
  petText: string;
}

export type VisitsPanelView =
  | { kind: 'waiting' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; counts: CountLine[]; scheduled: ScheduledVisitLine[] };

/** Maps the bridge state to what the panel displays. */
export function toPanelView(state: VisitsBridgeState | null): VisitsPanelView {
  if (!state) {
    return { kind: 'waiting' };
  }
  if (state.loading) {
    return { kind: 'loading' };
  }
  if (state.error) {
    return { kind: 'error', message: state.error };
  }
  const c = state.statusCounts;
  const counts: CountLine[] = [
    { label: VISIT_STATUS_LABELS.SCHEDULED, count: c?.SCHEDULED ?? 0 },
    { label: VISIT_STATUS_LABELS.COMPLETED, count: c?.COMPLETED ?? 0 },
    { label: VISIT_STATUS_LABELS.CANCELLED, count: c?.CANCELLED ?? 0 },
    { label: 'Not set', count: c?.notSet ?? 0 }
  ];
  const scheduled = (state.visits ?? [])
    .filter(v => v.status === 'SCHEDULED')
    .sort((a, b) => {
      const da = a.date || '';
      const db = b.date || '';
      if (da !== db) {
        if (!da) { return 1; }
        if (!db) { return -1; }
        return da < db ? -1 : 1;
      }
      return a.id - b.id;
    })
    .map(v => ({
      id: v.id,
      date: v.date,
      petText: v.petId === undefined || v.petId === null ? 'Pet: not set' : `Pet ${v.petId}`
    }));
  return { kind: 'ready', counts, scheduled };
}
