import { Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { Candidato } from '../../core/modelos';
import { sondear } from '../../core/sondeo';
import { VotacionApi } from '../../core/votacion-api';
import { FormularioVoto } from '../../formulario-voto/formulario-voto';
import { ListaVotos } from '../../lista-votos/lista-votos';
import { PanelCluster } from '../../panel-cluster/panel-cluster';
import { ResultadosComponent } from '../../resultados/resultados';

/** Vista 1: registrar el voto. */
@Component({
  selector: 'app-votar',
  imports: [FormularioVoto, ResultadosComponent, PanelCluster, ListaVotos],
  template: `
    <div class="rejilla">
      <section class="tarjeta">
        <app-formulario-voto [candidatos]="candidatos()" />
      </section>
      <section class="tarjeta">
        <app-resultados [resultados]="resultados.valor()" />
      </section>
      <section class="tarjeta ancho">
        <app-panel-cluster />
      </section>
      <section class="tarjeta ancho">
        <app-lista-votos [listado]="votos.valor()" [candidatos]="candidatos()" />
      </section>
    </div>
  `,
})
export class Votar {
  private readonly api = inject(VotacionApi);
  protected readonly candidatos = toSignal(this.api.candidatos().pipe(catchError(() => of<Candidato[]>([]))), {
    initialValue: [],
  });
  protected readonly resultados = sondear(() => this.api.resultados(), 1000);
  protected readonly votos = sondear(() => this.api.votos(), 1500);
}
