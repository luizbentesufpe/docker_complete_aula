import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BookCardComponent } from './books/book-card/book-card.component';
//import { BookListComponent } from './books/book-list/book-list.component';

@Component({
  selector: 'app-root',
  standalone:  true,  
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class App {
  protected title = 'my_project';
}
