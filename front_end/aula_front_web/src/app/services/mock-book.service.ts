import { Injectable, signal, computed } from '@angular/core';
import { AbstractBookService } from './abstract-book.service';
import { Book } from '../models/book.model';
import { Signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { OperationResult } from '../models/operation-result.model';

@Injectable()
export class MockBookService extends AbstractBookService {
  private _books = signal<Book[]>([
    { id: 1, title: 'Clean Code', author: 'Robert C. Martin', year: 2008, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3c8ZDI6Q3QMi7XyklpH_r6FX4AdZJpjaorw&s" },
    { id: 2, title: 'Design Patterns', author: 'GoF', year: 1994, photo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQv-Cz3OCwt-2eSg4fa08_xIINdciM307iESQ&s" },
    { id: 3, title: 'Refactoring', author: 'Martin Fowler', year: 2018, photo: "https://jblitoral.com.br/wp-content/uploads/2024/02/foto-doguinho-1.jpeg?v=02.02.12.51.48" }
  ]);

  books: Signal<Book[]> = computed(() => this._books());

  override refresh(): void {
    // Nada a fazer no mock
  }

  override add(book: Omit<Book, 'id'>): Observable<OperationResult> {
    try {
      const currentBooks = this._books();
      const maxId = currentBooks.length > 0 ? Math.max(...currentBooks.map(b => b.id)) : 0;

      const newBook: Book = { ...book, id: maxId + 1 };
      this._books.update(list => [...list, newBook]);
      return of({ success: true, status: 201 });
    } catch (error) {
      return of({ success: false, error, status: 500 });
    }
  }

  override update(book: Book): Observable<OperationResult> {
    try {
      this._books.update(list =>
        list.map(b => (b.id === book.id ? book : b))
      );
      return of({ success: true, status: 200 });
    } catch (error) {
      return of({ success: false, error, status: 500 });
    }
  }

  override remove(id: number): Observable<OperationResult> {
    try {
      this._books.update(list => list.filter(b => b.id !== id));
      return of({ success: true, status: 200 });
    } catch (error) {
      return of({ success: false, error, status: 500 });
    }
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
    try {
      const book = this._books().find(b => b.id === id);

      if (!book) {
        return of({
          success: false,
          status: 404,
          error: `Livro com id=${id} não encontrado.`
        });
      }

      return of({
        success: true,
        status: 200,
        data: book
      } as any);
    } catch (error) {
      return of({ success: false, error, status: 500 });
    }
  }
}
