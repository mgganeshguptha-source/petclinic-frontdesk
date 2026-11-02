import { Component } from '@angular/core';
import { VisitsByStatusPanelComponent } from './visits-by-status/visits-by-status-panel.component';

@Component({
  selector: 'app-root',
  imports: [VisitsByStatusPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'petclinic-frontdesk';
}
