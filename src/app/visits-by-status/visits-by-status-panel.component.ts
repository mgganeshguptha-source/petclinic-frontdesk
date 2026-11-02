import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { map } from 'rxjs/operators';
import { HostBridgeService } from '../host-bridge/host-bridge.service';
import { toPanelView } from './visits-panel-view';

@Component({
  selector: 'app-visits-by-status-panel',
  imports: [AsyncPipe],
  templateUrl: './visits-by-status-panel.component.html',
  styleUrl: './visits-by-status-panel.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class VisitsByStatusPanelComponent {
  private readonly bridge = inject(HostBridgeService);

  readonly view$ = this.bridge.visits$.pipe(map(toPanelView));
}
