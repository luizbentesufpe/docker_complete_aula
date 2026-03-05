import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Book } from '../models/book.model';
import { AbstractBookService } from './abstract-book.service';
import { environment } from '../../../environments/environments';
import { catchError, map, of, tap } from 'rxjs';
import { Observable } from 'rxjs';
import { OperationResult } from '../models/operation-result.model';

@Injectable()
export class BookService extends AbstractBookService {
  private _books = signal<Book[]>([]);
  books = computed(() => this._books());

  constructor(private http: HttpClient) {
    super();
    this.refresh();
  }


  override refresh(): void {
    this.http.get<Book[]>(`${environment.apiUrl}/books`)
      .subscribe({
        next: (data) => this._books.set(data),
        error: (error) => console.error('Erro ao carregar livros:', error)
      });
  }

  override add(book: Omit<Book, 'id'> | FormData): Observable<OperationResult> {
    let request: Observable<HttpResponse<Book>>;

    if (book instanceof FormData) {
      // ✅ COM FOTO: FormData
      request = this.http.post<Book>(`${environment.apiUrl}/books`, book, {
        observe: 'response'
      });
    } else {
      // ✅ SEM FOTO: JSON normal
      request = this.http.post<Book>(`${environment.apiUrl}/books`, book, {
        observe: 'response'
      });
    }

    return request.pipe(
      tap(response => {
        if (response.body) {
          this._books.update(list => [...list, response.body!]);
        }
      }),
      map(response => ({
        success: true,
        status: response.status
      })),
      catchError((error: HttpErrorResponse) =>
        of({
          success: false,
          error: error.message,
          status: error.status
        })
      )
    );
  }


  override update(book: Book | FormData): Observable<OperationResult> {
    let request: Observable<HttpResponse<Book>>;

    if (book instanceof FormData) {
      // ✅ COM FOTO: FormData
      const id = (book.get('id') as string) || '0';
      request = this.http.put<Book>(`${environment.apiUrl}/books/${id}`, book, {
        observe: 'response'
      });
    } else {
      // ✅ SEM FOTO: JSON normal
      request = this.http.put<Book>(`${environment.apiUrl}/books/${book.id}`, book, {
        observe: 'response'
      });
    }

    // ✅ USA A VARIÁVEL 'request' aqui (não http.put direto)
    return request.pipe(
      tap(response => {
        if (response.body) {
          this._books.update(list =>
            list.map(b => (b.id === response.body!.id ? response.body! : b))
          );
        }
      }),
      map(response => ({
        success: true,
        status: response.status
      })),
      catchError((error: HttpErrorResponse) =>
        of({
          success: false,
          error: error.message,
          status: error.status
        })
      )
    );
  }


  override remove(id: number): Observable<OperationResult> {
    return this.http.delete(`${environment.apiUrl}/books/${id}`, { observe: 'response' }).pipe(
      tap(() => {
        this._books.update(list => list.filter(b => b.id !== id));
      }),
      map(response => ({
        success: true,
        status: response.status
      })),
      catchError((error: HttpErrorResponse) =>
        of({
          success: false,
          error: error.message,
          status: error.status
        })
      )
    );
  }

  override search(query: string): Book[] {
    const q = this.normalize(query);
    if (!q) return this._books();

    return this._books().filter(b => {
      const title = this.normalize(b.title);
      const author = this.normalize(b.author);
      return title.includes(q) || author.includes(q);
    });
  }

  private normalize(s: string): string {
    return (s ?? '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // remove acentos
  }

  override get_by_id(id: number): Observable<OperationResult> {
    return this.http
      .get<Book>(`${environment.apiUrl}/books/${id}`, { observe: 'response' })
      .pipe(
        tap((response) => {
          const book = response.body;
          if (!book) return;

          // opcional: garante que o livro retornado também está no signal local
          this._books.update(list => {
            const exists = list.some(b => b.id === book.id);
            return exists
              ? list.map(b => (b.id === book.id ? book : b))
              : [...list, book];
          });
        }),
        map((response) => ({
          success: true,
          status: response.status,
          data: response.body
        }) as any),
        catchError((error: HttpErrorResponse) =>
          of({
            success: false,
            error: error.message,
            status: error.status
          })
        )
      );
  }


}
