import { Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { Candidato } from '../../core/modelos';
import { sondear } from '../../core/sondeo';
import { VotacionApi } from '../../core/votacion-api';
import { FormularioVoto } from '../../componentes/formulario-voto/formulario-voto';
import { PanelCluster } from '../../componentes/panel-cluster/panel-cluster';

/** Vista 1: registrar el voto (y borrar todos los votos). */
@Component({
  selector: 'app-votar',
  imports: [FormularioVoto, PanelCluster, ButtonModule, CardModule, RouterLink],
  templateUrl: './votar.html',
  styleUrl: './votar.scss',
})
export class Votar {
  private readonly api = inject(VotacionApi);
  private readonly confirmacion = inject(ConfirmationService);
  private readonly mensajes = inject(MessageService);

  protected readonly candidatos = toSignal(this.api.candidatos().pipe(catchError(() => of<Candidato[]>([]))), {
    initialValue: [],
  });
  protected readonly resultados = sondear(() => this.api.resultados(), 1000);
  protected readonly borrando = signal(false);

  protected confirmarBorrado(): void {
    const total = this.resultados.valor()?.total ?? 0;
    this.confirmacion.confirm({
      header: 'Borrar todos los votos',
      message:
        `Se borrarán ${total} voto(s) de TODOS los nodos y de sus archivos votos.txt. ` +
        'La orden se replica por consenso (Raft) como cualquier otra escritura. ¿Continuar?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Sí, borrar todo',
      rejectLabel: 'Cancelar',
      acceptButtonProps: { severity: 'danger', icon: 'pi pi-trash' },
      rejectButtonProps: { severity: 'secondary', outlined: true },
      accept: () => this.borrar(),
    });
  }

  private borrar(): void {
    this.borrando.set(true);
    this.api.borrarVotos().subscribe({
      next: (r) => {
        this.borrando.set(false);
        this.resultados.refrescar();
        this.mensajes.add({
          severity: 'success',
          summary: 'Votos borrados',
          detail: `${r.votosBorrados} voto(s) eliminados en todo el clúster (orden #${r.indiceLog}, líder nodo ${r.lider}, ${r.duracionMs} ms)`,
          life: 5000,
        });
      },
      error: (e) => {
        this.borrando.set(false);
        this.mensajes.add({
          severity: 'error',
          summary: 'No se pudieron borrar los votos',
          detail: e.error?.error ?? 'El gateway no responde',
          life: 5000,
        });
      },
    });
  }
}
