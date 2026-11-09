import { Component, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Candidato, ErrorApi, ResultadoRegistro } from '../core/modelos';
import { VotacionApi } from '../core/votacion-api';

@Component({
  selector: 'app-formulario-voto',
  imports: [ReactiveFormsModule],
  templateUrl: './formulario-voto.html',
  styleUrl: './formulario-voto.scss',
})
export class FormularioVoto {
  readonly candidatos = input.required<Candidato[]>();

  private readonly api = inject(VotacionApi);
  private readonly fb = inject(NonNullableFormBuilder);

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
