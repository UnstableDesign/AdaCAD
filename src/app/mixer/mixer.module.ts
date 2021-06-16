import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';


import { MixerComponent} from './mixer.component';
import { MixerDesignComponent } from './tool/mixerdesign/mixerdesign.component';
import { MixerPatternsComponent } from './tool/mixerpatterns/mixerpatterns.component';
import { MixerViewComponent } from './tool/mixerview/mixerview.component';
import { SubdraftComponent } from './palette/subdraft/subdraft.component';
import { PaletteComponent } from './palette/palette.component';
import { SnackbarComponent } from './palette/snackbar/snackbar.component';
import { SelectionComponent } from './palette/selection/selection.component';
import { OperationComponent } from './palette/operation/operation.component';
import { ConnectionComponent } from './palette/connection/connection.component';





@NgModule({
  imports: [
    CoreModule
  ],
  declarations: [
    MixerDesignComponent, 
    MixerComponent,
    MixerPatternsComponent,
    MixerViewComponent,
    SubdraftComponent,
    PaletteComponent,
    SnackbarComponent,
    SelectionComponent,
    OperationComponent,
    ConnectionComponent,
    ],
  entryComponents: [
    SubdraftComponent,
    SnackbarComponent,
  ]
})
export class MixerModule { }
