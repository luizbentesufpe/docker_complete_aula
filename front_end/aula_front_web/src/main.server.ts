import { bootstrapApplication } from '@angular/platform-browser';
import { App } from './app/app.component';
import { config } from './app/config/app.config.server';

const bootstrap = () => bootstrapApplication(App, config);

export default bootstrap;
