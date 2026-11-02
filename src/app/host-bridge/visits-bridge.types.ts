import { VisitStatus } from '../visits/visit-status';

/** Contract copied from petclinic-angular-demo (store/visits/visits-bridge.ts and visits.selectors.ts). */
export const VISITS_BRIDGE_EVENT = 'petclinic-host:visits';

export type VisitStatusCounts = Record<VisitStatus, number> & { notSet: number };

/** Visit fields exposed to other front ends (no description). */
export interface VisitsBridgeVisit {
  id: number;
  date: string;
  status: VisitStatus | null | undefined;
  petId: number | undefined;
}

export interface VisitsBridgeState {
  visits: VisitsBridgeVisit[];
  statusCounts: VisitStatusCounts;
  loading: boolean;
  error: string | null;
}
