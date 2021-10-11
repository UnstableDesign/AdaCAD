import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})

/**
 * for each mixer, you can define defaults for the loom
 */
export class GloballoomService {

  min_frames: number = 8; 
  min_treadles: number = 10;
  type: string = 'frame';

  constructor() { }
}
