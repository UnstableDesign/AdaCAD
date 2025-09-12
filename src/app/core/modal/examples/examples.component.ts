import { CdkDrag, CdkDragHandle } from '@angular/cdk/drag-drop';
import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, EventEmitter, OnDestroy, Output, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardActions, MatCardContent, MatCardHeader, MatCardSubtitle, MatCardTitle } from '@angular/material/card';
import { MatDialog, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogRef, MatDialogTitle } from '@angular/material/dialog';
import { MatTab, MatTabGroup } from '@angular/material/tabs';
import { SingleImage } from 'adacad-drafting-lib';
import { Subscription } from 'rxjs';
import { ShareObj } from '../../model/datatypes';
import { ExampleserviceService } from '../../provider/exampleservice.service';
import { FirebaseService } from '../../provider/firebase.service';
import { MediaService } from '../../provider/media.service';

@Component({
  selector: 'app-examples',
  templateUrl: './examples.component.html',
  styleUrls: ['./examples.component.scss'],
  imports: [MatDialogTitle, CdkDrag, CdkDragHandle, CdkScrollable, MatDialogContent, MatTabGroup, MatTab, MatCard, MatCardContent, MatCardHeader, MatCardTitle, MatCardSubtitle, MatCardActions, MatButton, MatDialogActions, MatDialogClose]
})
export class ExamplesComponent implements OnDestroy {
  fb = inject(FirebaseService);
  examples = inject(ExampleserviceService);
  private ms = inject(MediaService);
  private dialog = inject(MatDialog);
  dialogRef = inject<MatDialogRef<ExamplesComponent>>(MatDialogRef);

  @Output() onLoadExample = new EventEmitter<any>();
  @Output() onLoadSharedFile = new EventEmitter<any>();
  @Output() onOpenFileManager = new EventEmitter<any>();
  local_examples: any;

  sharedFileSubscription: Subscription;
  community_examples: Array<ShareObj>;


  constructor() {
    const examples = this.examples;

    this.local_examples = examples.getExamples();

    this.sharedFileSubscription = this.fb.sharedFilesChangeEvent$.subscribe(files => {
      this.community_examples = files.public.slice();

      this.community_examples.filter(res => res.img !== 'none').forEach(res => {
        this.ms.loadImage(-1, res.img).then(media => {
          if (media.type = 'image') this.drawImage(res.id, <SingleImage>media.img)
        });
      });
    })


  }

  ngOnDestroy(): void {
    this.sharedFileSubscription.unsubscribe();
  }

  openFileManager() {

    this.onOpenFileManager.emit();
  }

  loadExample(filename: string) {

    this.onLoadExample.emit(filename);
    this.dialogRef.close();
  }

  loadSharedFile(filename: string) {

    this.onLoadSharedFile.emit(filename);
    this.dialogRef.close();
  }








  drawImage(id: number, img: SingleImage) {



    const canvas: HTMLCanvasElement = <HTMLCanvasElement>document.getElementById('img_preview' + id);
    const ctx = canvas.getContext('2d');

    const max_dim = (img.width > img.height) ? img.width : img.height;
    const use_width = (img.width > 400) ? img.width / max_dim * 400 : img.width;
    const use_height = (img.height > 400) ? img.height / max_dim * 400 : img.height;

    canvas.width = use_width;
    canvas.height = use_height;



    ctx.drawImage(img.image, 0, 0, img.width, img.height, 0, 0, use_width, use_height);

  }


}

