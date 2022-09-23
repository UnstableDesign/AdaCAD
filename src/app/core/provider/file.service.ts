import { Injectable } from '@angular/core';
import {TreeService } from '../../mixer/provider/tree.service';
import { Cell } from '../model/cell';
import { Draft, DraftNodeProxy, Fileloader, FileObj, FileSaver, LoadResponse, Loom, OpComponentProxy, StatusMessage, TreeNodeProxy, NodeComponentProxy, LoomSettings, SaveObj, DraftNode } from '../model/datatypes';
import utilInstance from '../model/util';
import { MaterialMap, MaterialsService } from './materials.service';
import { SystemsService } from './systems.service';
import { Note, NotesService } from './notes.service';
import { VersionService } from './version.service';
import { createDraft, initDraft, initDraftWithParams, loadDraftFromFile } from '../model/drafts';
import { getLoomUtilByType, loadLoomFromFile } from '../model/looms';
import { WorkspaceService } from './workspace.service';
import * as _ from 'lodash';
import { I } from '@angular/cdk/keycodes';




/**
 * this service handles the processing of data from an uplaoded file. 
 * It is called from the InitModal when the user uploads data. 
 * The principle sholud be that you can load any .ada file into 
 * mixer or weaver, no matter what. 
 */

@Injectable({
  providedIn: 'root'
})
export class FileService {


  status: Array<StatusMessage> = [];
  loader: Fileloader = null;
  saver: FileSaver = null;

