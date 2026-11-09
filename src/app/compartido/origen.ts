import { Component, computed, input } from '@angular/core';
import { Evento } from '../core/modelos';

export const NOMBRE_ROL: Record<string, string> = {
  LIDER: 'Líder',
  SEGUIDOR: 'Seguidor',
  CANDIDATO: 'Candidato',
  GATEWAY: 'Gateway',
};

/** Muestra quién generó un evento: "Nodo 2 · Líder · t3" o "Gateway". */
@Component({
  selector: 'app-origen',
  template: `
    <span class="origen" [class]="'rol-' + evento().rol.toLowerCase()">
      @if (evento().nodoId !== null) {
        <b>Nodo {{ evento().nodoId }}</b>
        <span class="pill">{{ rol() }}</span>
        @if (mostrarTermino()) {
          <small>t{{ evento().termino }}</small>
        }
      } @else {
        <b>Gateway</b>
        <span class="pill">HTTP · RMI · WS</span>
      }
    </span>
  `,
  styles: `
    .origen {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      white-space: nowrap;
    }
    .pill {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      padding: 0.05rem 0.45rem;
      border-radius: 999px;
      color: #fff;
      background: var(--texto-suave);
    }
    small {
      color: var(--texto-suave);
    }
    .rol-lider .pill {
      background: var(--exito);
    }
    .rol-seguidor .pill {
      background: var(--primario);
    }
    .rol-candidato .pill {
      background: var(--advertencia);
    }
    .rol-gateway .pill {
      background: var(--gateway);
    }
  `,
})
export class Origen {
  readonly evento = input.required<Evento>();
  readonly mostrarTermino = input(true);
  protected readonly rol = computed(() => NOMBRE_ROL[this.evento().rol] ?? this.evento().rol);
}
