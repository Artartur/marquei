import { NgModule, TransferState } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { AppComponent } from './app.component';
import { AppModule } from './app-module';
import { serverRoutes } from './app.routes.server';
import { API_URL, API_URL_STATE_KEY } from '../env/environments';

@NgModule({
  imports: [AppModule],
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    {
      provide: API_URL,
      useFactory: (transferState: TransferState) => {
        const url = process.env['API_URL'] || 'http://localhost:3000';
        transferState.set(API_URL_STATE_KEY, url);
        return url;
      },
      deps: [TransferState],
    },
  ],
  bootstrap: [AppComponent],
})
export class AppServerModule {}
