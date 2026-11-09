import { Component, computed, effect, inject, input, linkedSignal, signal, untracked } from '@angular/core';
import { Router } from '@angular/router';
import { EventosService } from '../../core/eventos';
import { Archivos, Evento } from '../../core/modelos';
import { VotacionApi } from '../../core/votacion-api';
import { HoraPipe } from '../../compartido/hora';
import { NOMBRE_ROL, Origen } from '../../compartido/origen';

interface Fase {
  titulo: string;
  descripcion: string;
  etapas: string[];
}

/** Las fases por las que pasa un voto, de la llegada al archivo. */
const FASES: Fase[] = [
  {
    titulo: '1. Llega al servidor',
    descripcion: 'El navegador envía POST /api/votos (HTTP/JSON) al gateway, que le asigna un id de traza.',
    etapas: ['RECIBIDO_HTTP'],
  },
  {
    titulo: '2. Viaja por RMI',
    descripcion:
      'El gateway invoca registrarVoto() en un nodo. Si ese nodo no es el líder, reenvía la invocación al líder, también por RMI.',
    etapas: ['LLAMADA_RMI', 'FAILOVER', 'RECIBIDO_RMI', 'REENVIO_LIDER', 'SIN_LIDER', 'LIDER_INACCESIBLE'],
  },
  {
    titulo: '3. Se procesa en el líder',
    descripcion: 'Valida los datos, verifica que la cédula no haya votado y agrega el voto al log de Raft.',
    etapas: ['VALIDACION', 'VERIFICACION', 'ANEXADO_LOG', 'RECHAZADO'],
  },
  {
    titulo: '4. Se replica',
    descripcion: 'El líder envía la entrada a cada seguidor (anexarEntradas por RMI) y estos confirman que la tienen.',
    etapas: ['ENVIO', 'ENTRADA_RECIBIDA', 'ACK'],
  },
  {
    titulo: '5. Consenso por mayoría',
    descripcion: 'Cuando la mayoría de nodos tiene la entrada, queda CONFIRMADA: ya no se puede perder.',
    etapas: ['CONFIRMADO'],
  },
  {
    titulo: '6. Se aplica en memoria',
    descripcion: 'Cada nodo suma el voto a su registro electoral en memoria, en el mismo orden.',
    etapas: ['APLICADO'],
  },
  {
    titulo: '7. Se guarda en archivo',
    descripcion: 'Cada nodo escribe una línea en su archivo de texto datos/nodo-N/votos.txt.',
    etapas: ['GUARDADO_ARCHIVO', 'ERROR_ARCHIVO'],
  },
  {
    titulo: '8. Respuesta al usuario',
    descripcion: 'El líder responde la llamada RMI, el gateway responde HTTP y registra la acción en el log del usuario.',
    etapas: ['RESPUESTA', 'RESPUESTA_HTTP', 'VOTAR'],
  },
];

const ETAPAS_ERROR = new Set(['RECHAZADO', 'SIN_LIDER', 'LIDER_INACCESIBLE', 'ERROR_ARCHIVO']);

interface ResumenTraza {
  traza: string;
  hora: string;
  nombre: string;
  cedula: string;
  estado: string;
}

/**
 * Vista 3: qué hace el servidor con los datos de un voto. Reconstruye, a partir
 * de los eventos en tiempo real, el recorrido completo de un voto (identificado
 * por su "traza") por el gateway y todos los nodos.
 */
@Component({
  selector: 'app-procesamiento',
  imports: [HoraPipe, Origen],
  templateUrl: './procesamiento.html',
  styleUrl: './procesamiento.scss',
})
export class Procesamiento {
  /** ?traza=xxxx en la URL */
  readonly traza = input<string>();

  private readonly servicio = inject(EventosService);
  private readonly api = inject(VotacionApi);
  private readonly router = inject(Router);

  protected readonly fases = FASES;

