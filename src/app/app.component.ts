import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './modules/header/header/header.component';
import { FooterComponent } from './modules/footer/footer/footer.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet , HeaderComponent , FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {}
