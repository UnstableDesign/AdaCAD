import { NgModule } from '@angular/core';
import { CoreModule } from '../core/core.module';
import { MixerComponent} from './mixer.component';
import { SubdraftComponent } from './palette/subdraft/subdraft.component';
import { PaletteComponent } from './palette/palette.component';
import { SnackbarComponent } from './palette/snackbar/snackbar.component';
import { OperationComponent } from './palette/operation/operation.component';
import { ConnectionComponent } from './palette/connection/connection.component';
import { OpHelpModal } from './modal/ophelp/ophelp.modal';
import { ImageComponent } from './palette/image/image.component';
import { EditorModule } from '../editor/editor.module';
import { NoteComponent } from './palette/note/note.component';
import { ParameterComponent } from './palette/operation/parameter/parameter.component';
import { InletComponent } from './palette/operation/inlet/inlet.component';
import { DraftrenderingComponent } from './palette/draftrendering/draftrendering.component';



@NgModule({
    imports: [
        CoreModule,
        EditorModule    
    ],
    declarations: [
        MixerComponent,
        SubdraftComponent,
        PaletteComponent,
        SnackbarComponent,
        OperationComponent,
        ConnectionComponent,
        OpHelpModal,
        ImageComponent,
        NoteComponent,
        ParameterComponent,
        InletComponent,
        DraftrenderingComponent
        ],
    exports: [
        MixerComponent
    ]
})
export class MixerModule { }
