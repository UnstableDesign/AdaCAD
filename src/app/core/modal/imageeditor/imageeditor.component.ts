import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AnalyzedImage, Color } from '../../model/datatypes';
import { TreeService } from '../../provider/tree.service';
import { ImageService } from '../../provider/image.service';
import utilInstance from '../../model/util';

@Component({
  selector: 'app-imageeditor',
  standalone: false,
  templateUrl: './imageeditor.component.html',
  styleUrl: './imageeditor.component.scss'
})
export class ImageeditorComponent {

  img: AnalyzedImage;
  color_table: Array<{from: number, from_hex:string, to:number, to_hex: string}>;
  resulting_color_space: Array<{from: number, from_hex:string, to:number, to_hex: string}>;

  constructor(
    public tree: TreeService,
    public imageService: ImageService,
    private dialog: MatDialog,
    public dialogRef: MatDialogRef<ImageeditorComponent>,
    @Inject(MAT_DIALOG_DATA) public obj: any){

      this.img = obj;
      this.parseColorTable(this.img.colors, this.img.colors_mapping);
      this.updateColormapping(this.img.colors, this.img.colors_mapping);
      
  }

  ngAfterViewInit(){
    this.drawImagePreview();


    console.log("INIT ")
    console.log(this.color_table)
    console.log(this.resulting_color_space)


  }

  /**
   * create a new version of the color table suited for rendering 
   * @param colors 
   * @param mapping 
   */
  parseColorTable(colors: Array<Color>, mapping: Array<{from: number, to: number}>){

    this.color_table = [];
    mapping.forEach(el => {
      this.color_table.push({
        from: el.from, 
        from_hex: colors[el.from].hex, 
        to: el.to, 
        to_hex: colors[el.to].hex}
      )
    })

  }

  /**
   * after any mapping is made, update which options are visible in the mapped region
   */
  updateColormapping(colors: Array<Color>,mapping: Array<{from: number, to: number}>){
    const unique_colors:Array<number> = utilInstance.filterToUniqueValues(mapping.map(el => el.to));

    this.resulting_color_space = [];
    console.log("UNIQUE COLORS ", unique_colors)
    unique_colors.forEach(el => {
      let map_entry = mapping.find(meel => meel.to == el)


      this.resulting_color_space.push({
        from: map_entry.from, 
        from_hex: colors[map_entry.from].hex, 
        to: map_entry.to, 
        to_hex: colors[map_entry.to].hex}
      )
    })
  }

  mappingChanged(src: number, $event){
    console.log("EVENT", src, $event)
    let el = this.img.colors_mapping.find(el => el.from == src);
    if(el == undefined) return;
    el.to = $event.value;
    this.updateColormapping(this.img.colors, this.img.colors_mapping)
  }


  drawImagePreview(){


      const canvas: HTMLCanvasElement =  <HTMLCanvasElement> document.getElementById('preview_canvas');
      const ctx = canvas.getContext('2d');

    

      canvas.width = this.img.width;
      canvas.height = this.img.height;


      ctx.drawImage(this.img.image, 0, 0, this.img.width, this.img.height);
  

    

  }

}
