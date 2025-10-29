import { bootstrapApplication } from '@angular/platform-browser';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { appConfig } from './app/app.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: '<router-outlet />'
})
class AppShell {}

bootstrapApplication(AppShell, appConfig)
  .catch((err) => console.error(err));
