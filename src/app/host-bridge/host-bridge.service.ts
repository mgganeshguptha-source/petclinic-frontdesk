import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { VISITS_BRIDGE_EVENT, VisitsBridgeState } from './visits-bridge.types';

interface PetclinicHostWindow {
  petclinicHost?: { visits?: VisitsBridgeState };
}

/**
 * Exposes the host app's visits state (window.petclinicHost.visits plus bridge events).
 * Emits null until the host has published. Never calls the API.
 */
@Injectable({ providedIn: 'root' })
export class HostBridgeService implements OnDestroy {
  private readonly stateSubject = new BehaviorSubject<VisitsBridgeState | null>(
    (window as unknown as PetclinicHostWindow).petclinicHost?.visits ?? null
  );

  readonly visits$: Observable<VisitsBridgeState | null> = this.stateSubject.asObservable();

  private readonly listener = (event: Event): void => {
    this.stateSubject.next((event as CustomEvent<VisitsBridgeState>).detail ?? null);
  };

  constructor() {
    window.addEventListener(VISITS_BRIDGE_EVENT, this.listener);
  }

  ngOnDestroy(): void {
    window.removeEventListener(VISITS_BRIDGE_EVENT, this.listener);
    this.stateSubject.complete();
  }
}