  constructor(
    private tree: TreeService, 
    private ns: NotesService,
    private ms: MaterialsService,
    private ss: SystemsService,
    private vs: VersionService,
    private ws: WorkspaceService) { 
  
  this.status = [
    {id: 0, message: 'success', success: true},
    {id: 1, message: 'incompatable type', success: false}
  ];


  /**
   * file loader loads files of different types, 
   * for .adaFiles, it gets the data listed in SaveObj and begins to process it
   */
  const dloader: Fileloader = {

     ada: async (filename: string, data: any) : Promise<LoadResponse> => {
      console.log("DATA IN", _.cloneDeep(data))

      let draft_nodes: Array<DraftNodeProxy> = [];
      //let looms: Array<Loom> = [];
      let ops: Array<OpComponentProxy> = [];
      let version = "0.0.0";
      
      this.clearAll();

     
      if(data.version !== undefined) version = data.version;

      if(data.workspace !== undefined){
        this.ws.loadWorkspace(data.workspace);
      }else{
        this.ws.initDefaultWorkspace();
      }

      if(data.shuttles !== undefined){
        this.ms.overloadShuttles(data.shuttles);

      }else{
        if(data.materials !== undefined){
          this.ms.overloadShuttles(data.materials); 
        }
      }

      if(data.notes !== undefined) this.ns.reloadNotes(data.notes);


      const flips_required = utilInstance.getFlips(this.ws.selected_origin_option, 3);
    
      const loom_elements = []
      const loom_fns = []
      const draft_elements = [];
      const draft_fns = [];

      if(utilInstance.sameOrNewerVersion(version, '3.4.5')){
        draft_nodes = data.draft_nodes;
        if(draft_nodes == undefined) draft_nodes = [];

        if(draft_nodes !== undefined){
          draft_nodes.forEach(el => {
            if(el.draft !== null && el.draft !== undefined){
              draft_fns.push(loadDraftFromFile(el.draft, flips_required, version));
              draft_elements.push(el);
            }

            if(el.loom !== null && el.loom !== undefined){
              loom_fns.push(loadLoomFromFile(el.loom, flips_required, version));
              loom_elements.push(el);
            }
        
          });
       }
        
      }else{

        //handle old file types that didn't separate out drafts
        if(data.drafts === undefined) data.drafts = [data];
      

        data.nodes
        .filter(el => el.type === 'draft')
        .forEach(async node => {
          const loom = data.looms.find(loom => loom.draft_id === node.node_id);
          const draft = data.drafts.find(draft => draft.id === node.node_id);


          const dn: DraftNodeProxy = {
            node_id: (node === undefined) ? -1 : node.node_id,
            draft_id: node.node_id,
            draft_name: node.draft_name,
            draft:null,
            draft_visible: (node === undefined) ? true : node.draft_visible,
            loom:null,
            loom_settings: (loom === undefined) 
              ? {type: this.ws.type, epi: this.ws.epi, units: this.ws.units, frames: this.ws.min_frames, treadles: this.ws.min_treadles } 
              : {type: loom.type, epi: loom.epi, units: loom.units, frames: loom.min_frames, treadles: loom.min_treadles}
          }
          draft_nodes.push(dn);

          if(draft !== null && draft !== undefined){
            draft_fns.push(loadDraftFromFile(draft, flips_required, version));
            draft_elements.push(dn);
          }

          if(loom !== null && loom !== undefined){
            loom_fns.push(loadLoomFromFile(loom, flips_required, version));
            loom_elements.push(dn);
          }

        });

        //in previous versions drafts and looms were loaded separately
      }

      return Promise.all(draft_fns)
      .then( res => {

          for(let i = 0; i < draft_elements.length; i++){
            draft_elements[i].draft = res[i];
          }

      return Promise.all(loom_fns)
      })
      .then(res => {

        for(let i = 0; i < loom_elements.length; i++){
          draft_elements[i].loom = res[i];
        }
        
        draft_nodes
        .filter(el => el.draft !== null)
        .forEach(el => {
          //scan the systems and add any that need to be added
          if(el.draft !== null && el.draft !== undefined && el.draft.rowSystemMapping !== undefined){
            el.draft.rowSystemMapping.forEach(el => {
              if(this.ss.getWeftSystem(el) === undefined) this.ss.addWeftSystemFromId(el);
            });
          }  
  
          //scan the systems and add any that need to be added
          if(el.draft !== null && el.draft !== undefined && el.draft.colSystemMapping !== undefined){
            el.draft.colSystemMapping.forEach(el => {
              if(this.ss.getWarpSystem(el) === undefined) this.ss.addWarpSystemFromId(el);
            });
          }  
        })
      
    
        if(data.ops !== undefined){
          ops = data.ops.map(data => {
            const op: OpComponentProxy = {
              node_id: data.node_id,
              name: data.name,
              params: data.params,
              inlets: (data.inlets === undefined) ? [0] : data.inlets 
            }
            return op;
          });
        }
        
          const envt: FileObj = {
            version: data.version,
            workspace: data.workspace,
            filename: filename,
            nodes: (data.nodes === undefined) ? [] : data.nodes,
            treenodes: (data.tree === undefined) ? [] : data.tree,
            draft_nodes: draft_nodes,
            ops: ops,
            scale: (data.scale === undefined) ? 5 : data.scale,
          }
    
          return Promise.resolve({data: envt, status: 0}); 
  
        }
      )



    

    }, 

    // wif: async (filename: string, data: any) : Promise<LoadResponse> => {
    //   this.clearAll();


    //   let drafts: Array<Draft> = [];
    //   let looms: Array<Loom> = [];
    //   let version = '0.0.0';
     
    //   var stringWithoutMetadata = utilInstance.getSubstringAfter("CONTENTS", data);
    //   const warps:number = utilInstance.getInt("Threads",utilInstance.getSubstringAfter("WARP]",stringWithoutMetadata));
    //   const wefts:number = utilInstance.getInt("Threads",utilInstance.getSubstringAfter("WEFT]",stringWithoutMetadata));
    //   const pattern: Array<Array<Cell>> = [];
      
    //   this.ns.resetNotes(); 

    //   for (var i = 0; i < wefts; i++) {
    //     pattern.push([]);
    //     for (var j = 0; j < warps; j++) {
    //       pattern[i].push(new Cell(null));
    //       pattern[i][j].setHeddle(false);
    //     }
    //   }

    //   const draft = initDraft();
    //   draft.drawdown = generateDrawdownWithPattern(pattern, warps, wefts);
    //   drafts.push(draft);
    //   draft.gen_name = data.name;

    // let frames = utilInstance.getInt("Shafts", data);
    // let treadles = utilInstance.getInt("Treadles", data);
    
    // const loom:Loom = new Loom(draft, 'frame', frames, treadles);
    // looms.push(loom);

    // // draft.loom.tieup = []

    // // for (var i = 0; i < frames; i++) {
    // //   draft.loom.tieup.push([]);
    // //   for (var j = 0; j < treadles; j++) {
    // //     draft.loom.tieup[i].push(false);
    // //   }
    // // }

    // if (utilInstance.getBool("TREADLING", stringWithoutMetadata)) {
    //   var treadling = utilInstance.getTreadling(stringWithoutMetadata, draft);
    //   loom.overloadTreadling(treadling, version, pattern.length);
    // }
    // if (utilInstance.getBool("THREADING", stringWithoutMetadata)) {
    //   var threading = utilInstance.getThreading(stringWithoutMetadata, draft);
    //   loom.overloadThreading(threading);
    // }
    // if (utilInstance.getBool("TIEUP", data)) {
    //   var tieups = utilInstance.getTieups(stringWithoutMetadata, draft);
    //   loom.overloadTieup(tieups);

    // }
    // if (utilInstance.getBool("COLOR TABLE",data)) {
    //   if (utilInstance.getString("Form", data) === "RGB") {
    //     let color_table: Array<Shuttle>  = utilInstance.getColorTable(data);
    //     var shuttles = color_table;

    //     /** TODO: Update this to add, not overwrite, shuttles */
    //     this.ms.overloadShuttles(shuttles);
    //     draft.overloadRowShuttleMapping(utilInstance.getRowToShuttleMapping(data, draft));
    //     draft.overloadColShuttleMapping(utilInstance.getColToShuttleMapping(data, draft));
    //   }
    // }

    // draft.recalculateDraft(tieups, treadling, threading);


    // const proxies = this.tree.getNewDraftProxies(draft, []);

    
    // const f: FileObj = {
    //   version: 'na',
    //   filename: filename,
    //   drafts: drafts,
    //   looms: looms,
    //   nodes: [proxies.node], 
    //   treenodes: [proxies.treenode],
    //   ops: [],
    //   scale: 5
    // }


    // return Promise.resolve({data: f ,status: 0});
    // },
    /**
     * takes in a jpg, creates as many drafts as there are unique colors in the image. 
     * @param data 
     * @returns 
     */
    // jpg: async (filename: string, data: any) : Promise<LoadResponse> => {
    //   this.clearAll();

    //   let drafts: Array<Draft> = [];
    //   let looms: Array<Loom> = [];
    //   this.ns.resetNotes(); 

    //   let e = data;
    //   const warps = e.width;
    //   const wefts = e.height;
  
    //   var img = e.data;

    //   let hex_string: string = "";
    //   const img_as_hex: Array<string> = [];
    //   img.forEach((el, ndx) => {
    //     hex_string = hex_string + el.toString(16);
    //     if(ndx % 4 === 3){
    //       img_as_hex.push(hex_string);
    //       hex_string = "";
    //     }

    //   });


    //   //the color table is a unique list of all the colors in this image
    //   const seen: Array<string> = [];
    //   const color_table: Array<string> = img_as_hex.filter((el, ndx) => {
    //     if(seen.find(seen => seen === el) === undefined){
    //       seen.push(el);
    //       return true;
    //     }
    //   });
    //   console.log("color table", color_table);


    //   //create a draft for each color table
    //   color_table.forEach(color => {
    //     const draft = initDraft();
    //     draft.drawdown = generateDrawdownWithPattern([[new Cell(false)]], warps, wefts);
    //     console.log(draft);
    //     img_as_hex.forEach((el, ndx)=>{
    //       const r: number = Math.floor(ndx/warps);
    //       const c: number = ndx % warps;
    //       if(el === color) draft.drawdown[r][c].setHeddleUp();
    //       else draft.drawdown[r][c].unsetHeddle();
    //     });
    //     drafts.push(draft);
    //     const loom:Loom = new Loom(draft, 'jacquard', 8, 10);
    //     looms.push(loom);
    //   })



  
    //   // for (var i=0; i< e.height; i++) {
    //   //   pattern.push([]);
    //   //   for (var j=0; j< e.width; j++) {
    //   //     var idx = (i * 4 * warps) + (j * 4);
    //   //     var threshold = (img[idx] + img[idx+1] + img[idx+2]);
    //   //     var alpha = img[idx + 3];
  
    //   //     if (threshold < 750 && alpha != 0) {
    //   //       pattern[i].push(new Cell(true));
    //   //     } else {
    //   //       pattern[i].push(new Cell(false));
    //   //     }
    //   //   }
    //   // }
  
    //   // const draft: Draft = new Draft({warps: warps, wefts: wefts, pattern: pattern});
    //   // drafts.push(draft);
      
    //   // //create a blank loom to accompany this
    //   // const loom:Loom = new Loom(draft, 8, 10);
    //   // loom.overloadType('jacquard');
    //   // looms.push(loom);


    //   const f: FileObj = {
    //     filename: filename,
    //     version: 'na',
    //     drafts: drafts,
    //     looms: looms,
    //     nodes: [], 
    //     treenodes: [],
    //     ops: [],
    //     scale: 5
    //   }
  
    //   return Promise.resolve({data: f ,status: 0});  
    // },
    // bmp: async (filename: string, data: any) : Promise<LoadResponse> => {
    //   this.clearAll();

    //   let drafts: Array<Draft> = [];
    //   let looms: Array<Loom> = [];

    //   let e = data;
    //   const warps = e.width;
    //   const wefts = e.height;
  
    //   var img = e.data;
    //   var pattern = [];
  
    //   for (var i=0; i< e.height; i++) {
    //     pattern.push([]);
    //     for (var j=0; j< e.width; j++) {
    //       var idx = (i * 4 * warps) + (j * 4);
    //       var threshold = (img[idx] + img[idx+1] + img[idx+2]);
    //       var alpha = img[idx + 3];
  
    //       if (threshold < 750 && alpha != 0) {
    //         pattern[i].push(new Cell(true));
    //       } else {
    //         pattern[i].push(new Cell(false));
    //       }
    //     }
    //   }
  
    //   const draft: Draft = new Draft({warps: warps, wefts: wefts, pattern: pattern});
    //   drafts= [ draft];
      
    //   //create a blank loom to accompany this
    //   const loom:Loom = new Loom(draft, 'jacquard', 8, 10);
    //   looms.push(loom);

    //   const proxies = this.tree.getNewDraftProxies(draft, []);

    
    //   const f: FileObj = {
    //     filename: filename,
    //     version: 'na',
    //     drafts: drafts,
    //     looms: looms,
    //     nodes: [proxies.node], 
    //     treenodes: [proxies.treenode],
    //     ops: [],
    //     scale: 5
    //   }
  
    //   return Promise.resolve({data: f ,status: 0});  
    // },
    form: async (f:any):Promise<LoadResponse> =>{
      this.clearAll();

      let drafts: Array<Draft> = [];
      let looms: Array<Loom> = [];

      var warps = 20;
      if(f.value.warps !== undefined) warps = f.value.warps;


      var wefts = 20;
      if(f.value.wefts !== undefined) wefts = f.value.wefts;
      //set default values

      const draft: Draft = initDraftWithParams({warps: warps, wefts: wefts});

      console.log("Form values ", f.value)


      var frame_num = (f.value.frame_num === undefined) ? 8 : f.value.frame_num;
      var treadle_num = (f.value.treadle_num === undefined) ? 10 : f.value.treadle_num;
      var loomtype = (f.value.loomtype === undefined) ? 'frame' : f.value.loomtype;
      var frame_num = (f.value.frame_num === undefined) ? 2 : f.value.frame_num;
      var treadle_num = (f.value.treadle_num === undefined) ? 2 : f.value.treadle_num;
      if(f.value.loomtype == 'direct') treadle_num = frame_num;
      var epi = (f.value.epi === undefined) ? 10 : f.value.epi;
      var units = (f.value.units === undefined || ! f.value.units) ? "in" : f.value.units;
      


      const loom_settings: LoomSettings = {
        type: loomtype,
        epi: epi, 
        units: units,
        frames: frame_num,
        treadles: treadle_num
      }

      this.ws.inferData([loom_settings]);
      

      const loomutils = getLoomUtilByType(loomtype);
      return loomutils.computeLoomFromDrawdown(draft.drawdown, loom_settings, 0).then(loom => {
        looms.push(loom);
        const proxies = this.tree.getNewDraftProxies(draft, []);
        draft.id  = proxies.node.node_id;
        proxies.draft_node.draft = draft;
        proxies.draft_node.draft_id = draft.id;
        proxies.draft_node.loom = loom;
        proxies.draft_node.loom_settings = loom_settings;



        
        const envt: FileObj = {
          version: this.vs.currentVersion(),
          workspace: this.ws.exportWorkspace(),
          filename: "adacad mixer",
          nodes: [proxies.node], 
          treenodes: [proxies.treenode],
          draft_nodes: [proxies.draft_node],
          ops: [],
          scale: 5
        }
    
        return Promise.resolve({data: envt, status: 0});

      });

  

      


    }
  }

  // interface FileSaver{
  //   ada: (drafts: Array<Draft>, looms: Array<Loom>, pattern: Array<Pattern>, palette:PaletteComponent) => void,
  //   wif: (drafts: Array<Draft>, looms: Array<Loom>) => void,
  //   bmp: (drafts: Array<Draft>) => LoadResponse,
  //   jpg: (drafts: Array<Draft>, looms: Array<Loom>, pattern: Array<Pattern>, palette:PaletteComponent) => void
  // }
  

  const dsaver: FileSaver = {
    
    ada:  async (type: string, for_timeline: boolean, current_scale: number) : Promise<{json: string, file: SaveObj}> => {
           
      const out: SaveObj = {
        version: this.vs.currentVersion(),
        workspace: this.ws.exportWorkspace(),
        type: type,
        nodes: this.tree.exportNodesForSaving(current_scale),
        tree: this.tree.exportTreeForSaving(),
        draft_nodes: await this.tree.exportDraftNodeProxiesForSaving(),
        ops: this.tree.exportOpMetaForSaving(),
        notes: this.ns.exportForSaving(),
        materials: this.ms.exportForSaving(),
        scale: current_scale
      }

      //update this to return the object and see how it writes
      var theJSON = JSON.stringify(out);
      return Promise.resolve({json: theJSON, file: out});


    },
   // wif: async (draft: Draft, loom: Loom) : Promise<string> => {
      // const shuttles: Array<Shuttle> = this.ms.getShuttles();
      //   //will need to import the obj for draft2wif.ts and then use it and pass this.weave for fileContents
      // var fileContents = "[WIF]\nVersion=1.1\nDate=November 6, 2020\nDevelopers=Unstable Design Lab at the University of Colorado Boulder\nSource Program=AdaCAD\nSource Version=3.0\n[CONTENTS]";
      // var fileType = "text/plain";

      // fileContents += "\nCOLOR PALETTE=yes\nWEAVING=yes\nWARP=yes\nWEFT=yes\nTIEUP=yes\nCOLOR TABLE=yes\nTHREADING=yes\nWARP COLORS=yes\nTREADLING=yes\nWEFT COLORS=yes\n";
      
      // fileContents += "[COLOR PALETTE]\n";
      // fileContents += "Entries=" + (shuttles.length).toString() +"\n";
      // fileContents += "Form=RGB\nRange=0,255\n";

      // fileContents += "[WEAVING]\nShafts=";
      // fileContents += loom.min_frames.toString();
      // fileContents += "\nTreadles=";
      // fileContents += loom.min_treadles.toString();
      // fileContents += "\nRising Shed=yes\n";
      // fileContents += "[WARP]\nThreads=";
      // fileContents += draft.warps.toString();
      
      // var warpColors = [];
      // for (var i = 0; i < draft.colShuttleMapping.length; i++) {
      //   if (!warpColors.includes(draft.colShuttleMapping[i])) {
      //     warpColors.push(draft.colShuttleMapping[i]);
      //   }
      // }
      // fileContents += "\nColors=" + warpColors.length.toString();

      // fileContents += "\n[WEFT]\nThreads=";
      // fileContents += draft.wefts.toString();
      // var weftColors = [];
      // for (var i = 0; i < draft.colShuttleMapping.length; i++) {
      //   if (!weftColors.includes(draft.colShuttleMapping[i])) {
      //     weftColors.push(draft.colShuttleMapping[i]);
      //   }
      // }
      // fileContents += "\nColors=" + weftColors.length.toString();

      // fileContents += "\n[TIEUP]\n";

      // var treadles = [];
      // for (var i =0; i < loom.tieup.length;i++) {
      //   for (var j = 0; j < loom.tieup[i].length;j++) {
      //     if (loom.tieup[i][j] && !treadles.includes(j)) {
      //       treadles.push(j);
      //     }
      //   }
      // }
      // for (var i =0; i < treadles.length; i++) {
      //   fileContents += (treadles[i]+1).toString() + "=";
      //   var lineMarked = false;
      //   for (var j = 0; j < loom.tieup.length; j++){
      //     if (loom.tieup[j][treadles[i]]) { 
      //       if (lineMarked) {
      //         fileContents += ",";
      //       }
      //       fileContents += (j+1).toString();
      //       lineMarked=true;
      //     }
      //   }
      //   fileContents += "\n";
      // }

      // fileContents+= "[COLOR TABLE]\n";
      // //Reference: https://css-tricks.com/converting-color-spaces-in-javascript/ for conversion for hex to RGB
      // var counter = 1;
      // for (var i = 0; i < shuttles.length; i++) {
      //   fileContents+= (counter).toString();
      //   counter = counter + 1;
      //   fileContents+= "=";
      //   var hex = shuttles[i].color;
      //   if (hex.length == 7) {
      //     var r = "0x" + hex[1] + hex[2];
      //     var g = "0x" + hex[3] + hex[4];
      //     var b = "0x" + hex[5] + hex[6];

      //     fileContents += (+r).toString() + "," + (+g).toString() + "," + (+b).toString() + "\n";
      //   }
      // }
      
      // fileContents += "[THREADING]\n";
      // for (var i=0; i <loom.threading.length; i++) {
      //   var frame = loom.threading[i];
      //   if (frame != -1) {
      //     fileContents += (loom.threading.length-i).toString() + "=" + (frame+1).toString() + "\n";
      //   }
      // }

      // fileContents += "[WARP COLORS]\n";
      // for (var i = 0; i < draft.colShuttleMapping.length; i++) {
      //   fileContents += (i+1).toString() + "=" + (draft.colShuttleMapping[(draft.colShuttleMapping.length)-(i+1)]+1).toString() + "\n";
      // }

      // //THIS WILL ONLY WORK WTIH FRAME LOOM DRAFT STYLE
      // fileContents += "[TREADLING]\n";
      // for (var i = 0; i < loom.treadling.length; i++) {
      //   if (loom.treadling[i].length != 0 && loom.treadling[i][0] != -1){
      //     fileContents += (i+1).toString() + "=" + (loom.treadling[i][0]+1).toString() + "\n";
      //   }
      // }

      // fileContents += "[WEFT COLORS]\n";
      // for (var i = 0; i < draft.rowShuttleMapping.length; i++) { // will likely have to change the way I import too
      //   fileContents += (i+1).toString() + "=" + (draft.rowShuttleMapping[i]+1).toString() + "\n";
      // }

   //   const href:string = "data:" + fileType +";base64," + btoa(fileContents);
   //   return Promise.resolve(href);
   // },
    bmp: async (canvas:HTMLCanvasElement) : Promise<string> => {
      return Promise.resolve(canvas.toDataURL("image/jpg"));

    },
    jpg: async (canvas:HTMLCanvasElement) : Promise<string> => {
      return Promise.resolve(canvas.toDataURL("image/jpg"));
    }
  }


  this.loader = dloader;
  this.saver = dsaver;
  


  }

  clearAll(){
    console.log("Clearing all in FS")
    this.tree.clear();
    this.ms.reset();
    this.ss.reset(),
    this.ns.resetNotes();

  }




}
