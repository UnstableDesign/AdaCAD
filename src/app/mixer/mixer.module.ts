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
import { TreeComponent } from './tool/tree/tree.component';
import { FlowComponent } from './tool/flow/flow.component';
import { OpHelpModal } from './modal/ophelp/ophelp.modal';
import { ImageComponent } from './palette/image/image.component';
import { MixerInitComponent } from './modal/mixerinit/mixerinit.component';
import { DraftdetailComponent } from './modal/draftdetail/draftdetail.component';





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
    TreeComponent,
    FlowComponent,
    OpHelpModal,
    ImageComponent,
    MixerInitComponent,
    DraftdetailComponent
    ],
  entryComponents: [
    SubdraftComponent,
    SnackbarComponent,
    OperationComponent,
    ConnectionComponent,
    OpHelpModal,
    MixerInitComponent,
    DraftdetailComponent
  ]
})
export class MixerModule { }
