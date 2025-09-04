import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ViewerComponent } from './viewer.component';
import { SimulationComponent } from './simulation/simulation.component';
import { CoreModule } from '../core/core.module';



@NgModule({
    imports: [
        CoreModule,
        CommonModule,
        ViewerComponent,
        SimulationComponent
    ],
    exports: [
        ViewerComponent
    ]
})
export class ViewerModule { }
