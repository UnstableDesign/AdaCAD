import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {DragDropModule} from '@angular/cdk/drag-drop';

import {MatAutocompleteModule} from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSliderModule } from '@angular/material/slider';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import {MatSnackBarModule} from '@angular/material/snack-bar';

import { ColorPickerModule } from 'ngx-color-picker';
import { MatChipsModule } from '@angular/material/chips';
import {ScrollingModule} from '@angular/cdk/scrolling';

import { MixerComponent} from './mixer.component';
import { TopbarComponent } from './topbar/topbar.component';
import { DesignComponent } from './tool/design/design.component';
import { PatternsComponent } from './tool/patterns/patterns.component';
import { MaterialsComponent } from './tool/materials/materials.component';
import { SystemsComponent } from './tool/systems/systems.component';
import { LoomComponent } from './tool/loom/loom.component';
import { MasksComponent } from './tool/masks/masks.component';
import { SchematicComponent } from './tool/schematic/schematic.component';
import { ViewComponent } from './tool/view/view.component';


import { CoreModule } from '../core/core.module';

import { AboutModal } from './modal/about/about.modal';
import { PatternModal } from './modal/pattern/pattern.modal';
import { MaterialModal} from './modal/material/material.modal';
import { ShuttlesModal } from './modal/shuttles/shuttles.modal';
import { ConnectionModal } from './modal/connection/connection.modal';
import { InitModal } from './modal/init/init.modal';
import { LabelModal } from './modal/label/label.modal';
import { NotesComponent } from './tool/notes/notes.component';
import { SubdraftComponent } from './palette/subdraft/subdraft.component';
import { PaletteComponent } from './palette/palette.component';
import { SnackbarComponent } from './palette/snackbar/snackbar.component';
import { SelectionComponent } from './palette/selection/selection.component';
import { OperationComponent } from './palette/operation/operation.component';
import { ConnectionComponent } from './palette/connection/connection.component';





@NgModule({
  imports: [
    CommonModule,
    CoreModule,
    FormsModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatButtonModule,
    MatButtonToggleModule,
    MatSlideToggleModule,
    MatCardModule,
    MatCheckboxModule,
    MatDialogModule,
    MatDividerModule,
    MatExpansionModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatListModule,
    MatMenuModule,
    MatRadioModule,
    MatSelectModule,
    MatSidenavModule,
    MatSliderModule,
    MatTabsModule,
    MatToolbarModule,
    MatTooltipModule,
    ColorPickerModule,
    MatChipsModule,
    MatSnackBarModule,
    ScrollingModule,
    DragDropModule

  ],
  declarations: [
    TopbarComponent, 
    DesignComponent, 
    MixerComponent,
    PatternsComponent,
    ShuttlesModal,
    AboutModal,
    PatternModal,
    ConnectionModal,
    InitModal,
    LabelModal,
    MaterialModal,
    SystemsComponent,
    LoomComponent,
    MaterialsComponent,
    MasksComponent,
    SchematicComponent,
    ViewComponent,
    NotesComponent,
    SubdraftComponent,
    PaletteComponent,
    SnackbarComponent,
    SelectionComponent,
    OperationComponent,
    ConnectionComponent
  ],
  entryComponents: [
    ShuttlesModal,
    AboutModal,
    PatternModal,
    ConnectionModal,
    InitModal,
    MaterialModal,
    LabelModal,
    SubdraftComponent,
    SnackbarComponent  
  ]
})
export class MixerModule { }
