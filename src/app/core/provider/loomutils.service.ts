import { Injectable } from '@angular/core';
import { Cell } from '../model/cell';
import { Drawdown, Interlacement, LoomCoords } from '../model/datatypes';
import { Draft } from '../model/draft';
import utilInstance from '../model/util';
import { WorkspaceService } from './workspace.service';



@Injectable({
  providedIn: 'root'
})
export class LoomutilsService {

  utils:Array<any> = [];


  constructor(public ws: WorkspaceService) { 
    
    const jacquard_utils: LoomUtil = {
      type: 'jacquard', 
      displayname: 'jacquard loom',
      dx: "draft exclusively from drawdown, disregarding any frame and treadle information",
      computeLoomFromDrawdown: (d: Draft) : Promise<Loom>  => {
       return null;
      },
      computerDrawdownFromLoom: (l: Loom) : Promise<Draft> => {
        return null;
      },
      updateThreading: (ndx:Interlacement) => {
        return null;
      },
      updateTieup: (ndx:Interlacement) => {
        return null;
      },
      updateTreadling : (ndx:Interlacement) => {
        return null;
      }

    }

    /**
     * contains the set of functions to be used when working on a direct tieup or dobby loom
     */
    const direct_utils: LoomUtil = {
      type: 'direct', 
      displayname: 'direct-tie or dobby loom',
      dx: "draft from drawdown or threading/tieup/treadling. Assumes you are using a direct tie and mutiple treadle assignments",
      computeLoomFromDrawdown: (d: Draft) : Promise<Loom>  => {
        
        return this.flipPattern(
            d.pattern, 
            (this.ws.selected_origin_option == 0 || this.ws.selected_origin_option == 1), 
            (this.ws.selected_origin_option == 1 || this.ws.selected_origin_option == 2))
          .then(pattern => {

              //now calculate 
              return this.setThreading(d, pattern, 'direct')
              .then(obj => {

              //add treadling
              for(let i = 0; i < pattern.length; i++){
                let active_ts = [];
                let i_pattern = pattern[i].slice();
                i_pattern.forEach((cell, j) => {
                  if(cell.isUp()){
                    const frame_assignment = obj.loom.threading[j];
                    if(frame_assignment !== -1){
                      active_ts.push(frame_assignment);
                    }
                  }
                });
                obj.loom.treadling[i] = utilInstance.filterToUniqueValues(active_ts);
              }

               //add tieup
               obj.loom.tieup = [];
               for(let i = 0; i <= obj.num; i++){
                obj.loom.tieup.push([]);
                 for(let j = 0; j <= obj.num; j++){
                   if(i == j) obj.loom.tieup[i][j] = true;
                   else obj.loom.tieup[i][j] = false;
                 }
               }
 
               //now flip things back based on origin. 
               return obj.loom;

              });

          }).then(loom => {
              return this.flipLoom(loom);              
          });
      },
      computerDrawdownFromLoom: (l: Loom) : Promise<Draft> => {
        return this.flipAndComputeDrawdown(l);
      },
      updateThreading: (ndx:Interlacement, threading: Array<number>) => {
        return null;
      },
      updateTieup: (ndx:Interlacement) => {
        return null;
      },
      updateTreadling : (ndx:Interlacement) => {
        return null;
      }
    }

    /**
     * contains the set of functions to be used when working on a frame loom
     */
    const frame_utils: LoomUtil = {
      type: 'frame', 
      displayname: 'shaft/treadle loom',
      dx: "draft from drawdown or threading/tieup/treadling. Assumes you are assigning treadles to specific frame via tieup",
      computeLoomFromDrawdown: (d: Draft) : Promise<Loom>  => {
        return this.flipPattern(
          d.pattern, 
          (this.ws.selected_origin_option == 0 || this.ws.selected_origin_option == 1), 
          (this.ws.selected_origin_option == 1 || this.ws.selected_origin_option == 2))
        .then(pattern => {
            
            const fns = [
              this.setThreading(d, pattern, 'frame'),
              this.setFrameTreadling(d, pattern, 'frame')
            ];

            return Promise.all(fns)
            .then(res => {
              //computer the tieup here
              const loom: Loom = new Loom(d, 'frame', 2, 2);
              loom.threading = res[0].loom.threading.slice();
              loom.treadling = res[1].loom.treadling.slice();

              loom.tieup = [];
              for(let frames = 0; frames < res[0].num; frames++){
                loom.tieup.push([]);
                for(let treadles = 0; treadles < res[1].num; treadles++){
                  loom.tieup[frames][treadles] = false;
                }
              }

              for(let i = 0; i < loom.treadling.length; i++){
                if(loom.treadling[i].length > 0){
                  const active_treadle_id = loom.treadling[i][0];
                  const row = d.pattern[i];
                  row.forEach((cell, j) => {
                    if(cell.isUp()){
                      const active_frame_id = loom.threading[j];
                      loom.tieup[active_frame_id][active_treadle_id] = true;
                    } 
                  });
                }
              }

              return loom;

            })
          }).then(loom => {
            return this.flipLoom(loom);
          });
      
      },
      computerDrawdownFromLoom: (l: Loom) : Promise<Draft> => {
        return this.flipAndComputeDrawdown(l);
      }
    }

    this.utils.push(
      {name: 'frame', fns: frame_utils},
      {name: 'jacquard', fns: jacquard_utils},
      {name: 'direct', fns: direct_utils}
    );
  }

