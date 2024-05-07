import { Component, EventEmitter, Inject, OnInit, Optional, Output,ViewEncapsulation } from '@angular/core';
import { AuthService } from '../../provider/auth.service';
import { FilesystemService } from '../../provider/filesystem.service';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { WorkspaceService } from '../../provider/workspace.service';
import { FileService } from '../../provider/file.service';

@Component({
  selector: 'app-filebrowser',
  templateUrl: './filebrowser.component.html',
  styleUrls: ['./filebrowser.component.scss'],
  encapsulation: ViewEncapsulation.None,

})
export class FilebrowserComponent implements OnInit {

  @Output() onLoadFromDB: any = new EventEmitter();
  @Output() onCreateFile: any = new EventEmitter();

  
  unopened_filelist = [];
  file_list = [];



  rename_mode_id = -1;
  rename_file_name ="";


  constructor(
    public files: FilesystemService, 
    public auth: AuthService,
    public ws: WorkspaceService,
    public fs: FileService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
    ) { 
    

      this.updateFileData(this.files.file_tree)

      this.files.file_tree_change$.subscribe(data => {
        this.updateFileData(data);});



        this.files.loaded_file_change$.subscribe(data => {
          this.updateFileData(data)
        });




  
   

  }

  ngOnInit(): void {
    
    
    
  }

  createBlankFile(){
    this.onCreateFile.emit();
  }

  formatDate(date: number){
    var dateFormat = new Date(date);
    return dateFormat.toLocaleTimeString();
  }

  updateFileData(data: Array<any>){
    this.unopened_filelist = [];
    this.file_list = [];
    data.forEach(file => {
      this.file_list.push(file);
      if(this.files.loaded_files.find(el => el.id == file.id) == undefined){
        this.unopened_filelist.push(file);
      }
    })
  }


  openFile(id: number){
    this.onLoadFromDB.emit(id);
  }

  duplicate(){
    
  }


  close(id: number){
    let item = this.files.getLoadedFile(id);
    if(item == null) return;
    this.files.unloadFile(id)
  }


  rename(id: number){
    let file_to_rename = this.file_list.find(el => el.id == id);

      if(file_to_rename !== undefined){

        if(this.rename_mode_id !== -1){

        this.files.renameFile(file_to_rename.id, this.rename_file_name);
        this.rename_mode_id = -1;
        this.rename_file_name = '';

        }else{
          this.rename_file_name = file_to_rename.meta.name;
          this.rename_mode_id = id;
        }
      }
  }

  remove(fileid: number){
    this.files.removeFile(fileid);
  }

    /**
   * this is called when a user pushes save from the topbar
   * @param event 
   */
  public  exportWorkspace(id: number){

    const link = document.createElement('a')

      let loaded = this.files.getLoadedFile(id);
      if(loaded !== null){
        var theJSON = JSON.stringify(loaded.ada);
        link.href = "data:application/json;charset=UTF-8," + encodeURIComponent(theJSON);
        link.download =  loaded.name + ".ada";
        link.click();
      }else{
        let fns = [ this.files.getFile(id), this.files.getFileMeta(id)];
        Promise.all(fns)
        .then(res => {
          var theJSON = JSON.stringify(res[0]);
          link.href = "data:application/json;charset=UTF-8," + encodeURIComponent(theJSON);
          link.download =  res[1].name + ".ada";
          link.click();
        }).catch(err => {console.error(err)});

      }


  
  
    }
  

  

}
