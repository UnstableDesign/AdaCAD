import { DragDropModule } from '@angular/cdk/drag-drop';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatLegacyAutocompleteModule as MatAutocompleteModule } from '@angular/material/legacy-autocomplete';
import { MatBadgeModule } from '@angular/material/badge';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatLegacyCardModule as MatCardModule } from '@angular/material/legacy-card';
import { MatLegacyCheckboxModule as MatCheckboxModule } from '@angular/material/legacy-checkbox';
import { MatLegacyChipsModule as MatChipsModule } from '@angular/material/legacy-chips';
import { MatLegacyDialogModule as MatDialogModule } from '@angular/material/legacy-dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatLegacyFormFieldModule as MatFormFieldModule } from '@angular/material/legacy-form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyInputModule as MatInputModule } from '@angular/material/legacy-input';
import { MatLegacyListModule as MatListModule } from '@angular/material/legacy-list';
import { MatLegacyMenuModule as MatMenuModule } from '@angular/material/legacy-menu';
import { MatLegacyProgressBarModule as MatProgressBarModule } from '@angular/material/legacy-progress-bar';
import { MatLegacyRadioModule as MatRadioModule } from '@angular/material/legacy-radio';
import { MatLegacySelectModule as MatSelectModule } from '@angular/material/legacy-select';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatLegacySlideToggleModule as MatSlideToggleModule } from '@angular/material/legacy-slide-toggle';
import { MatLegacySliderModule as MatSliderModule } from '@angular/material/legacy-slider';
import { MatLegacySnackBarModule as MatSnackBarModule } from '@angular/material/legacy-snack-bar';
import { MatLegacyTabsModule as MatTabsModule } from '@angular/material/legacy-tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatLegacyTooltipModule as MatTooltipModule } from '@angular/material/legacy-tooltip';
import { MatTreeModule } from '@angular/material/tree';
import { BrowserModule } from '@angular/platform-browser';
import { ColorPickerModule } from 'ngx-color-picker';
import { LoginComponent } from './login/login.component';
import { AboutModal } from './modal/about/about.modal';
import { InitModal } from './modal/init/init.modal';
import { LoomModal } from './modal/loom/loom.modal';
import { MaterialModal } from './modal/material/material.modal';
import { ProfileComponent } from './profile/profile.component';
import { AuthService } from './provider/auth.service';
import { FileService } from './provider/file.service';
import { PatternfinderService } from './provider/patternfinder.service';
import { VaeService } from './provider/vae.service';
import { SignupComponent } from './signup/signup.component';
import { TopbarComponent } from './topbar/topbar.component';
import { UploadFormComponent } from './uploads/upload-form/upload-form.component';
import { UploadService } from './provider/upload.service';
import { BlankdraftModal } from './modal/blankdraft/blankdraft.modal';
import { ExamplesComponent } from './modal/examples/examples.component';
import { LoadfileComponent } from './modal/loadfile/loadfile.component';
import { FilebrowserComponent } from './filebrowser/filebrowser.component';
import { KeycodesDirective } from './keycodes.directive';

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
        UploadFormComponent,
        TopbarComponent,
        InitModal,
        AboutModal,
        MaterialModal,
        LoomModal,
        LoginComponent,
        SignupComponent,
        ProfileComponent,
        BlankdraftModal,
        ExamplesComponent,
        LoadfileComponent,
        FilebrowserComponent,
        KeycodesDirective
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
        MatProgressBarModule,
        MatChipsModule,
        MatSnackBarModule,
        ScrollingModule,
        MatBadgeModule,
        DragDropModule,
        UploadFormComponent,
        TopbarComponent,
        InitModal,
        AboutModal,
        MaterialModal,
        LoomModal,
        FilebrowserComponent,
        ExamplesComponent,
        KeycodesDirective
        ]
})
export class CoreModule { }
