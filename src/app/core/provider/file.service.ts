import { inject, Injectable } from '@angular/core';
import { defaults, generateId, Loom, LoomSettings, Material, sameOrNewerVersion } from 'adacad-drafting-lib';
import { Draft, initDraftWithParams, warps, wefts } from 'adacad-drafting-lib/draft';
import { getLoomUtilByType, initLoom, numFrames, numTreadles } from 'adacad-drafting-lib/loom';
import { DraftNodeProxy, Fileloader, FileMeta, FileSaver, LoadResponse, NodeComponentProxy, OpComponentProxy, SaveObj, StatusMessage } from '../model/datatypes';
import { loadDraftFromFile, loadLoomFromFile } from '../model/helper';
import { getBool, getColorTable, getInt, getString, getSubstringAfter, getThreading, getTieups, getTreadling } from '../model/wif';
import { MaterialsService } from './materials.service';
import { MediaService } from './media.service';
import { NotesService } from './notes.service';
import { SystemsService } from './systems.service';
import { TreeService } from './tree.service';
import { VersionService } from './version.service';
import { WorkspaceService } from './workspace.service';
import { ZoomService } from './zoom.service';




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
  private tree = inject(TreeService);
  private ns = inject(NotesService);
  private ms = inject(MaterialsService);
  private ss = inject(SystemsService);
  private vs = inject(VersionService);
  private ws = inject(WorkspaceService);
  private zs = inject(ZoomService);
  private media = inject(MediaService);



  status: Array<StatusMessage> = [];
  loader: Fileloader = null;
  saver: FileSaver = null;

  constructor() {


    this.status = [
      { id: 0, message: 'success', success: true },
      { id: 1, message: 'incompatable type', success: false }
    ];


    /**
     * file loader loads files of different types, 
     * for .adaFiles, it gets the data listed in SaveObj and begins to process it
     */
    const dloader: Fileloader = {

      ada: async (data: SaveObj | any, meta: FileMeta, src: string): Promise<LoadResponse> => {
        console.log("LOADING FILE", data);
        if (meta.desc === undefined) meta.desc = ""
        if (meta.name == undefined) meta.name = 'draft'
        if (meta.from_share == undefined) meta.from_share = ''
        if (meta.id === -1) meta.id = generateId(8);

        let draft_nodes: Array<DraftNodeProxy> = [];
        let ops: Array<OpComponentProxy> = [];
        let version = "0.0.0";

        this.clearAll();

        if (data == undefined) return Promise.reject(" there is no data")

        if (data.version !== undefined) version = data.version;

        if (data.zoom !== undefined) {
          this.zs.import(data.zoom)
        }

        if (data.workspace !== undefined) {
          this.ws.loadWorkspace(data.workspace);
        } else {
          this.ws.initDefaultWorkspace();
        }

        if (data.shuttles !== undefined) {
          this.ms.overloadShuttles(data.shuttles);

        } else {
          if (data.materials !== undefined) {
            this.ms.overloadShuttles(data.materials);
          }
        }

        const loom_elements = []
        const loom_fns = []
        const draft_elements = [];
        const draft_fns = [];

        if (!sameOrNewerVersion(version, '3.4.9')) {
          data.nodes.forEach(node => {
            if (node.bounds !== undefined) node.topleft = node.bounds.topleft;
          })
        }

        if (sameOrNewerVersion(version, '3.4.5')) {

          draft_nodes = data.draft_nodes;

          if (draft_nodes == undefined) draft_nodes = [];

          if (draft_nodes !== undefined) {



            draft_nodes.forEach((el, ndx) => {

              if (el.draft_id !== el.node_id) {
                el.draft_id = el.node_id;
                if (el.draft !== null && el.draft !== undefined) el.draft.id = el.node_id;

                if (el.compressed_draft !== null && el.compressed_draft !== undefined) el.compressed_draft.id = el.node_id;

                if (data.draft_nodes[ndx].draft_name !== undefined) {
                  el.ud_name = '';
                  el.gen_name = data.draft_nodes[ndx].draft_name;
                }


              }

              if (el.draft == undefined && el.compressed_draft !== undefined && el.compressed_draft !== null) {
                draft_fns.push(loadDraftFromFile(el.compressed_draft, version, src));
                draft_elements.push(el);
              } else if (el.draft !== null && el.draft !== undefined) {
                draft_fns.push(loadDraftFromFile(el.draft, version, src));
                draft_elements.push(el);
              }

              if (el.loom !== null && el.loom !== undefined) {
                loom_fns.push(loadLoomFromFile(el.loom, version, el.draft_id));
                loom_elements.push(el);
              }




            });
          }

        } else {

          //handle old file types that didn't separate out drafts
          if (data.drafts === undefined) data.drafts = [data];


          data.nodes
            .filter(el => el.type === 'draft')
            .forEach(async node => {

              const loom = data.looms.find(loom => loom.draft_id === node.node_id);
              const draft = data.drafts.find(draft => draft.id === node.node_id);


              const dn: DraftNodeProxy = {
                node_id: (node === undefined) ? -1 : node.node_id,
                draft_id: node.node_id,
                ud_name: (node.draft_name) ? node.draft_name : node.ud_name,
                gen_name: (node.draft_name) ? node.draft_name : node.gen_name,
                draft: null,
                notes: (draft.notes === undefined) ? '' : draft.notes,
                compressed_draft: null,
                draft_visible: (node === undefined) ? true : node.draft_visible,
                loom: null,
                loom_settings: (loom === undefined)
                  ? {
                    type: this.ws.type,
                    epi: defaults.loom_settings.epi,
                    ppi: defaults.loom_settings.ppi,
                    units: this.ws.units,
                    frames: this.ws.min_frames,
                    treadles: this.ws.min_treadles
                  }
                  :
                  {
                    type: loom.type ?? defaults.loom_settings.type,
                    epi: loom.epi ?? defaults.loom_settings.epi,
                    ppi: loom.ppi ?? defaults.loom_settings.ppi,
                    units: loom.units ?? defaults.loom_settings.units,
                    frames: loom.min_frames ?? defaults.loom_settings.frames,
                    treadles: loom.min_treadles ?? defaults.loom_settings.treadles
                  },
                render_colors: (node === undefined || node.render_colors === undefined) ? true : node.render_colors,
                scale: (node === undefined || node.scale === undefined) ? 1 : node.scale,
              }

              draft_nodes.push(dn);

              if (draft !== null && draft !== undefined) {
                draft_fns.push(loadDraftFromFile(draft, version, 'db'));

                if (loom !== null && loom !== undefined) {
                  loom_fns.push(loadLoomFromFile(loom, version, draft.id));
                }
              }
            });

        }

        return Promise.all(draft_fns)
          .then(res => {
            //res contains a list of ids and drafts

            res.forEach(result => {
              let draft_ndx = draft_nodes.findIndex(el => el.draft_id == result.id);
              if (draft_ndx !== -1) draft_nodes[draft_ndx].draft = result.draft;



            })

            return Promise.all(loom_fns)
          })
          .then(res => {

            res.forEach(result => {
              let draft_ndx = draft_nodes.findIndex(el => el.draft_id == result.id);
              if (draft_ndx !== -1) draft_nodes[draft_ndx].loom = result.loom;
            })


            draft_nodes
              .filter(el => el.draft !== null)
              .forEach(el => {
                //scan the systems and add any that need to be added
                if (el.draft !== null && el.draft !== undefined && el.draft.rowSystemMapping !== undefined) {
                  el.draft.rowSystemMapping.forEach(el => {
                    if (this.ss.getWeftSystem(el) === undefined) this.ss.addWeftSystemFromId(el);
                  });
                }

                //scan the systems and add any that need to be added
                if (el.draft !== null && el.draft !== undefined && el.draft.colSystemMapping !== undefined) {
                  el.draft.colSystemMapping.forEach(el => {
                    if (this.ss.getWarpSystem(el) === undefined) this.ss.addWarpSystemFromId(el);
                  });
                }
              })


            if (data.ops !== undefined) {
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

            let indexed_images = [];
            if (data.indexed_image_data !== undefined) {
              indexed_images = data.indexed_image_data;
            }

            const envt: SaveObj = {
              version: data.version,
              workspace: data.workspace,
              zoom: data.zoom,
              type: 'mixer',
              nodes: (data.nodes === undefined) ? [] : data.nodes,
              tree: (data.tree === undefined) ? [] : data.tree,
              draft_nodes: draft_nodes,
              notes: (data.notes === undefined) ? [] : data.notes,
              ops: ops,
              materials: [],
              indexed_image_data: indexed_images
            }

            return Promise.resolve({ data: envt, meta, status: 0 });

          }
          )





      },

      paste: async (data: any): Promise<LoadResponse> => {


        let draft_nodes: Array<DraftNodeProxy> = [];
        let ops: Array<OpComponentProxy> = [];
        let version = data.version;



        if (data.shuttles !== undefined) {
          //handle shuttles here
        }

        const loom_elements = []
        const loom_fns = []
        const draft_elements = [];
        const draft_fns = [];

        draft_nodes = data.draft_nodes;

        draft_nodes.forEach(el => {
          if (el.compressed_draft !== null && el.compressed_draft !== undefined) {
            draft_fns.push(loadDraftFromFile(el.compressed_draft, version, 'db'));
            draft_elements.push(el);

            if (el.loom !== null && el.loom !== undefined) {
              loom_fns.push(loadLoomFromFile(el.loom, version, el.compressed_draft.id));
              loom_elements.push(el);
            }
          }


        });

        return Promise.all(draft_fns)
          .then(res => {

            for (let i = 0; i < draft_elements.length; i++) {
              draft_elements[i].draft = res[i].draft;
            }

            return Promise.all(loom_fns)
          })
          .then(res => {

            for (let i = 0; i < loom_elements.length; i++) {
              draft_elements[i].loom = res[i];
            }

            draft_nodes
              .filter(el => el.compressed_draft !== null)
              .forEach(el => {
                //scan the systems and add any that need to be added
                if (el.compressed_draft !== null && el.compressed_draft !== undefined && el.compressed_draft.rowSystemMapping !== undefined) {
                  el.compressed_draft.rowSystemMapping.forEach(el => {
                    if (this.ss.getWeftSystem(el) === undefined) this.ss.addWeftSystemFromId(el);
                  });
                }

                //scan the systems and add any that need to be added
                if (el.compressed_draft !== null && el.compressed_draft !== undefined && el.compressed_draft.colSystemMapping !== undefined) {
                  el.compressed_draft.colSystemMapping.forEach(el => {
                    if (this.ss.getWarpSystem(el) === undefined) this.ss.addWarpSystemFromId(el);
                  });
                }
              })


            let indexed_images = [];
            if (data.indexed_image_data !== undefined) {
              indexed_images = data.indexed_image_data;
            }


            if (data.ops !== undefined) {
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




            const envt: SaveObj = {
              version: '0.0.0',
              workspace: null,
              zoom: null,
              type: 'partial',
              nodes: (data.nodes === undefined) ? [] : data.nodes,
              tree: (data.tree === undefined) ? [] : data.tree,
              draft_nodes: draft_nodes,
              notes: [],
              ops: ops,
              materials: [],
              indexed_image_data: indexed_images
            }

            const meta = {
              id: -1,
              name: 'paste',
              desc: 'a file represeting copied information',
              from_share: '',
              share_owner: ''

            }

            return Promise.resolve({ data: envt, meta, status: 0 });

          }
          )





      },

      wif: async (filename: string, data: any): Promise<LoadResponse> => {


        var stringWithoutMetadata = getSubstringAfter("CONTENTS", data);
        const warps: number = getInt("Threads", getSubstringAfter("WARP]", stringWithoutMetadata));
        const wefts: number = getInt("Threads", getSubstringAfter("WEFT]", stringWithoutMetadata));
        const pattern: Array<Array<boolean>> = [];



        const draft = initDraftWithParams({ warps, wefts });
        //draft.drawdown = drawdownFromPattern(pattern, {warps, wefts});
        draft.gen_name = data.name;

        let frames = getInt("Shafts", data);
        let treadles = getInt("Treadles", data);

        const loom_settings: LoomSettings = {
          type: 'frame',
          frames,
          treadles,
          units: 'in',
          epi: 100,
          ppi: 100
        }
        const loom = initLoom(warps, wefts, frames, treadles);


        if (getBool("TREADLING", stringWithoutMetadata)) {
          loom.treadling = getTreadling(stringWithoutMetadata, draft);
        }
        if (getBool("THREADING", stringWithoutMetadata)) {
          loom.threading = getThreading(stringWithoutMetadata, draft);
        }
        if (getBool("TIEUP", data)) {
          loom.tieup = getTieups(stringWithoutMetadata, draft);

        }
        if (getBool("COLOR TABLE", data)) {
          if (getString("Form", data) === "RGB") {
            let color_table: Array<Material> = getColorTable(data);
            var shuttles = color_table;

            /** TODO: Update this to add, not overwrite, shuttles */

            //add the shuttles to the existing


            this.ms.overloadShuttles(shuttles);
            // draft.overloadRowShuttleMapping(utilInstance.getRowToShuttleMapping(data, draft));
            // draft.overloadColShuttleMapping(utilInstance.getColToShuttleMapping(data, draft));
          }
        }


        let ncp: NodeComponentProxy = {
          node_id: generateId(8),
          type: 'draft',
          topleft: { x: 0, y: 0 }
        }


        let dnp: DraftNodeProxy = {
          node_id: ncp.node_id,
          draft_id: draft.id,
          ud_name: 'imported wif',
          gen_name: '',
          notes: 'imported from wif',
          draft: draft,
          compressed_draft: null,
          draft_visible: true,
          loom: loom,
          loom_settings: loom_settings,
          render_colors: true,
          scale: 1
        }

        const envt: SaveObj = {
          version: '0.0.0',
          workspace: null,
          zoom: null,
          type: 'wif',
          nodes: [ncp],
          tree: null,
          draft_nodes: [dnp],
          notes: [],
          ops: [],
          materials: [],
          indexed_image_data: []
        }

        const meta = {
          id: -1,
          name: 'wif import',
          desc: 'a file represeting imported wif information',
          from_share: '',
          share_owner: ''

        }

        return Promise.resolve({ data: envt, meta, status: 0 });





      },
      bitmap: async (filename: string, data: any): Promise<LoadResponse> => {




        return Promise.resolve({ data: null, meta: null, status: 0 });
      }

    }



    const dsaver: FileSaver = {

      copy: async (include: Array<number>): Promise<SaveObj> => {

        const out: SaveObj = {
          type: 'partial',
          version: this.vs.currentVersion(),
          workspace: null,
          zoom: null,
          nodes: this.tree.exportNodesForSaving(),
          tree: this.tree.exportTreeForSaving(),
          draft_nodes: await this.tree.exportDraftNodeProxiesForSaving(),
          ops: this.tree.exportOpMetaForSaving(),
          notes: [],
          materials: this.ms.exportForSaving(),
          indexed_image_data: this.media.exportIndexedColorImageData()
        }

        //now filter out things that aren't relevant
        out.nodes = out.nodes.filter(node => include.find(el => el == node.node_id) !== undefined);
        out.nodes.forEach(node => { node.topleft = { x: node.topleft.x + 50, y: node.topleft.y + 50 } });
        out.tree = out.tree.filter(tn => include.find(el => el == tn.node) !== undefined);
        out.draft_nodes = out.draft_nodes.filter(dn => include.find(el => el == dn.node_id) !== undefined);
        out.ops = out.ops.filter(op => include.find(el => el == op.node_id) !== undefined)


        return Promise.resolve(out);

      },

      ada: async (): Promise<{ json: string, file: SaveObj }> => {


        return this.tree.exportDraftNodeProxiesForSaving().then(draft_nodes => {
          const out: SaveObj = {
            version: this.vs.currentVersion(),
            workspace: this.ws.exportWorkspace(),
            type: 'mixer',
            zoom: this.zs.export(),
            nodes: this.tree.exportNodesForSaving(),
            tree: this.tree.exportTreeForSaving(),
            draft_nodes: draft_nodes,
            ops: this.tree.exportOpMetaForSaving(),
            notes: this.ns.exportForSaving(),
            materials: this.ms.exportForSaving(),
            indexed_image_data: this.media.exportIndexedColorImageData()
          }
          var theJSON = JSON.stringify(out);
          return Promise.resolve({ json: theJSON, file: out });
        })

      },
      wif: async (draft: Draft, loom: Loom, loom_settings: LoomSettings): Promise<string> => {





        if (loom === null) {

          //force loom type to something with shafts;
          loom_settings.type = 'frame';
          loom = await getLoomUtilByType(loom_settings.type).computeLoomFromDrawdown(draft.drawdown, loom_settings);

        }

        const shuttles: Array<Material> = this.ms.getShuttles();
        //will need to import the obj for draft2wif.ts and then use it and pass this.weave for fileContents
        var fileType = "text/plain";

        var fileContents = "[WIF]\nVersion=1.1\nDate=June 11, 2024\nDevelopers=unstabledesignlab@gmail.com\nSource Program=AdaCAD\nSource Version=" + this.vs.currentVersion() + "\n[CONTENTS]";

        if (loom_settings.type == 'direct') {
          fileContents += "\nCOLOR PALETTE=true\nWEAVING=true\nWARP=true\nWEFT=true\nLIFTPLAN=true\nCOLOR TABLE=true\nWARP COLORS=true\nTREADLING=true\nWEFT COLORS=true\n";
        } else {
          fileContents += "\nCOLOR PALETTE=true\nWEAVING=true\nWARP=true\nWEFT=true\nTIEUP=true\nCOLOR TABLE=true\nTHREADING=true\nWARP COLORS=true\nTREADLING=true\nWEFT COLORS=true\n";
        }


        //COLOR PALETTE DEFINITION
        fileContents += "[COLOR PALETTE]\n";
        fileContents += "Entries=" + (shuttles.length).toString() + "\n";
        fileContents += "Form=RGB\nRange=0,255\n";


        // WEAVING
        fileContents += "[WEAVING]\nShafts=";
        fileContents += numFrames(loom).toString();
        fileContents += "\nTreadles=";
        fileContents += numTreadles(loom).toString();
        fileContents += "\nRising Shed=yes\n";


        // WARP
        fileContents += "[WARP]\nThreads=";
        fileContents += warps(draft.drawdown).toString();

        var warpColors = [];
        for (var i = 0; i < draft.colShuttleMapping.length; i++) {
          if (!warpColors.includes(draft.colShuttleMapping[i])) {
            warpColors.push(draft.colShuttleMapping[i]);
          }
        }
        fileContents += "\nColors=" + warpColors.length.toString(); //check if this is correct, might just need an index into the palette

        //consider adding thickness and spacing in here at some point. 

        // WEFT
        fileContents += "\n[WEFT]\nThreads=";
        fileContents += wefts(draft.drawdown).toString();
        var weftColors = [];
        for (var i = 0; i < draft.colShuttleMapping.length; i++) {
          if (!weftColors.includes(draft.colShuttleMapping[i])) {
            weftColors.push(draft.colShuttleMapping[i]);
          }
        }

        //check if this is coorect, potentially just an index
        fileContents += "\nColors=" + weftColors.length.toString();

        // TIEUP?
        if (loom_settings.type == 'frame') {

          fileContents += "\n[TIEUP]\n";


          var treadles = [];
          for (var i = 0; i < loom.tieup.length; i++) {
            for (var j = 0; j < loom.tieup[i].length; j++) {
              if (loom.tieup[i][j] && !treadles.includes(j)) {
                treadles.push(j);
              }
            }
          }
          for (var i = 0; i < treadles.length; i++) {
            fileContents += (treadles[i] + 1).toString() + "=";
            var lineMarked = false;
            for (var j = 0; j < loom.tieup.length; j++) {
              if (loom.tieup[j][treadles[i]]) {
                if (lineMarked) {
                  fileContents += ",";
                }
                fileContents += (j + 1).toString();
                lineMarked = true;
              }
            }
            fileContents += "\n";
          }
        } else {
          fileContents += "\n";

        }



        //COLOR TABLE

        fileContents += "[COLOR TABLE]\n";
        //Reference: https://css-tricks.com/converting-color-spaces-in-javascript/ for conversion for hex to RGB
        var counter = 1;
        for (var i = 0; i < shuttles.length; i++) {
          fileContents += (counter).toString();
          counter = counter + 1;
          fileContents += "=";
          var hex = shuttles[i].color;
          if (hex.length == 7) {
            var r = "0x" + hex[1] + hex[2];
            var g = "0x" + hex[3] + hex[4];
            var b = "0x" + hex[5] + hex[6];

            fileContents += (+r).toString() + "," + (+g).toString() + "," + (+b).toString() + "\n";
          }
        }

        //THREADING 

        fileContents += "[THREADING]\n";
        for (var i = 0; i < loom.threading.length; i++) {
          var frame = loom.threading[i];
          if (frame != -1) {
            fileContents += (loom.threading.length - i).toString() + "=" + (frame + 1).toString() + "\n";
          }
        }


        //WARP COLORS (I believe this overwrites the default color specified in warps)
        fileContents += "[WARP COLORS]\n";
        for (var i = 0; i < draft.colShuttleMapping.length; i++) {
          fileContents += (i + 1).toString() + "=" + (draft.colShuttleMapping[(draft.colShuttleMapping.length) - (i + 1)] + 1).toString() + "\n";
        }

        //THIS WILL ONLY WORK WITH FRAME LOOM DRAFT STYLE
        if (loom_settings.type !== 'direct') {

          fileContents += "[TREADLING]\n";
          for (var i = 0; i < loom.treadling.length; i++) {
            if (loom.treadling[i].length != 0) {

              fileContents += (i + 1).toString() + "=";
              const commaSeparated = loom.treadling[i].map(el => (el + 1).toString()).join(',');
              fileContents += commaSeparated;
              fileContents += "\n";
            }
          }
        }

        //LIFT PLAN
        if (loom_settings.type == 'direct') {

          fileContents += "[LIFTPLAN]\n";
          for (var i = 0; i < loom.treadling.length; i++) {
            if (loom.treadling[i].length != 0) {

              fileContents += (i + 1).toString() + "=";
              const commaSeparated = loom.treadling[i].map(el => (el + 1).toString()).join(',');
              fileContents += commaSeparated;
              fileContents += "\n";
            }
          }
        }

        //WEFT COLORS
        fileContents += "[WEFT COLORS]\n";
        for (var i = 0; i < draft.rowShuttleMapping.length; i++) { // will likely have to change the way I import too
          fileContents += (i + 1).toString() + "=" + (draft.rowShuttleMapping[i] + 1).toString() + "\n";
        }

        const href: string = "data:" + fileType + ";base64," + btoa(fileContents);
        return Promise.resolve(href);
      },
      bmp: async (canvas: HTMLCanvasElement): Promise<string> => {
        return Promise.resolve(canvas.toDataURL("image/jpeg", 1));

      },
      png: async (canvas: HTMLCanvasElement): Promise<string> => {
        const blob: Blob = await new Promise(resolve => canvas.toBlob(resolve));
        return Promise.resolve(URL.createObjectURL(blob));
      },
      jpg: async (canvas: HTMLCanvasElement): Promise<string> => {
        return Promise.resolve(canvas.toDataURL("image/png"));
      }
    }


    this.loader = dloader;
    this.saver = dsaver;



  }

  clearAll() {
    this.tree.clear();
    this.ms.reset();
    this.ss.reset(),
      this.ns.clear();

  }




}
