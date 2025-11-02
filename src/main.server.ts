import { bootstrapApplication, BootstrapContext } from '@angular/platform-browser';
import { AppShell } from './app/app-shell.component';
import { config } from './app/app.config.server';

const bootstrap = (context: BootstrapContext) =>
  bootstrapApplication(AppShell, config, context);

export default bootstrap;
