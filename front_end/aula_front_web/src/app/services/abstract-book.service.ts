import { Signal } from '@angular/core';
import { Observable } from 'rxjs';
import { Book } from '../models/book.model';
import { OperationResult } from '../models/operation-result.model';

export abstract class AbstractBookService {
  abstract books: Signal<Book[]>;
  abstract refresh(): void;
  abstract add(book: Omit<Book, 'id'>): Observable<OperationResult>;
  abstract get_by_id(id: number): Observable<OperationResult>;
  abstract update(book: Book): Observable<OperationResult>;
  abstract remove(id: number): Observable<OperationResult>;
  abstract search(query: string): Book[];
}
