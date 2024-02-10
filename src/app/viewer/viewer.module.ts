import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewerComponent } from './viewer.component';
import { SimulationComponent } from './simulation/simulation.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';



@NgModule({
  declarations: [
    ViewerComponent,
    SimulationComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatMenuModule
  ],
  exports: [
    ViewerComponent
  ]
})
export class ViewerModule { }
