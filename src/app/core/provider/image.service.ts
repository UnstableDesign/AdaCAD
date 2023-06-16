import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AnalyzedImage } from '../model/datatypes';
import utilInstance from '../model/util';
import { UploadService } from '../provider/upload.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  images: Array<{id: string, data: any}> = [];


  constructor(private upSvc: UploadService, private httpClient: HttpClient) { }


  loadFiles(ids: Array<string>) : Promise<any> {
    const fns = ids
    .filter(id => id !== '')
    .map(id => this.loadFile(id));
    return Promise.all(fns);
  }


  loadFile(id: string) : Promise<AnalyzedImage>{

    let url = "";
    this.images.push({id: id, data: null});
  
    
    //const data = ids.map(id => this.upSvc.getDownloadData(id));
    return this.upSvc.getDownloadData(id).then(obj =>{
        if(obj === '') return Promise.resolve(null)
        url = obj;
        return  this.processImage(obj);
      
    }).then(data => {
      if(data == null) return Promise.reject('nulldata');
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var image = new Image();
      image.src = url;
      image.crossOrigin = "Anonymous";

      return image.decode().then(() => {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight; 

        if(image.naturalWidth > 10000) Promise.reject('width error');
        if(image.naturalHeight > 10000) Promise.reject('height error');

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        var imgdata = ctx.getImageData(0,0, canvas.width, canvas.height);

        const pixels = imgdata.data;

        //process the pixels into meaningful values;
        const all_colors: Array<any> = [];
        for(let i = 0; i < pixels.length; i+= 4){

          let r: string= pixels[i].toString(16);
          let r_val: number = pixels[i];
      
          if(r.length == 1) r = '0'+r;

          let g:string = pixels[i+1].toString(16);
          let g_val: number = pixels[i+1];
          if(g.length == 1) g = '0'+g;

          let b:string = pixels[i+2].toString(16);
          let b_val: number = pixels[i+2];

          if(b.length == 1) b = '0'+b;

          const is_black:boolean = ((r_val + g_val + b_val/3) < (255/2))
          const o = pixels[i+3].toString(16);


          all_colors.push({hex: '#'+r+''+g+''+b, black: is_black});

        }

        const just_hex = all_colors.map(el => el.hex);
        let filewarning = "";

        let seen_vals = [];
        let unique_count = 0;
        for(let i = 0; i < just_hex.length && unique_count < 100; i++){
          if(seen_vals.find(el => el == just_hex[i]) == undefined){
            unique_count++;
            seen_vals.push(just_hex[i]);
          } 
        }


        if(unique_count >= 100){
          filewarning = "this image contains more than 100 colors and will take too much time to process, consider indexing to a smaller color space"
          return Promise.reject(filewarning);
        } 


        

     


        /**this is expensive, so just do a fast run to make sure the size is okay before we go into this */
        const unique = utilInstance.filterToUniqueValues(just_hex);

        const color_to_bw = unique.map(el => {
          const item = all_colors.find(ell => ell.hex == el);
          if(item !== undefined) return item
        })

 
        let image_map: Array<Array<number>> = [];
        if(unique.length > 100){
          filewarning = "this image contains "+unique.length+" color and will take too much time to process, consider indexing to a smaller color space"
          return Promise.reject(filewarning);
        } 
        else{
          const image_map_flat: Array<number> = all_colors.map(item => unique.findIndex(el => el === item.hex));

          let cur_i = 0;
          let cur_j = 0;
          image_map_flat.forEach((id, ndx)=> {
            cur_i = Math.floor(ndx / imgdata.width);
            cur_j = ndx % imgdata.width;
            
            if(cur_i >= image_map.length) image_map.push([]);
            image_map[cur_i][cur_j] = id;
          });
        }
      
        var obj: AnalyzedImage = {
          id: id,
          name: 'placeholder',
          data: imgdata,
          colors: unique,
          colors_to_bw: color_to_bw,
          image: image,
          image_map: image_map,
          width: imgdata.width,
          height: imgdata.height,
          type: 'image',
          warning: filewarning
        }

        return obj;
      
      }).then(imageobj => {

        return this.upSvc.getDownloadMetaData(id).then(metadata => {
          if(metadata.customMetadata.filename !== undefined) imageobj.name = metadata.customMetadata.filename;
          this.setImageData(id, imageobj);
          return Promise.resolve(imageobj);

        })

      }) ;
  });
  }

  

  getImageData(id: string){
    return this.images.find(el => el.id === id);
  }

  setImageData(id: string, data: any){
    const entry = this.getImageData(id);
    entry.data = data;
  }


  async processImage(url) : Promise<any> {
    return  await this.httpClient.get(url, {responseType: 'blob'}).toPromise();
  }
}
