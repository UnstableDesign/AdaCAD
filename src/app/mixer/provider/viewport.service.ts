import { WritePropExpr } from '@angular/compiler';
import { Injectable } from '@angular/core';
import { Bounds, Point } from '../../core/model/datatypes';

@Injectable({
  providedIn: 'root'
})
export class ViewportService {

  /**
   * the total size of scrollable space
   */
  absolute: Bounds;

  /**
   * the bounds of the viewport within that space
   */
  vp: Bounds;

  constructor(){
    this.vp = {
      topleft: {x:0, y:0}, 
      width: 0, 
      height:0
    };

    this.absolute = {
      topleft: {x:0, y:0}, 
      width: 0, 
      height:0
    };

   }

   setAbsolute(w: number, h: number){
    this.absolute.width = w;
    this.absolute.height = h;
   }


  set(x: number, y: number, width: number, height: number){
    this.vp.topleft = {x: x, y:y};
    this.vp.width = width;
    this.vp.height = height;
  }

  setWidth(w: number){
    this.vp.width = w;
  }

  getWidth(): number{
    return this.vp.width;
  }

  getAbsoluteWidth(): number{
    return this.absolute.width;
  }

  setHeight(h: number){
    this.vp.height = h;
  }

  getHeight(): number{
    return this.vp.height;
  }

  getAbsoluteHeight(): number{
    return this.absolute.height;
  }

  getTopLeft(): Point{
    return this.vp.topleft;
  }

  getBounds(): Bounds {
    return this.vp;
  }

  /**
   * this gets the center point of the current viewport
   * @returns 
   */
  getCenterPoint(): Point{
    const center: Point = {
      x: this.vp.topleft.x + this.vp.width/2,
      y: this.vp.topleft.y + this.vp.height/2
    }
    return center;
  }

  /**
  * set the viewport in the center of the screen
  * @returns the point for referencing
   */
  setViewportCenter(): Point{

    const abs_topleft: Point = {
      x: this.absolute.width/2 - this.vp.width/2,
      y: this.absolute.height/2 - this.vp.height/2
    }

    this.vp.topleft = abs_topleft;
    return abs_topleft;

  }

  



}
