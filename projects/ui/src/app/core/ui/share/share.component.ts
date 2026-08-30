import { CdkScrollable } from '@angular/cdk/scrolling';
import { NgOptimizedImage } from '@angular/common';
import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatOption } from '@angular/material/autocomplete';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatDivider } from '@angular/material/divider';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltip } from '@angular/material/tooltip';
import { FileMeta, MediaInstance, SaveObj, ShareObj } from '../../model/datatypes';
import { defaults, licenses } from '../../model/defaults';
import { FileService } from '../../provider/file.service';
import { FirebaseService } from '../../provider/firebase.service';
import { MediaService } from '../../provider/media.service';
import { WorkspaceService } from '../../provider/workspace.service';
import { LoginComponent } from '../login/login.component';
import { UploadFormComponent } from '../uploads/upload-form/upload-form.component';

@Component({
  selector: 'app-share',
  templateUrl: './share.component.html',
  styleUrl: './share.component.scss',
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [MatDialogTitle, NgOptimizedImage, CdkScrollable, MatDialogContent, MatButton, MatTooltip, MatDivider, MatSlideToggle, MatFormField, MatLabel, MatSelect, ReactiveFormsModule, MatOption, MatHint, MatInput, MatCheckbox, UploadFormComponent, MatDialogActions, MatDialogClose]
})
export class ShareComponent {
  fb = inject(FirebaseService);
  private file_serv = inject(FileService);
  private mediaService = inject(MediaService);
  private ws = inject(WorkspaceService);
  private dialog = inject(MatDialog);
  private dialogRef = inject<MatDialogRef<ShareComponent>>(MatDialogRef);
  private data = inject(MAT_DIALOG_DATA);

  private _snackBar = inject(MatSnackBar);

  public shared_id: string = '';
  public share_obj!: ShareObj;

  public defaultCreditline: string = '';
  public license: FormControl = new FormControl('by');
  public filename: FormControl = new FormControl('');
  public desc: FormControl = new FormControl('');
  public owner_creditline: FormControl = new FormControl('');
  public owner_url: FormControl = new FormControl('');
  public public: FormControl = new FormControl(false);
  public share_url!: string;
  public has_uploaded_image: boolean = false;

  public licenses: Array<any> = [];
  public fileid: string;

  public fc!: FormControl;

  public share_in_history!: ShareObj;
  public replace_img: boolean = false;

  workspaceImg: string = '/assets/example_img/placeholder.png';

  constructor() {
    const data = this.data;


    this.fileid = data.fileid;
    this.licenses = licenses;

    // Initialize reactive form with default values
  }

  ngOnInit() {

    this.defaultCreditline = (this.fb.auth.currentUser) ? 'created by ' + this.fb.auth.currentUser.displayName : '';




    // Subscribe to form value changes - updateChange disabled on text files to prevent database writes on keystroke
    this.license.valueChanges.subscribe(() => {
      this.updateChange();
    });


    this.filename.valueChanges.subscribe(() => {
      this.share_obj.filename = this.filename.value;
      //this.updateChange();
    });



    this.desc.valueChanges.subscribe(() => {
      this.share_obj.desc = this.desc.value;
      //this.updateChange();
    });
    this.owner_creditline.valueChanges.subscribe(() => {
      this.share_obj.owner_creditline = this.owner_creditline.value;
      // this.updateChange();
    });
    this.owner_url.valueChanges.subscribe(() => {
      this.share_obj.owner_url = this.owner_url.value;
      // this.updateChange();
    });
    this.public.valueChanges.subscribe(() => {
      this.share_obj.public = this.public.value;
      this.updateChange();
    });

    const default_share_obj: ShareObj = {
      id: -1,
      license: 'by',
      owner_uid: (this.fb.auth.currentUser) ? this.fb.auth.currentUser.uid : 'anon',
      owner_creditline: this.defaultCreditline,
      owner_url: '',
      public: false,
      img: 'none',
      filename: '',
      desc: ''
    }


    this.fb.getShare(+this.fileid)
      .then(share_obj => {
        if (share_obj !== undefined) {
          this.share_obj = share_obj;

          this.shared_id = this.fileid.toString();
          this.updateSettings(share_obj);
          this.share_url = defaults.share_url_base + this.fileid;
        } else {
          this.shared_id = '';
          this.share_obj = default_share_obj;
          this.updateSettings(default_share_obj);
          this.share_url = defaults.share_url_base + this.fileid;
        }
      }).catch(no_obj => {
        console.log("no object", no_obj);
        this.shared_id = '';
        this.share_obj = default_share_obj;
        this.updateSettings(default_share_obj);
        this.share_url = defaults.share_url_base + this.fileid;
      });





  }


  saveFilename() {
    this.updateChange();
    this.filename.markAsPristine();
  }


  saveDesc() {
    this.updateChange();
    this.desc.markAsPristine();
  }

  saveOwnerCreditline() {
    this.updateChange();
    this.owner_creditline.markAsPristine();
  }

