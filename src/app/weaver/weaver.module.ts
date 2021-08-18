import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
import { ColorPickerModule } from 'ngx-color-picker';
import { MatChipsModule } from '@angular/material/chips';
import { ScrollingModule} from '@angular/cdk/scrolling';


import { CoreModule } from '../core/core.module';

import { WeaverComponent } from './weaver.component';
import { WeaverDesignComponent } from './tool/weaverdesign/weaverdesign.component';
import { WeaverPatternsComponent } from './tool/weaverpatterns/weaverpatterns.component';
import { LoomComponent } from './tool/loom/loom.component';
import { MasksComponent } from './tool/masks/masks.component';
import { SchematicComponent } from './tool/schematic/schematic.component';
import { WeaverViewComponent } from './tool/weaverview/weaverview.component';
import { ConnectionModal } from './modal/connection/connection.modal';
import { LabelModal } from './modal/label/label.modal';
import { TabComponent } from './tool/tab/tab.component';
import { MlModal } from './modal/ml/ml.modal';

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
    ScrollingModule

  ],
  declarations: [
    WeaverComponent,  
    WeaverDesignComponent, 
    WeaverPatternsComponent,
    ConnectionModal,
    LoomComponent,
    MasksComponent,
    LabelModal,
    SchematicComponent,
    WeaverViewComponent,
    TabComponent,
    MlModal 
    ],
  entryComponents: [
    ConnectionModal  ],
})
export class WeaverModule { }
