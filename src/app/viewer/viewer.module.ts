import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewerComponent } from './viewer.component';
import { SimulationComponent } from './simulation/simulation.component';
import { CoreModule } from '../core/core.module';



@NgModule({
  declarations: [
    ViewerComponent,
    SimulationComponent
  ],
  imports: [
    CoreModule,
    CommonModule
  ],
  exports: [
    ViewerComponent
  ]
})
export class ViewerModule { }
