import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { MessageModule } from 'primeng/message';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { EventosService } from './core/eventos';
import { VotacionApi } from './core/votacion-api';
import { CLASE_OSCURO } from './tema';

interface Seccion {
  ruta: string;
  etiqueta: string;
  icono: string;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ButtonModule,
    MessageModule,
    TagModule,
    ToastModule,
    ConfirmDialogModule,
    TooltipModule,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly eventos = inject(EventosService);
  private readonly api = inject(VotacionApi);
  private readonly confirmacion = inject(ConfirmationService);
  private readonly mensajes = inject(MessageService);
  protected readonly vaciando = signal(false);

  protected readonly secciones: Seccion[] = [
    { ruta: '/votar', etiqueta: 'Registrar voto', icono: 'pi pi-check-square' },
    { ruta: '/conteo', etiqueta: 'Conteo', icono: 'pi pi-chart-bar' },
    { ruta: '/log-servidor', etiqueta: 'Log del servidor', icono: 'pi pi-server' },
    { ruta: '/procesamiento', etiqueta: 'Procesamiento', icono: 'pi pi-sitemap' },
    { ruta: '/log-usuario', etiqueta: 'Log del usuario', icono: 'pi pi-users' },
  ];

  protected readonly oscuro = signal(this.preferenciaInicial());

  /** Se da un margen antes de avisar, para no mostrarlo en una conexión normal. */
  private readonly margenCumplido = signal(false);
  protected readonly despertando = computed(() => this.margenCumplido() && !this.eventos.conectado());

  constructor() {
    this.aplicarTema();
    setTimeout(() => this.margenCumplido.set(true), 2500);
  }

  protected confirmarVaciado(): void {
    this.confirmacion.confirm({
      header: 'Vaciar todo',
      message:
        'Se borran los votos, el log del servidor, el log de usuarios y los archivos de los 3 nodos. ' +
        'El clúster arranca de cero (término 0) y elige un líder nuevo. ¿Continuar?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, vaciar todo',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger', icon: 'pi pi-eraser' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.vaciar(),
    });
  }

  private vaciar(): void {
    this.vaciando.set(true);
    this.api.vaciarTodo().subscribe({
      next: () => {
        this.vaciando.set(false);
        this.mensajes.add({
          severity: 'success',
          summary: 'Todo vacío',
          detail: 'El clúster arrancó de cero y está eligiendo un líder nuevo',
          life: 4000,
        });
      },
      error: (e) => {
        this.vaciando.set(false);
        this.mensajes.add({
          severity: 'error',
          summary: 'No se pudo vaciar',
          detail: e.error?.error ?? 'El gateway no responde',
          life: 6000,
        });
      },
    });
  }

  protected alternarTema(): void {
    this.oscuro.update((o) => !o);
    this.aplicarTema();
    try {
      localStorage.setItem('tema', this.oscuro() ? 'oscuro' : 'claro');
    } catch {
      /* almacenamiento no disponible */
    }
  }

  private aplicarTema(): void {
    document.documentElement.classList.toggle(CLASE_OSCURO, this.oscuro());
  }

  private preferenciaInicial(): boolean {
    try {
      const guardado = localStorage.getItem('tema');
      if (guardado) return guardado === 'oscuro';
    } catch {
      /* almacenamiento no disponible */
    }
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  }
}
