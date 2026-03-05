import { Component, Input  } from '@angular/core';
import booksJson from '../books.json';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-book-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './book-card.component.html',
  styleUrl: './book-card.component.scss'
})
export class BookCardComponent {
  @Input() book!: { title: string; author: string; year: number, photo?: string };

  //Constructor ⇒ somente inicialização simples (sem DOM)
  //constructor(){console.log('constructor initialized - id',this.book?.id);}

  //ngOnInit ⇒ quando o template já recebeu o @Input
  // ngOnInit() {console.log('ngOnInit initialized - titulo', this.book?.titulo);

  //ngOnDestroy ⇒ limpeza
  // ngOnDestroy() {console.log('ngOnDestroy removendo - titulo', this.book?.titulo);}
}
