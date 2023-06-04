import { Component, EventEmitter, OnInit, Optional, Output } from '@angular/core';
import { AuthService } from '../provider/auth.service';
import { FilesystemService } from '../provider/filesystem.service';
import { MatDialog } from '@angular/material/dialog';
import { LoginComponent } from '../login/login.component';
import { InitModal } from '../modal/init/init.modal';
import { WorkspaceService } from '../provider/workspace.service';
import { UploadFormComponent } from '../uploads/upload-form/upload-form.component';
import { LoadfileComponent } from '../modal/loadfile/loadfile.component';


@Component({
  selector: 'app-filebrowser',
  templateUrl: './filebrowser.component.html',
  styleUrls: ['./filebrowser.component.scss']
})
export class FilebrowserComponent implements OnInit {

  @Output() onLoadNewFile: any = new EventEmitter();
  @Output() onClearScreen: any = new EventEmitter();
  @Output() onCurrentFileDeleted: any = new EventEmitter();
  @Output() onSave: any = new EventEmitter();
  @Output() onLoadFromDB: any = new EventEmitter();
  @Output() onLoadDrafts: any = new EventEmitter();

  
  isLoggedIn = false;
  filelist = [];
  rename_mode = false;

  constructor(
    public files: FilesystemService, 
    public auth: AuthService,
    public ws: WorkspaceService,
    private dialog: MatDialog) { 
    
  
    this.filelist = this.files.file_tree;

    this.files.file_tree_change$.subscribe(data => {
      
      this.updateFileData(data);
    }
    );


  
   

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
      this.rename_mode = false;
    }else{
      this.rename_mode = true;
    } 

  }

  remove(fileid: number){
    console.log("removing ", fileid)
    this.files.removeFile(fileid);
    if(fileid === this.files.current_file_id){
      this.onCurrentFileDeleted.emit();
    }  



  }


  public saveAsBmp() {
    var obj: any = {
      type: "bmp"
    }
    console.log(obj);
  	this.onSave.emit(obj);
  }

  public saveAsAda() {
    var obj: any = {
      type: "ada"
    }
    console.log(obj);
    this.onSave.emit(obj);
  }

  public saveAsWif() {
    var obj: any = {
      type: "wif"
    }
    this.onSave.emit(obj);
  }

  public saveAsPrint() {
    var obj: any = {
      type: "jpg"
    }
    this.onSave.emit(obj);
  }


   //need to handle this and load the file somehow
   openNewFileDialog() {


    const dialogRef = this.dialog.open(LoadfileComponent, {
      data: {
        multiple: false,
        accepts: '.ada',
        type: 'ada'
      }
    });

    dialogRef.afterClosed().subscribe(loadResponse => {
      if(loadResponse !== undefined) this.onLoadNewFile.emit(loadResponse);

   });
  }


     //need to handle this and load the file somehow
     openBitmaps() {


      const dialogRef = this.dialog.open(LoadfileComponent, {
        data: {
          multiple: true,
          accepts: '.jpg,.bmp,.png',
          type: 'bitmap_collection'
        }
      });
  
      dialogRef.afterClosed().subscribe(drafts => {
        if(drafts !== undefined){
          this.onLoadDrafts.emit(drafts);

        } 
        
     });
    }
  

openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '600px',
    });
}

onNewWorkspace(){
  this.onClearScreen.emit();
}




  

}
