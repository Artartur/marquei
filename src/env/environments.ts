import { InjectionToken, makeStateKey } from '@angular/core';

export const API_URL = new InjectionToken<string>('API_URL');
export const API_URL_STATE_KEY = makeStateKey<string>('API_URL');
