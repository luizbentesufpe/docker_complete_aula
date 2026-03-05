import { Component, inject, signal, computed} from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookCardComponent } from '../book-card/book-card.component';
import { AbstractBookService } from '../../services/abstract-book.service';
import { firstValueFrom } from 'rxjs';
import { FeedbackService } from '../../components/Feedback/feedback.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-book-list',
  standalone:  true,
  imports:     [CommonModule, BookCardComponent],
  templateUrl: './book-list.component.html',
  styleUrls: ['./book-list.component.scss']
})
export class BookListComponent {
  /*books = [
    { id: 1, title: 'Clean Code',      author: 'Robert C. Martin', year: 2008 },
    { id: 2, title: 'Design Patterns', author: 'GoF',              year: 1994 },
    { id: 3, title: 'Refactoring',     author: 'Martin Fowler',    year: 2018 }
  ];*/

  private service = inject(AbstractBookService);
  private router = inject(Router);
  books = this.service.books;
  trackById = (_: number, item: any) => item.id;
  private feedback = inject(FeedbackService);
 
  async remove(id: number): Promise<void> {
    //this.books = this.books.filter(b => b.id !== id);
    const result = await firstValueFrom(this.service.remove(id));

    if (result.success) {
      this.feedback.success(`Removido com sucesso`); // ou pode exibir status também
    } else {
      this.feedback.error(`Erro ${result.status}: ${result.error}`);
    }
  }

  edit(id: number) {
    this.router.navigate(['edit-book', id]);
  }
}
