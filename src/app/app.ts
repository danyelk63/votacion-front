import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { EventosService } from './core/eventos';
import { CLASE_OSCURO } from './tema';

interface Seccion {
  ruta: string;
  etiqueta: string;
  icono: string;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, ButtonModule, TagModule, ToastModule, ConfirmDialogModule, TooltipModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly eventos = inject(EventosService);

  protected readonly secciones: Seccion[] = [
    { ruta: '/votar', etiqueta: 'Registrar voto', icono: 'pi pi-check-square' },
    { ruta: '/conteo', etiqueta: 'Conteo', icono: 'pi pi-chart-bar' },
    { ruta: '/log-servidor', etiqueta: 'Log del servidor', icono: 'pi pi-server' },
    { ruta: '/procesamiento', etiqueta: 'Procesamiento', icono: 'pi pi-sitemap' },
    { ruta: '/log-usuario', etiqueta: 'Log del usuario', icono: 'pi pi-users' },
  ];

  protected readonly oscuro = signal(this.preferenciaInicial());

  constructor() {
    this.aplicarTema();
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
