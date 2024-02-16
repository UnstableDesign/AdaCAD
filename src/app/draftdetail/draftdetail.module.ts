import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { ColorPickerModule } from 'ngx-color-picker';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { ScrollingModule} from '@angular/cdk/scrolling';
import { CoreModule } from '../core/core.module';
import { DraftDetailComponent } from './draftdetail.component';
import { DraftviewerComponent } from './draftviewer/draftviewer.component';
import { ActionsComponent } from './actions/actions.component';
import { RenderService } from './provider/render.service';
import { SidebarComponent } from './draftviewer/sidebar/sidebar.component';
import { SelectionComponent } from './draftviewer/selection/selection.component';
import { SimulationComponent } from './simulation/simulation.component';
import { SimSidebarComponent } from './simulation/sim-sidebar/sim-sidebar.component';

@NgModule({
    declarations: [
        DraftDetailComponent,
        DraftviewerComponent,
        ActionsComponent,
        SidebarComponent,
        SelectionComponent,
        SimulationComponent,
        SimSidebarComponent
    ],
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
    exports:[
        DraftDetailComponent
    ],
    providers: [
        RenderService
    ]
})
export class DraftDetailModule { }