  /**
   * flips the loom according to the origin and then calls functions to recalculate drawdown
   * @param l a loom to use when computing
   * @returns the computed draft
   */
  flipAndComputeDrawdown(l: Loom) : Promise<Drawdown> {
    return this.flipLoom(l).then(loom => {
      return this.computeDrawdown(loom);
    }).then(draft => {
       return this.flipPattern(
        draft.pattern, 
        (this.ws.selected_origin_option == 0 || this.ws.selected_origin_option == 1), 
        (this.ws.selected_origin_option == 1 || this.ws.selected_origin_option == 2))
        .then(pattern => {
          draft.pattern = pattern.slice();
          return draft;
        })
    });
  }

  
  /**
   * computes the drawdown based on a given loom configuration
   * @param loom 
   * @returns the resulting drawdown
   */
  computeDrawdown(loom: Loom) : Promise<Array<Array<Cell>>> {

    let pattern = [];
    for (var i = 0; i < loom.treadling.length;i++) {
      const active_treadles: Array<number> = loom.treadling[i];
      if (active_treadles.length > 0) {
        active_treadles.forEach((treadle) => {
          for (var j = 0; j < loom.tieup.length; j++) {
            if (loom.tieup[j][treadle]) {
              for (var k = 0; k < loom.threading.length;k++) {
                if (loom.threading[k] == j) {
                  pattern[i][k].setHeddle(true);
                }
              }
            }
          }
        });
      }
    }

    return Promise.resolve(pattern);
  
  }


  /**
  * generates a threading based on the provided drawdown
   * @param drawdown the drawdown to use 
   * @returns an object containing the threading pattern and the number of frames used
   */
  generateThreading(drawdown: Array<Array<Cell>>) : Promise<{threading: Array<number>, num: number}>{
    let frame = 0;
    let threading = [];
    //always assign the origin to one
    threading[0] = 1;

    //progressively add new frames in the order they appear
    for(let j = 1; j < drawdown[0].length; j++){
      const match = utilInstance.hasMatchingColumn(j, drawdown);
      if(match === -1){
        frame++;
        threading[j] = frame;
      }else{
        threading[j] = threading[match];
      }
    }
    return Promise.resolve({threading:threading, num:frame});

  }


  /**
   * This function sets the treadling based on a adjusted pattern (e.g. a pattern that has been flipped based on the users selected origin point)
   * @param pattern the drawdown to use to generate the treadling
   * @returns an object containing the treadling and the total number of treadles used
   */
   generateFrameTreadling(pattern: Array<Array<Cell>>) : Promise<{treadling:Array<Array<number>>, num:number}>{
    let treadle = 0;
    let treadling = [];
    //always assign the origin to one
    treadling[0] = [0];

    //progressively add new frames in the order they appear
    for(let i = 0; i < pattern.length; i++){
      const match = utilInstance.hasMatchingRow(i, pattern);
      if(match === -1){
        treadle++;
        treadling[i] = [treadle];
      }else{
        treadling[i] = treadling[match];
      }
    }
    return Promise.resolve({treadling: treadling, num: treadle});

  }

