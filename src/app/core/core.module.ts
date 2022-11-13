import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatChipsModule } from '@angular/material/chips';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatRadioModule } from '@angular/material/radio';
import { MatSelectModule } from '@angular/material/select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSliderModule } from '@angular/material/slider';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { BrowserModule } from '@angular/platform-browser';
import { ColorPickerModule } from 'ngx-color-picker';
import { DraftviewerComponent } from './draftviewer/draftviewer.component';
import { SelectionComponent } from './draftviewer/selection/selection.component';
import { EmailComponent } from './email/email.component';
import { LoginComponent } from './login/login.component';
import { AboutModal } from './modal/about/about.modal';
import { ActionsComponent } from './modal/actions/actions.component';
import { InitModal } from './modal/init/init.modal';
import { LoomModal } from './modal/loom/loom.modal';
import { MaterialModal } from './modal/material/material.modal';
import { WeaverViewComponent } from './modal/weaverview/weaverview.component';
import { FilterPipe } from './pipe/filter.pipe';
import { ProfileComponent } from './profile/profile.component';
import { AuthService } from './provider/auth.service';
import { FileService } from './provider/file.service';
import { PatternfinderService } from './provider/patternfinder.service';
import { VaeService } from './provider/vae.service';
import { SidebarComponent } from './sidebar/sidebar.component';
import { SignupComponent } from './signup/signup.component';
import { TopbarComponent } from './topbar/topbar.component';
import { UploadFormComponent } from './uploads/upload-form/upload-form.component';
import { UploadService } from './uploads/upload.service';

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
