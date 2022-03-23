import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import utilInstance from '../model/util';
import { UploadService } from '../uploads/upload.service';
import { Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  images: Array<{id: string, data: any}> = [];


  constructor(private upSvc: UploadService, private httpClient: HttpClient) { }


  loadFiles(ids: Array<string>) : Promise<any> {
    const fns = ids.map(id => this.loadFile(id));
    return Promise.all(fns);
  }


  loadFile(id: string) : Promise<any>{

    
    let url = "";
    this.images.push({id: id, data: null});
  
    
    //const data = ids.map(id => this.upSvc.getDownloadData(id));
    return this.upSvc.getDownloadData(id).then(obj =>{
        url = obj;
        return  this.processImage(obj);
      
    }).then(data => {
  
      var canvas = document.createElement('canvas');
      var ctx = canvas.getContext('2d');
      var image = new Image();
      image.src = url;
      image.crossOrigin = "Anonymous";

      return image.decode().then(() => {
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight; 
            
        // ctx.mozImageSmoothingEnabled = false;
        // ctx.webkitImageSmoothingEnabled = false;
        // ctx.msImageSmoothingEnabled = false;
        // ctx.imageSmoothingEnabled = false;

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

        var imgdata = ctx.getImageData(0,0, canvas.width, canvas.height);

        const pixels = imgdata.data;

        //process the pixels into meaningful values;
        const all_colors: Array<any> = [];
        for(let i = 0; i < pixels.length; i+= 4){

          let r: string= pixels[i].toString(16);
          if(r.length == 1) r = '0'+r;

          let g:string = pixels[i+1].toString(16);
          if(g.length == 1) g = '0'+g;

          let b:string = pixels[i+2].toString(16);
          if(b.length == 1) b = '0'+b;

          const o = pixels[i+3].toString(16);
          all_colors.push('#'+r+''+g+''+b);
        }


        const unique = utilInstance.filterToUniqueValues(all_colors);
        
        let filewarning = "";
        let image_map: Array<Array<number>> = [];
        if(unique.length > 100) filewarning = "this image contains "+unique.length+" color and will take too much time to process, consider indexing to a smaller color space"
        else{
          const image_map_flat: Array<number> = all_colors.map(color => unique.findIndex(el => el === color));

          let cur_i = 0;
          let cur_j = 0;
          image_map_flat.forEach((id, ndx)=> {
            cur_i = Math.floor(ndx / imgdata.width);
            cur_j = ndx % imgdata.width;
            
            if(cur_i >= image_map.length) image_map.push([]);
            image_map[cur_i][cur_j] = id;
          });
        }
      
        var obj = {
          id: id,
          name: id,
          data: imgdata,
          colors: unique,
          image: image,
          image_map: image_map,
          width: imgdata.width,
          height: imgdata.height,
          type: 'image',
          warning: filewarning
        }

        this.setImageData(id, obj);
        return Promise.resolve(obj);
      
      });
  });
  }

  

  getImageData(id: string){
    console.log("images", id, this.images)
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
