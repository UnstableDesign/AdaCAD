import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';


import { MixerComponent} from './mixer.component';
import { MixerDesignComponent } from './tool/mixerdesign/mixerdesign.component';
import { MixerPatternsComponent } from './tool/mixerpatterns/mixerpatterns.component';
import { MixerViewComponent } from './modal/mixerview/mixerview.component';
import { SubdraftComponent } from './palette/subdraft/subdraft.component';
import { PaletteComponent } from './palette/palette.component';
import { SnackbarComponent } from './palette/snackbar/snackbar.component';
import { MarqueeComponent } from './palette/marquee/marquee.component';
import { OperationComponent } from './palette/operation/operation.component';
import { ConnectionComponent } from './palette/connection/connection.component';
import { TreeComponent } from './tool/tree/tree.component';
import { OpsComponent } from './modal/ops/ops.component';
import { OpHelpModal } from './modal/ophelp/ophelp.modal';
import { ImageComponent } from './palette/image/image.component';
import { MixerInitComponent } from './modal/mixerinit/mixerinit.component';
import { DraftdetailComponent } from './modal/draftdetail/draftdetail.component';
import { WeaverModule } from '../weaver/weaver.module';
import { NoteComponent } from './palette/note/note.component';





@NgModule({
  imports: [
    CoreModule,
    WeaverModule
  ],
  declarations: [
    MixerDesignComponent, 
    MixerComponent,
    MixerPatternsComponent,
    MixerViewComponent,
    SubdraftComponent,
    PaletteComponent,
    SnackbarComponent,
    MarqueeComponent,
    OperationComponent,
    ConnectionComponent,
    TreeComponent,
    OpsComponent,
    OpHelpModal,
    ImageComponent,
    MixerInitComponent,
    DraftdetailComponent,
    NoteComponent,
    ],
  entryComponents: [
    SubdraftComponent,
    SnackbarComponent,
    OperationComponent,
    ConnectionComponent,
    OpHelpModal,
    MixerInitComponent,
    DraftdetailComponent,
    OpsComponent,
    MixerViewComponent,
    NoteComponent
  ]
})
export class MixerModule { }
