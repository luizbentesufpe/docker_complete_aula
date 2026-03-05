import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { BookListComponent } from '../books/book-list/book-list.component';
import { AbstractBookService } from '../services/abstract-book.service';
import { Book } from '../models/book.model';
import { BookSearch } from '../books/components/book-search/book-search';


@Component({
  selector: 'app-home.component',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, BookListComponent, BookSearch],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})


export class HomeComponent {
  private service = inject(AbstractBookService);

  books = this.service.books;           // Signal<Book[]>
  filteredBooks: Book[] = [];

  ngOnInit(): void {
    this.filteredBooks = this.books();  // inicial
  }

  onFilteredChange(list: Book[]): void {
    this.filteredBooks = list;
  }
}
