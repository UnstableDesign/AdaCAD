import { CoreModule } from '../core/core.module';
import { EditorComponent } from './editor.component';
import { RepeatsComponent } from './repeats/repeats.component';
import { LoomComponent } from './loom/loom.component';
import { NgModule } from '@angular/core';

@NgModule({
    declarations: [
        EditorComponent,
        RepeatsComponent,
        LoomComponent
    ],
    imports: [
        CoreModule,  
    ],
    exports:[
        EditorComponent
    ]
})
export class EditorModule { }
