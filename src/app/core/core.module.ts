import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {DragDropModule} from '@angular/cdk/drag-drop';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
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
import {MatBadgeModule} from '@angular/material/badge';
import { UploadService } from './uploads/upload.service';
import { FilterPipe } from './pipe/filter.pipe';
import { UploadFormComponent } from './uploads/upload-form/upload-form.component';
import { TopbarComponent } from './topbar/topbar.component';
import { ActionsComponent} from './modal/actions/actions.component'
import { InitModal } from './modal/init/init.modal';
import { AboutModal } from './modal/about/about.modal';
import { MaterialModal } from './modal/material/material.modal';
import { FileService } from './provider/file.service';
import { DraftviewerComponent } from './draftviewer/draftviewer.component';
import { WeaverViewComponent } from './modal/weaverview/weaverview.component';
import { SelectionComponent } from './draftviewer/selection/selection.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { LoomModal } from './modal/loom/loom.modal';
import { VaeService } from './provider/vae.service';
import { PatternfinderService } from './provider/patternfinder.service';
import { LoginComponent } from './login/login.component';
import { SignupComponent } from './signup/signup.component';
import { ProfileComponent } from './profile/profile.component';
import { EmailComponent } from './email/email.component';
import { AuthService } from './provider/auth.service';

@NgModule({
    imports: [
        CommonModule,
        BrowserModule,
        HttpClientModule,
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
        MatProgressBarModule,
        MatBadgeModule
    ],
    declarations: [
        FilterPipe,
        UploadFormComponent,
        TopbarComponent,
        ActionsComponent,
        InitModal,
        AboutModal,
        MaterialModal,
        LoomModal,
        DraftviewerComponent,
        SelectionComponent,
        SidebarComponent,
        WeaverViewComponent,
        LoginComponent,
        SignupComponent,
        ProfileComponent,
        EmailComponent
        ],
    providers: [
        UploadService,
        FileService,
        VaeService,
        PatternfinderService,
        AuthService
    ],
    exports: [
        CommonModule,
        FormsModule,
        BrowserModule,
        HttpClientModule,
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
        MatBadgeModule,
        DragDropModule,
        FilterPipe,
        UploadFormComponent,
        TopbarComponent,
        ActionsComponent,
        InitModal,
        AboutModal,
        MaterialModal,
        LoomModal,
        DraftviewerComponent,
        SelectionComponent,
        SidebarComponent,
        WeaverViewComponent
    ]
})
export class CoreModule { }
