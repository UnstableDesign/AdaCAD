import { Component, EventEmitter, Inject, OnInit, Optional, Output,ViewEncapsulation } from '@angular/core';
import { AuthService } from '../provider/auth.service';
import { FilesystemService } from '../provider/filesystem.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { WorkspaceService } from '../provider/workspace.service';
import { LoadfileComponent } from '../modal/loadfile/loadfile.component';

@Component({
  selector: 'app-filebrowser',
  templateUrl: './filebrowser.component.html',
  styleUrls: ['./filebrowser.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class FilebrowserComponent implements OnInit {

  //@Output() onLoadNewFile: any = new EventEmitter();
  //@Output() onClearScreen: any = new EventEmitter();
  @Output() onCurrentFileDeleted: any = new EventEmitter();
  //@Output() onSave: any = new EventEmitter();
  @Output() onLoadFromDB: any = new EventEmitter();

  
  isLoggedIn = false;
  filelist = [];
  rename_mode = false;
  last_saved_time = '--';

  constructor(
    public files: FilesystemService, 
    public auth: AuthService,
    public ws: WorkspaceService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
    ) { 
    
  console.log("data is ", data)

    this.filelist = this.files.file_tree;

      this.files.file_tree_change$.subscribe(data => {
        
        this.updateFileData(data);
      }
    );

    this.files.file_saved_change$.subscribe(data => {
      this.last_saved_time =new Date(data).toUTCString();
    });



  
   

  }

  ngOnInit(): void {
    
    
    
  }

  updateFileData(data: Array<any>){
    function compareFn(a, b) {
      if (a.meta.timestamp > b.meta.timestamp) {
        return -1;
      }
      if (a.meta.timestamp < b.meta.timestamp) {
        return 1;
      }
      // a must be equal to b
      return 0;
    }

    const timesorted = data.sort(compareFn);
    // const favs = timesorted.filter(el => this.ws.isFavorite(el.id) || this.files.current_file_id == el.id);
    // const other = timesorted.filter(el => !this.ws.isFavorite(el.id) && this.files.current_file_id !== el.id);

    //this.filelist = favs.concat(other);
    this.filelist = timesorted;

  }


  openFile(id: number){
    this.onLoadFromDB.emit(id);
  }

  toggleFavorite(id: number){
      this.ws.toggleFavorite(id);
      this.updateFileData(this.filelist)
  }

  duplicate(){
    
  }



  rename(){
    if(this.rename_mode === true){
      this.files.renameFile(this.files.current_file_id, this.files.current_file_name);
      this.files.updateDescription(this.files.current_file_id, this.files.current_file_desc);
      this.rename_mode = false;
    }else{
      this.rename_mode = true;
    } 

  }

  remove(fileid: number){
    this.files.removeFile(fileid);
    if(fileid === this.files.current_file_id){
      this.onCurrentFileDeleted.emit();
    }  



  }


  // public saveAsBmp() {
  //   var obj: any = {
  //     type: "bmp"
  //   }
  //   console.log(obj);
  // 	this.onSave.emit(obj);
  // }

  // public saveAsAda() {
  //   var obj: any = {
  //     type: "ada"
  //   }
  //   console.log(obj);
  //   this.onSave.emit(obj);
  // }

  // public saveAsWif() {
  //   var obj: any = {
  //     type: "wif"
  //   }
  //   this.onSave.emit(obj);
  // }

  // public saveAsPrint() {
  //   var obj: any = {
  //     type: "jpg"
  //   }
  //   this.onSave.emit(obj);
  // }


  



// openLoginDialog() {
//     const dialogRef = this.dialog.open(LoginComponent, {
//       width: '600px',
//     });
// }

// onNewWorkspace(){
//   this.onClearScreen.emit();
// }




  

}
