import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AnalyzedImage, Color } from '../model/datatypes';
import utilInstance from '../model/util';
import { UploadService } from '../provider/upload.service';

@Injectable({
  providedIn: 'root'
})
export class ImageService {

  /**
   * images contains a list of all the images and associated data that is currently loaded into memory
   */
  images: Array<{id: string, data: AnalyzedImage}> = [];


  constructor(private upSvc: UploadService, private httpClient: HttpClient) { }


  /**
   * computes the euclidean distance squared of two color values. 
   * @param a 
   * @param b 
   * @returns 
   */
  distanceFn(a: Color, b: Color) : number {
    return Math.pow(a.r - b.r, 2)+Math.pow(a.g - b.g, 2)+Math.pow(a.b - b.b, 2)
  }

  createProximityMap(colors: Array<Color>) : Array<{a: number, b: number, dist: number}>{

    let prox = [];
    for(let a = 0; a < colors.length; a++){
      for(let b = a+1; b < colors.length; b++){
        prox.push({a, b, dist: this.distanceFn(colors[a], colors[b])})
      }
    }
    return prox;
  }

  createColorMap(colors: Array<Color>, prox: Array<{a: number, b: number, dist: number}>, space: number) : Array<{from: number, to: number}>{

    let color_map = colors.map((color, ndx)=> {return {from: ndx, to: ndx};});
    let prox_copy = prox.slice();
    //we don't care what the size of the color space is, so just return a 1-1 list. 
    if(space == -1 || space > colors.length){
      return color_map;
    }


    //use a greedy method until we get to our number
    // For each number in the color list, find the closest color and return it with the distance to that color
    // Find teh closest distance, and map the "from" and "to" based to. Update any to's of teh from value to the new value. 
    // If there are multiple closests, just keep consuming until we're done. 

    for(let i = 0; i < colors.length - space; i++){

      //get the smallest d-in the set. 
      let min_dist = prox_copy.reduce((acc, val) => {
        if(val.dist < acc.dist) return val;
        return acc;
      }, {a: -1, b: -1, dist: 1000000000});

      color_map.forEach(val => {
        if(val.from == min_dist.a) val.to = min_dist.b;
        else if(val.to == min_dist.a) val.to = min_dist.b;
      });


      prox_copy = prox_copy.filter(el => el.a != min_dist.a && el.b !== min_dist.a)


    }

    return color_map;
 

  }


  loadFiles(ids: Array<string>) : Promise<any> {
    const fns = ids
    .filter(id => id !== '')
    .map(id => this.loadFile(id));
    return Promise.all(fns);
  }


  loadFile(id: string) : Promise<AnalyzedImage>{

    let url = "";
    this.images.push({id: id, data: null});
  
    return this.upSvc.getDownloadData(id).then(obj =>{
      if(obj === undefined) return null;
      url = obj;
      return  this.processImage(obj);
      
    }).then(data => {
      if(data == null){
        var obj: AnalyzedImage = {
          id: id,
          name: 'placeholder',
          data: null,
          colors: [],
          colors_mapping: [],
          proximity_map: [],
          image: null,
          image_map: [],
          width: 0,
          height: 0,
          type: 'image',
          warning: 'image not found'
        }
        return obj;
      } 
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


          all_colors.push({r: r_val, g: g_val, b: b_val, hex: '#'+r+''+g+''+b, black: is_black});



        }

        let filewarning = "";
        let seen_vals = [];
        let unique_count = 0;


        for(let i = 0; i < all_colors.length && unique_count < 100; i++){
          if(seen_vals.find(el => el.hex == all_colors[i].hex) == undefined){
            unique_count++;
            seen_vals.push(all_colors[i]);
          } 
        }

   

        if(unique_count >= 100){
          filewarning = "this image contains more than 100 colors and will take too much time to process, consider indexing to a smaller color space"
          return Promise.reject(filewarning);
        } 

        /**this is expensive, so just do a fast run to make sure the size is okay before we go into this */
        const unique = utilInstance.filterToUniqueValues(seen_vals);
  
 
        let image_map: Array<Array<number>> = [];
        if(unique.length > 100){
          filewarning = "this image contains "+unique.length+" color and will take too much time to process, consider indexing to a smaller color space"
          return Promise.reject(filewarning);
        } 
        else{
          const image_map_flat: Array<number> = all_colors.map(item => unique.findIndex(el => el.hex === item.hex));

          let cur_i = 0;
          let cur_j = 0;
          image_map_flat.forEach((id, ndx)=> {
            cur_i = Math.floor(ndx / imgdata.width);
            cur_j = ndx % imgdata.width;
            
            if(cur_i >= image_map.length) image_map.push([]);
            image_map[cur_i][cur_j] = id;
          });
        }

        const prox = this.createProximityMap(unique);

        const color_map = this.createColorMap(unique, prox, -1);

      
        var obj: AnalyzedImage = {
          id: id,
          name: 'placeholder',
          data: imgdata,
          colors: unique,
          colors_mapping: color_map,
          proximity_map: prox,
          image: image,
          image_map: image_map,
          width: imgdata.width,
          height: imgdata.height,
          type: 'image',
          warning: filewarning
        }

        return obj;
      
      }).then(imageobj => {

        if(imageobj.data == null){
          return Promise.resolve(imageobj);
        }

        return this.upSvc.getDownloadMetaData(id)
        .then(metadata => {
          if(metadata.customMetadata.filename !== undefined) imageobj.name = metadata.customMetadata.filename;
          this.setImageData(id, imageobj);
          return Promise.resolve(imageobj);

        })

      }) ;
  });
  }

  

  getImageData(id: string) : {id: string, data: AnalyzedImage}{
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