  saveOwnerUrl() {
    this.updateChange();
    this.owner_url.markAsPristine();
  }

  ngAfterViewInit() {


  }


  openLoginDialog() {
    const dialogRef = this.dialog.open(LoginComponent, {
      width: '600px',
    });
  }

  /**
   * update the information on the page to match what is stored in the file system
   * @param share_obj 
   */
  updateSettings(share_obj: ShareObj) {
    // Update form values from share_obj

    this.license.setValue(share_obj.license, { emitEvent: false });
    this.filename.setValue(share_obj.filename, { emitEvent: false });
    this.desc.setValue(share_obj.desc, { emitEvent: false });
    this.owner_creditline.setValue(share_obj.owner_creditline, { emitEvent: false });
    this.owner_url.setValue(share_obj.owner_url, { emitEvent: false });
    this.public.setValue(share_obj.public, { emitEvent: false });

    if (share_obj.img !== 'none') {
      this.mediaService.loadImageViaURL(-1, share_obj.img).then(url => {
        this.has_uploaded_image = true;
        this.replace_img = false;
        this.workspaceImg = url;
      });
    }


    //
    //upload the image
    // if (share_obj.img !== 'none') {
    //   this.mediaService.loadImage(-1, share_obj.img).then(media => {
    //     this.has_uploaded_image = true;
    //     if (media.type == 'image') this.drawImage(<SingleImage>media.img)
    //   });
    // }

  }

  updateChange() {

    if (this.share_obj === null) return;


    if (this.shared_id !== '') {
      console.log("updating shared file", this.shared_id, this.share_obj);
      this.fb.updateSharedFile(this.shared_id.toString(), this.share_obj).catch(err => {
        console.error("ERROR", err)
      });
    }
  }

  toggleSharing() {

    if (this.shared_id !== '') {
      this.removeLink();

    } else {
      this.generateLink();
    }


  }

  handleError(event: any) {
    console.log("ERROR", event)
  }

  async generateLink() {

    try {
      let int_id: number = +this.fileid;

      const meta = await this.fb.getFileMeta(int_id);
      const file: { json: string, file: SaveObj } = await this.file_serv.saver.ada();
      const duplicate_id = await this.fb.duplicate(file.file, meta);
      this.share_obj = {
        id: +this.shared_id,
        license: 'by',
        filename: meta.name,
        desc: meta.desc,
        owner_uid: (this.fb.auth.currentUser) ? this.fb.auth.currentUser.uid : 'anon',
        owner_creditline: (this.fb.auth.currentUser) ? 'created by ' + this.fb.auth.currentUser.displayName : '',
        owner_url: '',
        public: false,
        img: 'none'
      }


      this.shared_id = duplicate_id.toString();
      this.updateChange();

      return this.fb.createSharedFile(this.shared_id, this.share_obj);

    }
    catch (err) {
      console.error("ERROR", err)
    }

  }

  removeLink() {
    this.fb.removeSharedFile(this.fileid).catch(err => {
      console.error("ERROR", err)
    });
    this.shared_id = '';
    this.share_obj = {
      id: -1,
      license: 'by',
      filename: '',
      desc: '',
      owner_uid: 'anon',
      owner_creditline: '',
      owner_url: '',
      public: false,
      img: 'none',
    }
    this.updateSettings(this.share_obj);
  }

  replaceImg() {
    this.replace_img = true;
  }

  formatDate(date: number) {
    var dateFormat = new Date(date);
    return dateFormat.toLocaleDateString();
  }

  /**
   * this is called by the upload services "On Data function" which uploads and analyzes the image data in the image and returns it as a image data object
   * @param obj 
   */
  handleFile(obj: MediaInstance) {

    console.log("handle file", obj);

    this.replace_img = false;
    this.has_uploaded_image = true;

    if (obj === null || obj.ref == null) return;

    if (this.share_obj) this.share_obj.img = obj.ref;
    this.updateChange();
    // this.drawImage(obj[0].img.data);


    this.mediaService.loadImageViaURL(-1, this.share_obj?.img ?? '').then(url => {
      this.workspaceImg = url;
    });

    //we don't need to keep this around after the upload
    this.mediaService.removeInstance(obj.id);




  }



  // drawImage(img: SingleImage) {

  //   const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('img_preview');
  //   const ctx = canvas.getContext('2d');

  //   const max_dim = (img.width > img.height) ? img.width : img.height;
  //   const use_width = (img.width > 400) ? img.width / max_dim * 400 : img.width;
  //   const use_height = (img.height > 400) ? img.height / max_dim * 400 : img.height;

  //   canvas.width = use_width;
  //   canvas.height = use_height;



  //   ctx.drawImage(img.image, 0, 0, img.width, img.height, 0, 0, use_width, use_height);


  // }



  updateLink() {
    //create a share option from the settings, have it return the id, post the id to the screen. 

  }

  copyToClipboard() {
    navigator.clipboard.writeText(this.share_url).then(
      () => {
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
