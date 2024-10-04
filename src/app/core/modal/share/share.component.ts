import { Component, Inject, inject } from '@angular/core';
import { FormBuilder, FormControl } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../provider/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FilesystemService } from '../../provider/filesystem.service';
import { share } from 'rxjs';
import { AuthorContribution, IndexedColorImageInstance, MediaInstance, ShareObj } from '../../model/datatypes';
import { WorkspaceService } from '../../provider/workspace.service';
import { FileService } from '../../provider/file.service';
import { defaults, licenses } from '../../model/defaults';
import { MediaService } from '../../provider/media.service';

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrl: './share.component.scss'
})
export class ShareComponent {
  private _snackBar = inject(MatSnackBar);

  public shared_id: number = -1;
  public share_obj: ShareObj;
  public share_url: string;

  public licenses: Array<any> = [];
  public fileid: string;

  public author_list: Array<AuthorContribution> = [];
  public fc: FormControl;

  constructor( 
    private auth: AuthService, 
    private fs: FilesystemService, 
    private file_serv: FileService,
    private mediaService: MediaService,
    private ws: WorkspaceService,
    private dialogRef: MatDialogRef<ShareComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any){

      this.fileid = data.fileid;
      this.licenses = licenses;


 


      // //check if a link has already been generated for this file. If yes, 
      // //include an update option. 
      this.fs.isShared(this.fileid.toString()).then(share_obj => {
        

        if(share_obj == null){
          //this is not yet shared
          this.share_obj = null;
          
        }else{
          this.share_obj = share_obj;
          this.updateSettings(share_obj.license, share_obj.author_list);
          this.share_url = "https://adacad-4-1.web.app/?share="+this.fileid;
        }
      }).catch(err => {
        console.log("ENTRY NOT FOUND")
      });
     

    }

    ngAfterViewInit(){


    }

    /**
     * update the information on the page to match what is stored in the file system
     * @param license 
     * @param author_list 
     */
    updateSettings(license: string, author_list: Array<AuthorContribution>){
      this.author_list = author_list.slice();
    
    }

    updateChange(){
      console.log("CHANGE - SHARE OBJ ", this.share_obj)
      this.fs.updateSharedFile(this.shared_id.toString(), this.share_obj)
    }

    permissionChange(){
      //update in DB
      // console.log("PERMISSION CHANGED ", this.selected_license)
      // this.fs.updateSharedLicense(this.fileid, this.selected_license);
    }

    toggleSharing(){

      if(this.shared_id !== -1){
        this.removeLink();

      }else{
        this.generateLink();
      }


    }

    generateLink(){


      console.log("GENERATE LINK")

      this.file_serv.saver.ada()
      .then(so => {
        console.log("GOT SAVER OBJ", so)
        //add the current time to the author list entry 
        this.author_list.push({
          uid: (this.auth.isLoggedIn) ? this.auth.uid : 'anon',
          username: (this.auth.isLoggedIn) ? this.auth.username : 'anonymous',
          timestamp: Date.now()
        });

   

        return   this.fs.duplicate(this.auth.uid, this.fs.getCurrentFileName(), this.fs.getCurrentFileDesc(), so.file)
      }).then(new_id => {

        this.shared_id = new_id;
        this.share_obj = {
          license: 'by',
          author_list: this.author_list,
          filename: this.fs.getCurrentFileName(),
          desc: this.fs.getCurrentFileDesc(),
          owner_uid: (this.auth.isLoggedIn) ? this.auth.uid : 'anon',
          owner_creditline: (this.auth.isLoggedIn) ? 'created by '+this.auth.username : '',
          public: false,
          img: 'none'

        }

        return  this.fs.createSharedFile(new_id.toString(), this.share_obj)
      }).then(share_data => {
        console.log("CREATED SHARED FILE ENTRY TO ", share_data)

        this.share_url = "https://adacad-4-1.web.app/?share="+this.shared_id;
      }).catch(err => {
        console.log("ERROR")
      })

    }

    // updateSharedFile(){
    //   //does this share a new link

    //     this.file_serv.saver.ada()
    //     .then(so => {
         
    //       //add the current time to the author list entry 
    //       this.author_list.push({
    //         uid: (this.auth.isLoggedIn) ? this.auth.uid : 'anon',
    //         username: (this.auth.isLoggedIn) ? this.auth.username : 'anonymous',
    //         timestamp: Date.now()
    //       });
  
    //       const share:ShareObj = {
    //         license: this.selected_license,
    //         author_list: this.author_list,
    //         ada: so.file,
    //         filename: this.fs.getCurrentFileName(),
    //         desc: this.fs.getCurrentFileDesc()
    
    //       }
    //       this.fs.updateSharedFile(this.fileid, share)

  
    
    //     }).catch(err => {
    //       console.log("ERROR")
    //     })
  
      
  


    // }

    removeLink(){
      this.fs.removeSharedFile(this.fileid);
      this.author_list = [];
    }

  /**
   * this is called by the upload services "On Data function" which uploads and analyzes the image data in the image and returns it as a image data object
   * @param obj 
   */
  handleFile(obj: MediaInstance){


     if(obj === null || obj[0].data == null) return;
       
     this.share_obj.img = obj[0].ref;
     this.updateChange();
 
  
        const data = obj[0].data;
  
        const canvas: HTMLCanvasElement =  <HTMLCanvasElement> document.getElementById('img_preview');
        const ctx = canvas.getContext('2d');
  
        const max_dim = (data.width > data.height) ? data.width : data.height;
        const use_width = (data.width > 400) ? data.width / max_dim * 400 : data.width;
        const use_height = (data.height > 400) ? data.height / max_dim * 400 : data.height;
  
        canvas.width = use_width;
        canvas.height = use_height;



        ctx.putImageData(data, 0, 0, 0, 0, use_width, use_height);
  
      
  


  }



    updateLink(){
      //create a share option from the settings, have it return the id, post the id to the screen. 

    }

    copyToClipboard(){
      navigator.clipboard.writeText(this.share_url).then(
        ()=> {
           this.openSnackBar('link copied', 'close')//on success
        },
        () => {
          //on fail 
          this.openSnackBar('could not copy link', 'close')//on success

        }
      )

    }

    openSnackBar(message: string, action: string) {
      this._snackBar.open(message, action);
    }
  
  
}
