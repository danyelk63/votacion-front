import { Component, computed, input } from '@angular/core';
import { TagModule } from 'primeng/tag';
import { Evento } from '../core/modelos';

export const NOMBRE_ROL: Record<string, string> = {
  LIDER: 'Líder',
  SEGUIDOR: 'Seguidor',
  CANDIDATO: 'Candidato',
  GATEWAY: 'Gateway',
};

type Severidad = 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

export const SEVERIDAD_ROL: Record<string, Severidad> = {
  LIDER: 'success',
  SEGUIDOR: 'info',
  CANDIDATO: 'warn',
  GATEWAY: 'contrast',
};

export const ICONO_ROL: Record<string, string> = {
  LIDER: 'pi pi-crown',
  SEGUIDOR: 'pi pi-user',
  CANDIDATO: 'pi pi-megaphone',
  GATEWAY: 'pi pi-arrow-right-arrow-left',
};

@Component({
  selector: 'app-origen',
  imports: [TagModule],
  template: `
    <span class="origen">
      <b>{{ evento().nodoId !== null ? 'Nodo ' + evento().nodoId : 'Gateway' }}</b>
      <p-tag [value]="rol()" [severity]="severidad()" [icon]="icono()" [rounded]="true" class="tag-rol" />
      @if (mostrarTermino() && evento().termino !== null) {
        <small>t{{ evento().termino }}</small>
      }
    </span>
  `,
  styles: `
    .origen {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      white-space: nowrap;
    }
    small {
      color: var(--p-text-muted-color);
      font-variant-numeric: tabular-nums;
    }
    :host ::ng-deep .tag-rol {
      font-size: 0.7rem;
      padding: 0.1rem 0.5rem;
    }
  `,
})
export class Origen {
  readonly evento = input.required<Evento>();
  readonly mostrarTermino = input(true);
  protected readonly rol = computed(() => NOMBRE_ROL[this.evento().rol] ?? this.evento().rol);
  protected readonly severidad = computed(() => SEVERIDAD_ROL[this.evento().rol] ?? 'secondary');
  protected readonly icono = computed(() => ICONO_ROL[this.evento().rol] ?? '');
}
