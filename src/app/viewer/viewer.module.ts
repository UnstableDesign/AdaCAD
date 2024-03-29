import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewerComponent } from './viewer.component';
import { SimulationComponent } from './simulation/simulation.component';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatExpansionModule } from '@angular/material/expansion';



@NgModule({
  declarations: [
    ViewerComponent,
    SimulationComponent
  ],
  imports: [
    CommonModule,
    MatButtonModule,
    MatMenuModule,
    MatExpansionModule
  ],
  exports: [
    ViewerComponent
  ]
})
export class ViewerModule { }
