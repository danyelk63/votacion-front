import { Injectable, OnDestroy, computed, signal } from '@angular/core';
import { Evento, MensajeWs } from './modelos';
import { environment } from '../../environments/environment';

const MAX_EVENTOS = 5000;

@Injectable({ providedIn: 'root' })
export class EventosService implements OnDestroy {
  private socket: WebSocket | null = null;
  private reintento: ReturnType<typeof setTimeout> | null = null;
  private cerrado = false;

  private readonly _eventos = signal<Evento[]>([]);
  readonly eventos = this._eventos.asReadonly();
  readonly conectado = signal(false);

  readonly reinicios = signal(0);
  readonly total = computed(() => this._eventos().length);

  constructor() {
    this.conectar();
  }

  private conectar(): void {
    const protocolo = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(environment.wsUrl ?? `${protocolo}://${location.host}/ws`);
    this.socket = ws;
    ws.onopen = () => this.conectado.set(true);
    ws.onmessage = (m) => this.procesar(JSON.parse(m.data) as MensajeWs);
    ws.onclose = () => {
      this.conectado.set(false);
      if (!this.cerrado) this.reintento = setTimeout(() => this.conectar(), 2000);
    };
    ws.onerror = () => ws.close();
  }

  private procesar(m: MensajeWs): void {
    if (m.tipo === 'reinicio') {
      this._eventos.set([]);
      this.reinicios.update((n) => n + 1);
    } else if (m.tipo === 'historial') {
      const conocidos = new Map(this._eventos().map((e) => [e.secuencia, e]));
      for (const e of m.eventos) conocidos.set(e.secuencia, e);
      this._eventos.set([...conocidos.values()].sort((a, b) => a.secuencia - b.secuencia).slice(-MAX_EVENTOS));
    } else {
      this._eventos.update((lista) => {
        const nueva = lista.length >= MAX_EVENTOS ? lista.slice(1) : lista.slice();
        nueva.push(m.evento);
        return nueva;
      });
    }
  }

  limpiar(): void {
    this._eventos.set([]);
  }

  ngOnDestroy(): void {
    this.cerrado = true;
    if (this.reintento) clearTimeout(this.reintento);
    this.socket?.close();
  }
}
