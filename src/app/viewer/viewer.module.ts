import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewerComponent } from './viewer.component';
import { SimulationComponent } from './simulation/simulation.component';
import { MatButtonModule } from '@angular/material/button';



@NgModule({
  declarations: [
    ViewerComponent,
    SimulationComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule
  ],
  exports: [
    ViewerComponent
  ]
})
export class ViewerModule { }
