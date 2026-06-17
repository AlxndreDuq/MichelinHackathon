import { Component } from '@angular/core';
import { PhoneFrameComponent } from './components/phone-frame/phone-frame.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [PhoneFrameComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}
