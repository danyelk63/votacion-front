import { Component, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MessageModule } from 'primeng/message';
import { RadioButtonModule } from 'primeng/radiobutton';
import { Candidato, ErrorApi, ResultadoRegistro } from '../../core/modelos';
import { VotacionApi } from '../../core/votacion-api';

@Component({
  selector: 'app-formulario-voto',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    ButtonModule,
    CardModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MessageModule,
    RadioButtonModule,
  ],
  templateUrl: './formulario-voto.html',
  styleUrl: './formulario-voto.scss',
})
export class FormularioVoto {
  readonly candidatos = input.required<Candidato[]>();

  private readonly api = inject(VotacionApi);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly mensajes = inject(MessageService);

  protected readonly form = this.fb.group({
    nombre: ['', [Validators.required, Validators.pattern(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ' ]{3,100}$/)]],
    cedula: ['', [Validators.required, Validators.pattern(/^\d{6,10}$/)]],
    candidato: ['', Validators.required],
  });

  protected readonly enviando = signal(false);
  protected readonly exito = signal<ResultadoRegistro | null>(null);
  protected readonly error = signal<ErrorApi | null>(null);

  protected invalido(campo: 'nombre' | 'cedula' | 'candidato'): boolean {
    const c = this.form.controls[campo];
    return c.invalid && (c.touched || c.dirty);
  }

  protected enviar(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.enviando()) return;

    this.enviando.set(true);
    this.exito.set(null);
    this.error.set(null);

    this.api.votar(this.form.getRawValue()).subscribe({
      next: (r) => {
        this.exito.set(r);
        this.form.reset();
        this.enviando.set(false);
        this.mensajes.add({
          severity: 'success',
          summary: 'Voto registrado',
          detail: `Confirmado por el nodo ${r.lider} (líder) en ${r.duracionMs} ms`,
          life: 4000,
        });
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(
          e.error?.error ? (e.error as ErrorApi) : { error: 'No se pudo contactar al gateway. ¿Está encendido?' },
        );
        this.enviando.set(false);
      },
    });
  }
}
