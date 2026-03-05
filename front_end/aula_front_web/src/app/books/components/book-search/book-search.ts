import { Component, EventEmitter, HostListener, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Book } from '../../../models/book.model';

type HighlightPart = { text: string; match: boolean };

@Component({
  selector: 'app-book-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './book-search.html',
  styleUrl: './book-search.scss',
})
export class BookSearch {
  @Input({ required: true }) books: Book[] = [];
  @Output() filteredChange = new EventEmitter<Book[]>();
  @Output() selectBook = new EventEmitter<Book>(); // opcional: clique em item

  searchQuery = '';
  open = false;

  maxItems = 8;

  // --- derived ---
  get filtered(): Book[] {
    const q = this.normalize(this.searchQuery);
    if (!q) return this.books;
    return this.books.filter(b =>
      this.normalize(b.title).includes(q) || this.normalize(b.author).includes(q)
    );
  }

  get topResults(): Book[] {
    return this.filtered.slice(0, this.maxItems);
  }

  onFocus(): void {
    this.open = true;
    this.filteredChange.emit(this.filtered);
  }

  onSearchChange(value: string): void {
    this.searchQuery = value ?? '';
    this.open = true;
    this.filteredChange.emit(this.filtered);
  }

  clear(): void {
    this.searchQuery = '';
    this.filteredChange.emit(this.books);
    this.open = false;
  }

  onSelect(b: Book): void {
    // Mantém o input com o título (estilo google ao escolher)
    this.searchQuery = b.title;
    this.filteredChange.emit([b]); // ou this.filtered, você decide
    this.selectBook.emit(b);
    this.open = false;
  }

  close(): void {
    this.open = false;
  }

  // Fecha com ESC
  onKeydown(ev: KeyboardEvent): void {
    if (ev.key === 'Escape') this.close();
  }

  // Fecha clicando fora (clique no documento)
  @HostListener('document:click', ['$event'])
  onDocClick(ev: MouseEvent): void {
    const target = ev.target as HTMLElement | null;
    if (!target) return;

    // se clicou dentro do componente, não fecha
    if (target.closest('.gsearch')) return;
    this.close();
  }

  highlight(text: string, query: string): HighlightPart[] {
    const q = (query ?? '').trim();
    if (!q) return [{ text, match: false }];

    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`(${escaped})`, 'ig');

    const parts: HighlightPart[] = [];
    let last = 0;

    for (const m of text.matchAll(re)) {
      const idx = m.index ?? 0;
      if (idx > last) parts.push({ text: text.slice(last, idx), match: false });
      parts.push({ text: text.slice(idx, idx + m[0].length), match: true });
      last = idx + m[0].length;
    }

    if (last < text.length) parts.push({ text: text.slice(last), match: false });
    return parts.length ? parts : [{ text, match: false }];
  }

  private normalize(s: string): string {
    return (s ?? '')
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }
}
