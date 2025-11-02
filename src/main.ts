import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppShell } from './app/app-shell.component';

bootstrapApplication(AppShell, appConfig).catch((err) => console.error(err));
