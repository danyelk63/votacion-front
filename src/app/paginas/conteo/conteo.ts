import { Component, computed, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CardModule } from 'primeng/card';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { sondear } from '../../core/sondeo';
import { VotacionApi } from '../../core/votacion-api';
import { NOMBRE_ROL, SEVERIDAD_ROL } from '../../compartido/origen';

/** Vista: conteo de votos en vivo, cómo está distribuido y cómo lo ve cada nodo. */
@Component({
  selector: 'app-conteo',
  imports: [CardModule, TableModule, TagModule, TooltipModule, IconFieldModule, InputIconModule, InputTextModule, DatePipe],
  templateUrl: './conteo.html',
  styleUrl: './conteo.scss',
})
export class Conteo {
  private readonly api = inject(VotacionApi);
  protected readonly resultados = sondear(() => this.api.resultados(), 1000);
  protected readonly votos = sondear(() => this.api.votos(), 1500);
  protected readonly cluster = sondear(() => this.api.cluster(), 1000);

  protected readonly nombreRol = NOMBRE_ROL;
  protected readonly severidadRol = SEVERIDAD_ROL;

  protected readonly lista = computed(() => [...(this.votos.valor()?.votos ?? [])].reverse());

  protected readonly lider = computed(() => {
    const total = this.resultados.valor()?.total ?? 0;
    const cands = this.resultados.valor()?.candidatos ?? [];
    if (!total) return null;
    const max = Math.max(...cands.map((c) => c.votos));
    const primeros = cands.filter((c) => c.votos === max);
    return primeros.length === 1 ? primeros[0] : null;
  });

  /** Cuántos votos tiene aplicados cada nodo frente al total confirmado. */
  protected readonly porNodo = computed(() => {
    const total = this.resultados.valor()?.total ?? 0;
    return (this.cluster.valor()?.nodos ?? []).map((n) => ({
      ...n,
      alDia: n.disponible && !n.pausado && n.totalVotos === total,
    }));
  });

  protected nombreCandidato(id: string): string {
    return this.resultados.valor()?.candidatos.find((c) => c.id === id)?.nombre ?? id;
  }
}
