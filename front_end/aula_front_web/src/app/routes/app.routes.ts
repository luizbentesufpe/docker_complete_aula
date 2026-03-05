/*import { Routes } from '@angular/router';

export const routes: Routes = [];
*/

import { Routes } from '@angular/router';
import { BookListComponent } from '../books/book-list/book-list.component';
//import { StatsComponent } from './components/stats.components';
import { BookFormComponent } from '../books/book-form/book-form.component';
import { HomeComponent } from '../home/home.component';

export const routes: Routes = [
    {path: '', component: HomeComponent, pathMatch: 'full'},
    {path: 'books', component: BookListComponent},
    {path: 'add-book', component: BookFormComponent},
    {path: 'edit-book/:id', component: BookFormComponent},
];

