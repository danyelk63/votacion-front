import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { VotacionApi } from './core/votacion-api';
import { sondear } from './core/sondeo';
import { FormularioVoto } from './formulario-voto/formulario-voto';
import { ResultadosComponent } from './resultados/resultados';
import { PanelCluster } from './panel-cluster/panel-cluster';
import { ListaVotos } from './lista-votos/lista-votos';
import { Candidato } from './core/modelos';

@Component({
  selector: 'app-root',
  imports: [FormularioVoto, ResultadosComponent, PanelCluster, ListaVotos],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly api = inject(VotacionApi);

  protected readonly candidatos = toSignal(this.api.candidatos().pipe(catchError(() => of<Candidato[]>([]))), {
    initialValue: [],
  });
  protected readonly resultados = sondear(() => this.api.resultados(), 1000);
  protected readonly votos = sondear(() => this.api.votos(), 1500);
}
