import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { catchError, of } from 'rxjs';
import { CardModule } from 'primeng/card';
import { Candidato } from '../../core/modelos';
import { sondear } from '../../core/sondeo';
import { VotacionApi } from '../../core/votacion-api';
import { FormularioVoto } from '../../componentes/formulario-voto/formulario-voto';
import { PanelCluster } from '../../componentes/panel-cluster/panel-cluster';

@Component({
  selector: 'app-votar',
  imports: [FormularioVoto, PanelCluster, CardModule, RouterLink],
  templateUrl: './votar.html',
  styleUrl: './votar.scss',
})
export class Votar {
  private readonly api = inject(VotacionApi);

  protected readonly candidatos = toSignal(this.api.candidatos().pipe(catchError(() => of<Candidato[]>([]))), {
    initialValue: [],
  });
  protected readonly resultados = sondear(() => this.api.resultados(), 1000);
}
