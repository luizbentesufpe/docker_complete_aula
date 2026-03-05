import { EnvironmentInjector, importProvidersFrom, isDevMode, Provider } from '@angular/core';
import { AbstractBookService } from '../services/abstract-book.service';
import { MockBookService } from '../services/mock-book.service';
import { BookService } from '../services/book.service';
import { environment } from '../../../environments/environments';

export const bookServiceProvider: Provider = {
  provide: AbstractBookService,
  useClass: environment.useMockService ? MockBookService : BookService
};