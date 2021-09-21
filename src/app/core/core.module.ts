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
import {MatExpansionModule} from '@angular/material/expansion';
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
import {MatTreeModule} from '@angular/material/tree';
import {MatProgressBarModule} from '@angular/material/progress-bar';
import { ColorPickerModule } from 'ngx-color-picker';
import { MatChipsModule } from '@angular/material/chips';
import {ScrollingModule} from '@angular/cdk/scrolling';

import { PatternService } from './provider/pattern.service';
import { CollectionService } from './provider/collection.service';
import { UploadService } from './uploads/upload.service';
import { FilterPipe } from './pipe/filter.pipe';
import { UploadFormComponent } from './uploads/upload-form/upload-form.component';
import { TopbarComponent } from './topbar/topbar.component';
import { ActionsComponent} from './modal/actions/actions.component'
import { InitModal } from './modal/init/init.modal';
import { AboutModal } from './modal/about/about.modal';
import { MlModal } from './modal/ml/ml.modal';
import { PatternModal } from './modal/pattern/pattern.modal';
import { MaterialModal } from './modal/material/material.modal';
import { FileService } from './provider/file.service';
import { ShuttlesModal } from './modal/shuttles/shuttles.modal';
import { DraftviewerComponent } from './draftviewer/draftviewer.component';
import { VAE } from '../weaver/learning/vae';

import { WeaverViewComponent } from './modal/weaverview/weaverview.component';
import { SelectionComponent } from './draftviewer/selection/selection.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { LoomModal } from './modal/loom/loom.modal';
import { Action } from 'rxjs/internal/scheduler/Action';

@NgModule({
  imports: [
    CommonModule,
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
    MatTreeModule,
    ColorPickerModule,
    MatChipsModule,
    MatSnackBarModule,
    ScrollingModule,
    DragDropModule,
    MatProgressBarModule
  ],
  declarations: [
    FilterPipe, 
    UploadFormComponent,
    TopbarComponent,
    ActionsComponent,
    PatternModal,
    ShuttlesModal,
    InitModal,
    AboutModal,
    MlModal,
    MaterialModal,
    LoomModal,
    DraftviewerComponent,
    SelectionComponent,
    SidebarComponent,
    WeaverViewComponent
   ],

  providers: [
    PatternService, 
    UploadService,
    CollectionService,
    FileService,
    VAE //potentially need to delete
  ],

  exports: [
    CommonModule,
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
    MatTreeModule,
    ColorPickerModule,
    MatChipsModule,
    MatSnackBarModule,
    ScrollingModule,
    DragDropModule,
    FilterPipe, 
    UploadFormComponent,
    TopbarComponent,
    ActionsComponent,
    PatternModal,
    InitModal,
    AboutModal,
    MlModal,
    MaterialModal,
    LoomModal,
    DraftviewerComponent,
    SelectionComponent,
    SidebarComponent,
    WeaverViewComponent],
  
    entryComponents: [
      InitModal,
      AboutModal,
      MlModal,
      PatternModal,
      MaterialModal,
      LoomModal,
      DraftviewerComponent,
      ActionsComponent,
      WeaverViewComponent
    ],
})
export class CoreModule { }
