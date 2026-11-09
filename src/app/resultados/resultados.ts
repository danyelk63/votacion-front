import { Component, input } from '@angular/core';
import { Resultados } from '../core/modelos';

@Component({
  selector: 'app-resultados',
  templateUrl: './resultados.html',
  styleUrl: './resultados.scss',
})
export class ResultadosComponent {
  readonly resultados = input<Resultados | null>(null);
}
