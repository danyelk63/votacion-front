import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Candidato, ListadoVotos } from '../core/modelos';

@Component({
  selector: 'app-lista-votos',
  imports: [DatePipe],
  templateUrl: './lista-votos.html',
  styleUrl: './lista-votos.scss',
})
export class ListaVotos {
  readonly listado = input<ListadoVotos | null>(null);
  readonly candidatos = input<Candidato[]>([]);

  /** Los más recientes primero. */
  protected readonly votos = computed(() => [...(this.listado()?.votos ?? [])].reverse());

  protected nombreCandidato(id: string): string {
    return this.candidatos().find((c) => c.id === id)?.nombre ?? id;
  }
}
