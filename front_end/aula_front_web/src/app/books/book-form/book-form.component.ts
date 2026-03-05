import { Component, inject, NgZone, ChangeDetectorRef } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { firstValueFrom } from 'rxjs';

import { AbstractBookService } from '../../services/abstract-book.service';
import { environment } from '../../../../environments/environments';
import { Book } from '../../models/book.model';
import { FeedbackService } from '../../components/Feedback/feedback.service';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';


@Component({
  selector: 'app-book-form',
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule
  ],
  standalone: true,
  templateUrl: './book-form.component.html',
  styleUrl: './book-form.component.scss'
})
export class BookFormComponent {
  form = new FormGroup({
    id: new FormControl<number | null>(null),
    title: new FormControl('', { nonNullable: true }),
    author: new FormControl('', { nonNullable: true }),
    year: new FormControl(2020, { nonNullable: true }),
  });

  photoPreview: string | null = null;
  isDragOver = false;

  private zone = inject(NgZone);
  private cdr = inject(ChangeDetectorRef);

  progressIndeterminate = false; // fallback quando lengthComputable = false

  // limite simples (mock): 3MB
  maxPhotoMB = 3;
  private readonly maxBytes = this.maxPhotoMB * 1024 * 1024;

  private service = inject(AbstractBookService);
  private router = inject(Router);
  private feedback = inject(FeedbackService);
  private route = inject(ActivatedRoute);
  private selectedFile: File | null = null; // ← NOVO: guarda o arquivo original
  uploading = false;     // mostra loader/progresso
  uploadProgress = 0;    // 0..100
  private id: number | null = null;


  async ngOnInit(): Promise<void> {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (!idParam) return; // modo "novo"

    this.id = Number(idParam);
    if (!Number.isFinite(this.id)) return;

    // ✅ você precisa ter um método no service para buscar por id
    // exemplo: this.service.getById(id)
    const result = await firstValueFrom(this.service.get_by_id(this.id));

    if (result.success) {
      const book = (result as any).data as Book;

      this.form.patchValue(book);
      // ✅ PRÉVIA DA FOTO (quando estiver editando)
      if (book.photo) {
        this.photoPreview = book.photo;
        // Não setamos selectedFile aqui porque é só URL/base64 já salva.
        // selectedFile só existe quando o usuário escolher um novo arquivo.
      } else {
        this.photoPreview = null;
      }

      // (opcional) garantir que o template atualize imediatamente
      this.cdr.markForCheck();
      this.cdr.detectChanges();

      // se sua API devolve URL/bytes da foto, você pode setar preview aqui
      // this.photoPreview = book.photoUrl ?? null;
    } else {
      this.feedback.error(`Não foi possível carregar o livro (${result.status})`);
      this.router.navigate(['/books']);
    }
  }


  async onSubmit(): Promise<void> {
    if (this.id !== null) {
      await this.update_book();
    } else {
      await this.add_book();
    } 
  }

  async add_book(){
    try {
      let payload: FormData | Omit<Book, 'id'>;

      if (this.selectedFile) {
        // ✅ COM FOTO
        const formData = new FormData();
        formData.append('title', this.form.value.title!);
        formData.append('author', this.form.value.author!);
        formData.append('year', this.form.value.year!.toString());
        formData.append('photo', this.selectedFile);
        payload = formData;
      } else {
        // ✅ SEM FOTO
        payload = this.form.getRawValue() as Omit<Book, 'id'>;
      }

      const result = await firstValueFrom(this.service.add(payload as any));

      if (result.success) {
        this.feedback.success('Livro adicionado!');
        this.router.navigate(['/']);
      } else {
        this.feedback.error(`Erro ${result.status}: ${result.error}`);
      }
    } catch (error: any) {
      this.feedback.error('Erro inesperado');
    }
  }

  async update_book(){
    try {
      let payload: FormData | Book;

      if (this.selectedFile) {
        // ✅ COM FOTO
        const formData = new FormData();
        formData.append('id', String(this.id));
        formData.append('title', this.form.value.title!);
        formData.append('author', this.form.value.author!);
        formData.append('year', this.form.value.year!.toString());
        formData.append('photo', this.selectedFile);
        payload = formData;
      } else {
        // ✅ SEM FOTO
        payload = this.form.getRawValue() as Book;
      }

      const result = await firstValueFrom(this.service.update(payload as any));

      if (result.success) {
        this.feedback.success('Livro atualizado!');
        this.router.navigate(['/']);
      } else {
        this.feedback.error(`Erro ${result.status}: ${result.error}`);
      }
    } catch (error: any) {
      this.feedback.error('Erro inesperado');
    }
  }
  onCancel(): void {
    this.router.navigate(['/books']);
  }

  // -------------------
  // Drag & drop handlers
  // -------------------
  onDragOver(ev: DragEvent): void {
    ev.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(ev: DragEvent): void {
    ev.preventDefault();
    this.isDragOver = false;
  }

  onDrop(ev: DragEvent): void {
    ev.preventDefault();
    this.isDragOver = false;

    const file = ev.dataTransfer?.files?.[0];
    if (file) this.handleImageFile(file);
  }

  onFileSelected(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) return;

    this.handleImageFile(file);

    // permite selecionar o MESMO arquivo novamente
    input.value = '';
  }

  clearPhoto(): void {
    this.selectedFile = null;
    this.photoPreview = null;
    this.uploading = false;
    this.uploadProgress = 0;
  }


  private handleImageFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      this.feedback.error('Selecione um arquivo de imagem (PNG/JPG/WebP).');
      return;
    }

    if (file.size > this.maxBytes) {
      this.feedback.error(`Imagem muito grande. Máximo: ${this.maxPhotoMB}MB.`);
      return;
    }

    this.selectedFile = file;
    this.photoPreview = null;

    this.uploading = true;
    this.uploadProgress = 0;
    this.progressIndeterminate = true;

    // força CD imediato ao entrar no modo "carregando"
    this.cdr.markForCheck();
    this.cdr.detectChanges();

    const reader = new FileReader();

    reader.onprogress = (ev) => {
      if (ev.lengthComputable && ev.total > 0) {
        this.progressIndeterminate = false;
        this.uploadProgress = Math.round((ev.loaded / ev.total) * 100);
      }
      this.cdr.markForCheck();
      this.cdr.detectChanges();
    };

    reader.onload = () => {
      this.photoPreview = String(reader.result ?? '');
      this.uploadProgress = 100;
      this.progressIndeterminate = false;
      this.uploading = false;

      this.cdr.markForCheck();
      this.cdr.detectChanges();
    };

    reader.onerror = () => {
      this.uploading = false;
      this.uploadProgress = 0;
      this.progressIndeterminate = false;
      this.selectedFile = null;
      this.photoPreview = null;
      this.feedback.error('Falha ao ler a imagem. Tente novamente.');

      this.cdr.markForCheck();
      this.cdr.detectChanges();
    };

    reader.readAsDataURL(file);
  }


}