  /** Resumen de todos los votos vistos (uno por traza), el más reciente primero. */
  protected readonly trazas = computed<ResumenTraza[]>(() => {
    const mapa = new Map<string, ResumenTraza>();
    for (const e of this.servicio.eventos()) {
      if (!e.traza || e.traza.startsWith('t-')) continue;
      if (e.etapa === 'RECIBIDO_HTTP') {
        mapa.set(e.traza, {
          traza: e.traza,
          hora: e.hora,
          nombre: e.datos['nombre'] ?? '',
          cedula: e.datos['cedula'] ?? '',
          estado: 'EN PROCESO',
        });
      } else if (e.etapa === 'VOTAR' && mapa.has(e.traza)) {
        mapa.get(e.traza)!.estado = e.datos['resultado'] ?? 'FINALIZADO';
      }
    }
    return [...mapa.values()].reverse();
  });

  protected readonly seleccion = linkedSignal<string | undefined>(() => this.traza() ?? this.trazas()[0]?.traza);

  protected readonly eventos = computed(() => {
    const t = this.seleccion();
    return t ? this.servicio.eventos().filter((e) => e.traza === t) : [];
  });

  protected readonly resumen = computed(() => this.trazas().find((t) => t.traza === this.seleccion()));

  private readonly inicio = computed(() => (this.eventos()[0] ? Date.parse(this.eventos()[0].hora) : 0));

  protected readonly estadoFases = computed(() =>
    FASES.map((f) => {
      const evs = this.eventos().filter((e) => f.etapas.includes(e.etapa ?? ''));
      const error = evs.some((e) => ETAPAS_ERROR.has(e.etapa ?? ''));
      return { fase: f, eventos: evs, estado: error ? 'error' : evs.length ? 'ok' : 'pendiente' };
    }),
  );

  /** Qué hizo cada nodo con este voto. */
  protected readonly porNodo = computed(() => {
    const nodos = new Map<number, { id: number; rol: string; recibio?: Evento; aplico?: Evento; guardo?: Evento }>();
    for (const e of this.eventos()) {
      if (e.nodoId === null) continue;
      const n = nodos.get(e.nodoId) ?? { id: e.nodoId, rol: NOMBRE_ROL[e.rol] ?? e.rol };
      if (e.etapa === 'ANEXADO_LOG' || e.etapa === 'ENTRADA_RECIBIDA') {
        n.recibio = e;
        n.rol = NOMBRE_ROL[e.rol] ?? e.rol;
      }
      if (e.etapa === 'APLICADO') n.aplico = e;
      if (e.etapa === 'GUARDADO_ARCHIVO') n.guardo = e;
      nodos.set(e.nodoId, n);
    }
    return [...nodos.values()].sort((a, b) => a.id - b.id);
  });

  // --------------------------------------------------------------- archivos de los nodos

  protected readonly archivos = signal<Archivos | null>(null);
  private readonly guardados = computed(
    () => this.servicio.eventos().filter((e) => e.etapa === 'GUARDADO_ARCHIVO' || e.etapa === 'INICIO').length,
  );

  constructor() {
    // Relee los archivos cada vez que algún nodo escribe en el suyo.
    effect(() => {
      this.guardados();
      untracked(() => this.cargarArchivos());
    });
  }

  protected cargarArchivos(): void {
    this.api.archivos().subscribe({ next: (a) => this.archivos.set(a), error: () => {} });
  }

  protected elegir(traza: string): void {
    this.seleccion.set(traza);
    this.router.navigate([], { queryParams: { traza }, replaceUrl: true });
  }

  protected desdeInicio(e: Evento): string {
    return '+' + (Date.parse(e.hora) - this.inicio()) + ' ms';
  }

  protected datos(e: Evento): [string, string][] {
    return Object.entries(e.datos ?? {});
  }

  protected resaltada(linea: string): boolean {
    const t = this.seleccion();
    return !!t && linea.endsWith(' | ' + t);
  }

  protected claseEstado(estado: string): string {
    if (estado === 'ACEPTADO') return 'ok';
    if (estado === 'EN PROCESO') return 'proceso';
    return 'error';
  }
}