  /**
   * flips the draft horizontally and/or vertically. Used to flip the draft so that (0,0) is in the top left, no matter which origin point is selected
   * @param d the pattern to flip
   * @param horiz do horizontal flip?
   * @param vert do vertical flip?
   * @returns the flipped pattern
   */
  flipPattern(d: Array<Array<Cell>>, horiz: boolean, vert: boolean) : Promise<Array<Array<Cell>>>{


    const d_flip = [];
    for(let i = 0; i < d.length; i++){
      d_flip.push([]);
      for(let j = 0; j < d[i].length; j++){
        if(horiz && vert) d_flip[i][j] = new Cell(d[d.length -1 - i][d[i].length - 1 - j].getHeddle());
        if(horiz && !vert) d_flip[i][j] = new Cell(d[i][(d[i].length - 1 - j)].getHeddle());
        if(!horiz && vert) d_flip[i][j] = new Cell(d[d.length -1 - i][j].getHeddle());
        if(!horiz && !vert) d_flip[i][j] = new Cell(d[i][j].getHeddle());
      }
    }

    return Promise.resolve(d_flip);

  }

  /**
   * calls the series of functions required to flip the looms to common origin based of user selected origin.
   * @param loom the original loom
   * @returns the flipped loom
   */
  flipLoom(loom:Loom) : Promise<Loom> {
    let fns = [];
    switch(this.ws.selected_origin_option){
      case 0: 
      fns.push(this.flipThreading(loom.threading));
      fns.push(this.flipTieUp(loom.tieup, true, false));
      Promise.all(fns).then(res => {
        loom.threading = res[0];
        loom.tieup = res[1];
        return loom;
      });

      case 1:
      fns.push(this.flipThreading(loom.threading));
      fns.push(this.flipTieUp(loom.tieup, true, true));
      fns.push(this.flipTreadling(loom.treadling));
      Promise.all(fns).then(res => {
        loom.threading = res[0];
        loom.tieup = res[1];
        loom.treadling = res[2]
        return loom;
      }); 
      case 2: 
      fns.push(this.flipTieUp(loom.tieup, false, true));
      fns.push(this.flipTreadling(loom.treadling));
      Promise.all(fns).then(res => {
        loom.tieup = res[0];
        loom.treadling = res[1];
        return loom;
      }); 
      case 3: 
      return Promise.resolve(loom);
    }
}


  /**
   * flips the threading order so that what was leftmost becomes rightmost
   * @param threading 
   * @returns the flipped threading order
   */
  flipThreading(threading: Array<number>) : Promise<Array<number>>{


    const t_flip = [];
    for(let i = 0; i < threading.length; i++){
      t_flip[i] = threading[threading.length -1 - i];
    }
    return Promise.resolve(t_flip);
  }

    /**
   * flips the threading order so that what was leftmost becomes rightmost
   * @param treadling 
   * @returns the flipped threading order
   */
  flipTreadling(treadling: Array<Array<number>>) : Promise<Array<Array<number>>>{

      const t_flip = [];
      for(let i = 0; i < treadling.length; i++){
        t_flip[i] = treadling[treadling.length -1 - i].slice();
      }
      return Promise.resolve(t_flip);
  }

  /**
   * flips the threading order so that what was leftmost becomes rightmost
   * @param treadling 
   * @returns the flipped threading order
   */
  flipTieUp(tieup: Array<Array<boolean>>, horiz: boolean, vert: boolean) : Promise<Array<Array<boolean>>>{

    const t_flip = [];
    for(let i = 0; i < tieup.length; i++){
      t_flip.push([]);
      for(let j = 0; j < tieup[i].length; j++){
        if(horiz && vert) t_flip[i][j] = new Cell(tieup[tieup.length -1 - i][tieup[i].length - 1 - j]);
        if(horiz && !vert) t_flip[i][j] = new Cell(tieup[i][(tieup[i].length - 1 - j)]);
        if(!horiz && vert) t_flip[i][j] = new Cell(tieup[tieup.length -1 - i][j]);
        if(!horiz && !vert) t_flip[i][j] = new Cell(tieup[i][j]);
      }
    }

    return Promise.resolve(t_flip);
}

getUtils(type: 'frame' | 'direct' | 'jacquard' | string) : LoomUtil{

  const obj = this.utils.find(el => el.name === 'type');
  if(obj === undefined) return null;
  return obj.fns;
  
}





}

  
  



  

  






