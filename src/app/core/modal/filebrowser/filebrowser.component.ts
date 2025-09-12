import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, EventEmitter, OnDestroy, OnInit, Output, ViewEncapsulation, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { FileMeta, ShareObj } from '../../model/datatypes';
import { defaults } from '../../model/defaults';
import { FileService } from '../../provider/file.service';
import { FirebaseService } from '../../provider/firebase.service';
import { WorkspaceService } from '../../provider/workspace.service';
import { LoginComponent } from '../login/login.component';
import { ShareComponent } from '../share/share.component';

@Component({
  selector: 'app-filebrowser',
  templateUrl: './filebrowser.component.html',
  styleUrls: ['./filebrowser.component.scss'],
  encapsulation: ViewEncapsulation.None,
  imports: [MatDialogTitle, CdkDrag, CdkDragHandle, MatButton, MatDialogClose, CdkScrollable, MatDialogContent, MatTooltip, MatMenuTrigger, MatMenu, MatMenuItem, MatFormField, MatLabel, MatInput, FormsModule, MatIconButton, MatSuffix, MatDialogActions]
})
export class FilebrowserComponent implements OnInit, OnDestroy {
  ws = inject(WorkspaceService);
  fs = inject(FileService);
  fb = inject(FirebaseService);
  private dialog = inject(MatDialog);
  data = inject(MAT_DIALOG_DATA);

  private _snackBar = inject(MatSnackBar);

  @Output() onLoadFromDB: any = new EventEmitter();
  @Output() onCreateFile: any = new EventEmitter();
  @Output() onDuplicateFile: any = new EventEmitter();
  @Output() onShareFile: any = new EventEmitter();
  @Output() onLoadMostRecent: any = new EventEmitter();



  rename_mode_id = -1;
  rename_file_name = "";


  has_db_connection = false;
  dbSubscription: Subscription;

  user_logged_in = false;
  authSubscription: Subscription;


  shared_files = [];
  sharedFileSubscription: Subscription;

  user_files = [];
  userFileSubscription: Subscription;

  currently_open_id: number = -1;


  constructor() {


    this.dbSubscription = this.fb.connectionChangeEvent$.subscribe(status => {
      this.has_db_connection = status;
    })

    this.authSubscription = this.fb.authChangeEvent$.subscribe(user => {
      this.user_logged_in = (user !== null);
    })

    this.sharedFileSubscription = this.fb.sharedFilesChangeEvent$.subscribe(curfiles => {
      this.shared_files = (curfiles) ? curfiles.shared : [];
    })

    this.userFileSubscription = this.fb.userFilesChangeEvent$.subscribe(curfiles => {
      this.user_files = (curfiles) ? curfiles.user : [];

    })





  }

  ngOnInit(): void {


    this.user_files = this.fb.file_list.user.slice();
    this.shared_files = this.fb.file_list.shared.slice();
    this.currently_open_id = this.ws.current_file.id ?? -1;

  }

  ngOnDestroy(): void {
    this.dbSubscription.unsubscribe();
    this.authSubscription.unsubscribe();
    this.sharedFileSubscription.unsubscribe();
    this.userFileSubscription.unsubscribe();
  }

  shareWorkspace(file_id: number) {


    const dialogRef = this.dialog.open(ShareComponent, {
      width: '600px',
      data: { fileid: file_id }
    });
  }

  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '600px',
    });
  }

  createBlankFile() {
    this.onCreateFile.emit();
  }

  openMostRecent() {
    this.onLoadMostRecent.emit();
  }



  editSharedFile(id: number) {

    const dialogRef = this.dialog.open(ShareComponent, {
      width: '600px',
      data: { fileid: id }
    });


  }


  unshare(id: number) {
    this.fb.removeSharedFile(id.toString());
  }


  openFile(id: number) {

    console.log("OPENING FILE ", id, this.fb.file_list)

    this.onLoadFromDB.emit(id);
  }

  duplicate(id: number) {
    this.onDuplicateFile.emit(id);
  }




  rename(id: number) {
    let file_to_rename = this.fb.file_list.user.find(el => el.id == id);

    if (file_to_rename !== undefined) {

      if (this.rename_mode_id !== -1) {



        const meta = this.fb.getFileMeta(file_to_rename.id)
          .then(meta => {
            meta.name = this.rename_file_name;
            return this.fb.writeFileMetaData(meta);

          })
          .then(success => {
            this.rename_mode_id = -1;
            this.rename_file_name = '';
          })
          .catch(err => {
            console.error(err);
            this.rename_mode_id = -1;
            this.rename_file_name = '';
          })

      } else {
        this.rename_file_name = file_to_rename.meta.name;
        this.rename_mode_id = id;
      }
    }
  }

  remove(fileid: number) {
    this.fb.removeFile(fileid);
  }

  /**
 * this is called when a user pushes save from the topbar
 * @param event 
 */
  public exportWorkspace(id: number) {

    const link = document.createElement('a')

    let fns = [this.fb.getFile(id), this.fb.getFileMeta(id)];
    Promise.all(fns)
      .then(res => {
        var theJSON = JSON.stringify(res[0]);
        link.href = "data:application/json;charset=UTF-8," + encodeURIComponent(theJSON);
        link.download = (<FileMeta>res[1]).name + ".ada";
        link.click();
      }).catch(err => { console.error(err) });
  }

  openSnackBar(message: string, action: string) {
    this._snackBar.open(message, action);
  }


  copyToClipboard(id: number) {
    const share_url = defaults.share_url_base + id;
    navigator.clipboard.writeText(share_url)
      .then(
        () => {
          this.openSnackBar('link copied', 'close')//on success
        },
        () => {
          //on fail 
          this.openSnackBar('could not copy link', 'close')//on success

        }
      )

  }
  /**
* this is called when a user pushes save from the topbar
* @param event 
*/
  public exportSharedWorkspace(id: number) {

    const link = document.createElement('a')

    let fns = [this.fb.getFile(id), this.fb.getShare(id)];
    Promise.all(fns)
      .then(res => {
        var theJSON = JSON.stringify(res[0]);
        link.href = "data:application/json;charset=UTF-8," + encodeURIComponent(theJSON);
        link.download = (<ShareObj>res[1]).filename + ".ada";
        link.click();
      }).catch(err => { console.error(err) });






  }




}
