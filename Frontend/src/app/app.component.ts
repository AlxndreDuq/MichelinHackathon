import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ApiService } from './services/api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  title = 'Frontend';

  constructor(private apiService: ApiService) { }

  ngOnInit(): void {
    this.apiService.getRoot().subscribe({
      next: (data) => {
        console.log(data);
      }
    });
  }

}
