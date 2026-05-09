import {
  inject,
  LOCALE_ID,
  NgModule,
  PLATFORM_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  TransferState,
} from '@angular/core';
import { isPlatformBrowser, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserModule, provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing-module';
import { AppComponent } from './app.component';
import { ToastComponent } from './shared/toast/toast.component';
import { authInterceptor } from './interceptors/auth.interceptors';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { API_URL, API_URL_STATE_KEY } from '../env/environments';

registerLocaleData(localePt);

@NgModule({
  declarations: [AppComponent, ToastComponent],
  imports: [BrowserModule, CommonModule, AppRoutingModule, ReactiveFormsModule],
  providers: [
    {
      provide: API_URL,
      useFactory: (transferState: TransferState) =>
        transferState.get(API_URL_STATE_KEY, 'http://localhost:3000'),
      deps: [TransferState],
    },
    provideAppInitializer(() => {
      const authService = inject(AuthService);
      const platformId = inject(PLATFORM_ID);
      if (!isPlatformBrowser(platformId)) return of(null);
      return authService.initSession();
    }),
    provideBrowserGlobalErrorListeners(),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([authInterceptor])),
    {
      provide: LOCALE_ID,
      useValue: 'pt-BR',
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
