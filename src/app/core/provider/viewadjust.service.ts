import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ViewadjustService {

  left: number = 1000;
  right: number = 1000;




  constructor() { 

    this.right = window.innerWidth - this.left;

  }

  updateFromWindowResize(innerwidth: number){
    const pcent = this.left / (this.left + this.right);
    const new_left = innerwidth * pcent;
    this.updatePosition(new_left);
  }


  updatePosition(x: number){
    this.left = x;
    this.right = window.innerWidth - this.left;
  }

  



}
