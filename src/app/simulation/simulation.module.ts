import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SimulationComponent } from './simulation.component';
import { SimSidebarComponent } from './sim-sidebar/sim-sidebar.component';



@NgModule({
  declarations: [
    SimulationComponent,
    SimSidebarComponent
  ],
  imports: [
    CommonModule
  ],
  exports: [
    SimulationComponent
  ]
})
export class SimulationModule { }
