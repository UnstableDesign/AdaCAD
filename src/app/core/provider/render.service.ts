import { Injectable, inject } from '@angular/core';
import { Loom, LoomSettings } from 'adacad-drafting-lib';
import { Draft, getCellValue, warps, wefts } from 'adacad-drafting-lib/draft';
import { numFrames, numTreadles } from 'adacad-drafting-lib/loom';
import { Subject } from 'rxjs';
import { CanvasList, RenderingFlags } from '../../core/model/datatypes';
import { defaults } from '../../core/model/defaults';
import { SystemsService } from '../../core/provider/systems.service';
import { MaterialsService } from './materials.service';
import { TreeService } from './tree.service';
import { WorkspaceService } from './workspace.service';

interface RenderQueueItem {
  type: 'render';
  draft: Draft;
  loom: Loom;
  loom_settings: LoomSettings;
  canvases: CanvasList;
  rf: RenderingFlags;
  onComplete: () => void
}

interface ScaleQueueItem {
  type: 'scale';
  draft: Draft;
  loom: Loom;
  loom_settings: LoomSettings;
  canvases: CanvasList;
  rf: RenderingFlags;
  scale: number;
  onComplete: () => void;
}

/**
 * this service manages drawing the draft and looms across the different components including: 
 * editor, viewer, and mixer. 
 */
@Injectable({
  providedIn: 'root'
})
export class RenderService {
  private ss = inject(SystemsService);
  private ms = inject(MaterialsService);
  private ws = inject(WorkspaceService);
  private tree = inject(TreeService);
  current_view: string;

  view_front: boolean;

  zoom: number;

  draft_cell_size: number;

  pixel_ratio: number;


  //force all the drafts into a queue for rendering. This is used to prevent the rendering from being blocked by large drafts.
  private queue: Array<RenderQueueItem | ScaleQueueItem> = [];
  private isProcessing: boolean = false;
  private queueProcessorRunning: boolean = false;





  constructor() {
    //max values
    this.draft_cell_size = defaults.draft_detail_cell_size;
    this.current_view = 'draft';
    this.view_front = true;
    this.pixel_ratio = window.devicePixelRatio || 1;
    this.queue = [];


    this.startQueueProcessor();

  }


  public addToQueue(draft: Draft, loom: Loom, loom_settings: LoomSettings, canvases: CanvasList, rf: RenderingFlags, type: 'render' | 'scale', onComplete: () => void, scale?: number): RenderQueueItem | null {
    if (type == 'render') {
      const subject = new Subject<number>();
      const queueItem: RenderQueueItem = {
        type: 'render',
        draft,
        loom,
        loom_settings,
        canvases,
        rf,
        onComplete
      };
      this.queue.push(queueItem);

      return queueItem;


    } else {
      this.queue.push({ type: 'scale', draft, loom, loom_settings, canvases, rf, scale, onComplete });
      return null;
    }
  }

  /**
   * Starts the queue processor that continuously checks for and processes queue items
   * This runs indefinitely, checking for new items even when the queue is empty
   */
  private startQueueProcessor() {
    if (this.queueProcessorRunning) {
      return; // Already running
    }

    this.queueProcessorRunning = true;
    this.processQueue();
  }



  /**
   * Continuously processes the queue, one item at a time
   * Keeps running even when queue is empty, checking periodically for new items
   */
  private async processQueue() {
    while (true) {
      if (this.queue.length > 0 && !this.isProcessing) {
        this.isProcessing = true;
        const item = this.queue.shift();

        if (item) {
          const startTime = performance.now();

          try {
            if (item.type == 'render') {
              await this.drawDraft(item.draft, item.loom, item.loom_settings, item.canvases, item.rf);
            } else {
              await this.rescaleCanvases(item.draft, item.loom, item.loom_settings, item.scale, item.canvases);
            }

            const duration = performance.now() - startTime;
            if (item.onComplete) {
              item.onComplete();
            }
          } catch (error) {
            if (item.onComplete) {
              item.onComplete(); // Still call onComplete even on error
            }
          }
        }

        this.isProcessing = false;
      } else {
        // Queue is empty or already processing, wait a bit before checking again
        await new Promise(resolve => setTimeout(resolve, 10)); // Check every 10ms
      }
    }
  }





  /**
  * the canvas object is limited in how many pixels it can render. Adjust the draft cell size based on the number of cells in the draft
  * @param draft 
  */
  calculateCellSize(draft: Draft, out_format: string): number {

    let max_bound = Math.max(wefts(draft.drawdown), warps(draft.drawdown));
    let area = wefts(draft.drawdown) * warps(draft.drawdown);
    let ratio_square = Math.pow(this.pixel_ratio, 2);
    let num_array_values = area * Math.pow(defaults.draft_detail_cell_size, 2) * 4 * ratio_square;

    if (out_format == 'canvas') {
      if ((max_bound * defaults.draft_detail_cell_size) < defaults.canvas_width) {
        return Math.floor(defaults.draft_detail_cell_size);

      } else {
        return Math.floor(defaults.canvas_width / max_bound);
      }
    } else {
      //the limiting factor is the array buffer
      if (num_array_values <= defaults.array_buffer_size) {
        return Math.floor(defaults.draft_detail_cell_size);
      } else {
        let modified_cell_size = Math.sqrt(defaults.array_buffer_size / (area * 4 * ratio_square));
        return Math.floor(modified_cell_size);
      }

    }




  }




  private drawWeftData(draft: Draft, cell_size: number, pixel_ratio: number, weft_systems_canvas: HTMLCanvasElement, weft_mats_canvas: HTMLCanvasElement): Promise<string> {

    if (weft_systems_canvas == null || weft_mats_canvas == null) {
      return Promise.resolve('weft materials or systems canvas was null')
    }
    const weft_systems_cx = weft_systems_canvas.getContext("2d");
    const weft_mats_cx = weft_mats_canvas.getContext("2d");

    if (draft == null) {
      return Promise.resolve('draft null in drawWeftData')
    }

    if (draft.rowShuttleMapping == null || draft.rowSystemMapping == null) {
      return Promise.resolve('rowShuttleMapping or rowSystemMapping null in drawWeftData')
    } else {


      weft_systems_canvas.height = draft.rowSystemMapping.length * cell_size * pixel_ratio;
      weft_systems_canvas.width = defaults.draft_detail_cell_size * pixel_ratio
      weft_systems_canvas.style.height = (draft.rowSystemMapping.length * cell_size) + "px";
      weft_systems_canvas.style.width = defaults.draft_detail_cell_size + "px";
      weft_mats_canvas.height = draft.rowShuttleMapping.length * cell_size * pixel_ratio;
      weft_mats_canvas.width = defaults.draft_detail_cell_size * pixel_ratio;
      weft_mats_canvas.style.height = (draft.rowShuttleMapping.length * cell_size) + "px";
      weft_mats_canvas.style.width = defaults.draft_detail_cell_size + "px";
      let system = null;

      for (let j = 0; j < draft.rowShuttleMapping.length; j++) {

        system = this.ss.getWeftSystemCode(draft.rowSystemMapping[j]);
        let color = this.ms.getColor(draft.rowShuttleMapping[j]);
        weft_mats_cx.fillStyle = color;
        weft_mats_cx.strokeStyle = "#666666";
        weft_mats_cx.fillRect(1, j * cell_size * pixel_ratio + 1, defaults.draft_detail_cell_size * pixel_ratio - 2, cell_size * pixel_ratio - 2);
        weft_mats_cx.strokeRect(1, j * cell_size * pixel_ratio + 1, defaults.draft_detail_cell_size * pixel_ratio - 2, cell_size * pixel_ratio - 2);

        weft_systems_cx.font = 1.5 * cell_size + "px Arial";
        weft_systems_cx.fillStyle = "#666666";

        weft_systems_cx.save();
        weft_systems_cx.translate(10, (j + 1) * cell_size * pixel_ratio - 10);
        let tx = this.getTransform('weft-systems');
        weft_systems_cx.transform(tx[0], tx[1], tx[2], tx[3], tx[4], tx[5]);
        weft_systems_cx.textAlign = "center";
        weft_systems_cx.fillText(system, 0, 0);
        weft_systems_cx.restore();




      }
    }
    return Promise.resolve('')


  }

  private drawWarpData(draft: Draft, cell_size: number, pixel_ratio: number, warp_sys_canvas: HTMLCanvasElement, warp_mats_canvas: HTMLCanvasElement): Promise<string> {

    if (warp_mats_canvas == null || warp_sys_canvas == null) {
      return Promise.resolve('warp materials or systems canvas was null')
    }

    const warp_mats_cx = warp_mats_canvas.getContext("2d");
    const warp_systems_cx = warp_sys_canvas.getContext("2d");

    if (draft == null) {
      return Promise.resolve('draft null in drawWarpData')
    }

    if (draft.colShuttleMapping == null || draft.colSystemMapping == null) {
      return Promise.resolve('colShuttleMapping or colSystemMapping null in drawWarpData')
    } else {

      warp_mats_canvas.width = draft.colShuttleMapping.length * cell_size * pixel_ratio;
      warp_mats_canvas.height = defaults.draft_detail_cell_size * pixel_ratio;
      warp_mats_canvas.style.width = (draft.colShuttleMapping.length * cell_size) + "px";
      warp_mats_canvas.style.height = defaults.draft_detail_cell_size + "px";

      warp_sys_canvas.width = draft.colSystemMapping.length * cell_size * pixel_ratio;
      warp_sys_canvas.height = defaults.draft_detail_cell_size * pixel_ratio;
      warp_sys_canvas.style.width = (draft.colSystemMapping.length * cell_size) + "px";
      warp_sys_canvas.style.height = defaults.draft_detail_cell_size + "px";

      let system = null;

      for (let j = 0; j < draft.colShuttleMapping.length; j++) {
        let color = this.ms.getColor(draft.colShuttleMapping[j]);
        system = this.ss.getWarpSystemCode(draft.colSystemMapping[j]);

        //cell_size *= this.pixel_ratio
        warp_mats_cx.fillStyle = color;
        warp_mats_cx.strokeStyle = "#666666";
        warp_mats_cx.fillRect(j * cell_size * pixel_ratio + 1, 1, cell_size * pixel_ratio - 2, defaults.draft_detail_cell_size * pixel_ratio - 2);
        warp_mats_cx.strokeRect(j * cell_size * pixel_ratio + 1, 1, cell_size * pixel_ratio - 2, defaults.draft_detail_cell_size * pixel_ratio - 2);
        //need to flip this on certain origins. 
        warp_systems_cx.font = 1.5 * cell_size + "px Arial";
        warp_systems_cx.fillStyle = "#666666";

        warp_systems_cx.save();
        warp_systems_cx.translate(j * cell_size * pixel_ratio + 10, defaults.draft_detail_cell_size * pixel_ratio - 5);
        let tx = this.getTransform('warp-systems');
        warp_systems_cx.transform(tx[0], tx[1], tx[2], tx[3], tx[4], tx[5]);
        warp_systems_cx.textAlign = "center";
        warp_systems_cx.fillText(system, 0, 0);
        warp_systems_cx.restore();




      }
    }

    return Promise.resolve('');


  }


  /**
   * this function draws a single cell on either the threading, tieup or treadling and also handles the transformation of the type based on the current workspace view
   * @param draft 
   * @param loom 
   * @param loom_settings 
   * @param cell_size 
   * @param cx 
   * @param i 
   * @param j 
   * @param type 
   */
  private drawLoomCell(loom: Loom, loom_settings: LoomSettings, cell_size: number, cx: any, i: number, j: number, type: string) {

    var is_up = false;

    switch (type) {

      case 'threading':
        var frame = loom.threading[j];
        is_up = (frame == i);

        break;
      case 'tieup':
        is_up = (loom.tieup[i][j]);
        break;
      case 'treadling':
        is_up = (loom.treadling[i].find(el => el == j)) !== undefined;
        break;

    }

    cx.fillStyle = "#333333";
    cx.fillRect(j * cell_size, i * cell_size, cell_size, cell_size);

    cx.font = cell_size / 2 + "px Arial";
    cx.fillStyle = "white";

    let number_val = -1;
    if (type == "threading") number_val = i + 1;
    else if (type == "treadling") number_val = j + 1;
    else if (type == "tieup") number_val = i + 1;


    let y_margin = 0;

    if (type == "threading") {
      y_margin = (this.ws.selected_origin_option == 1 || this.ws.selected_origin_option == 2) ? 3 / 4 : 1 / 4;
    }

    if (type == "treadling") {
      y_margin = (this.ws.selected_origin_option == 1 || this.ws.selected_origin_option == 2) ? 1 / 4 : 3 / 4;
    }

    if (type == "tieup") {
      y_margin = (this.ws.selected_origin_option == 1 || this.ws.selected_origin_option == 2) ? 3 / 4 : 1 / 4;
    }

    cx.save();
    cx.translate(cell_size * (j + 1 / 2), cell_size * (i + y_margin));
    let tx = this.getTransform(type);
    cx.transform(tx[0], tx[1], tx[2], tx[3], tx[4], tx[5]);
    cx.textAlign = "center";
    cx.fillText(number_val, 0, 0);
    cx.restore();



  }

  private getTransform(target: string): Array<number> {
    switch (this.ws.selected_origin_option) {
      case 0:
        if (target == 'threading') {
          return [-1, 0, 0, -1, 0, 0];
        }
        if (target == 'treadling') {
          return [1, 0, 0, 1, 0, 0];
        }
        if (target == 'tieup') {
          return [1, 0, 0, -1, 0, 0];
        }
        if (target == 'warp-systems') {
          return [-1, 0, 0, 1, 0, 0];
        }
        if (target == 'weft-systems') {
          return [1, 0, 0, 1, 0, 0];
        }
        break;

      case 1:
        if (target == 'threading') {
          return [-1, 0, 0, 1, 0, 0];
        }
        if (target == 'treadling') {
          return [1, 0, 0, -1, 0, 0];
        }
        if (target == 'tieup') {
          return [1, 0, 0, 1, 0, 0];
        }
        if (target == 'warp-systems') {
          return [-1, 0, 0, 1, 0, 0];
        }
        if (target == 'weft-systems') {
          return [1, 0, 0, -1, 0, 0];
        }
        break;

      case 2:
        if (target == 'threading') {
          return [1, 0, 0, 1, 0, 0];
        }
        if (target == 'treadling') {
          return [-1, 0, 0, -1, 0, 0];
        }
        if (target == 'tieup') {
          return [-1, 0, 0, 1, 0, 0];
        }
        if (target == 'warp-systems') {
          return [1, 0, 0, 1, 0, 0];
        }
        if (target == 'weft-systems') {
          return [1, 0, 0, -1, 0, 0];
        }
        break;

      case 3:
        if (target == 'threading') {
          return [1, 0, 0, -1, 0, 0];
        }
        if (target == 'treadling') {
          return [-1, 0, 0, 1, 0, 0];
        }
        if (target == 'tieup') {
          return [-1, 0, 0, -1, 0, 0];
        }
        if (target == 'warp-systems') {
          return [1, 0, 0, 1, 0, 0];
        }
        if (target == 'weft-systems') {
          return [1, 0, 0, 1, 0, 0];
        }
        break;

    }
  }

  /**
 * Draws the grid lines onto the canvas.
 * @extends WeaveDirective
 * @returns {void}
 */
  private drawGrid(cx: any, canvas: HTMLCanvasElement, cell_size: number, pixel_ratio: number) {

    var dims = { w: 0, h: 0 };
    dims.w = cell_size * pixel_ratio;
    dims.h = cell_size * pixel_ratio;

    cx.fillStyle = "black";
    cx.lineWidth = 3;
    cx.lineCap = 'round';
    cx.strokeStyle = '#666';


    cx.fillStyle = "white";
    cx.fillRect(0, 0, canvas.width, canvas.height);


    //draw vertical lines
    for (let i = 0; i <= canvas.width; i += dims.w) {

      cx.beginPath();
      cx.moveTo(i, 0);
      cx.lineTo(i, canvas.height);
      cx.stroke();
    }

    // // draw horizontal lines
    for (let i = 0; i <= canvas.height; i += dims.h) {

      cx.beginPath();
      cx.moveTo(0, i);
      cx.lineTo(canvas.width, i);
      cx.stroke();

    }


  }



  public drawThreading(loom: Loom, loom_settings: LoomSettings, canvas: HTMLCanvasElement, cell_size: number, pixel_ratio: number, show_loom: boolean): Promise<string> {

    if (canvas == null || canvas == undefined) {
      return Promise.resolve('canvas null in drawThreading')
    }
    const threadingCx = canvas.getContext('2d');


    if (loom == null || loom.threading == null) {
      threadingCx.clearRect(0, 0, threadingCx.canvas.width, threadingCx.canvas.height);
      threadingCx.canvas.width = 0;
      threadingCx.canvas.height = 0;
      threadingCx.canvas.style.width = "0px"
      threadingCx.canvas.style.height = "0px"

      if (show_loom) return Promise.resolve('loom or threading is null in drawThreading');
      else return Promise.resolve('')

    }


    const frames = Math.max(numFrames(loom), loom_settings.frames);
    threadingCx.canvas.width = cell_size * loom.threading.length * pixel_ratio;
    threadingCx.canvas.height = cell_size * frames * pixel_ratio;
    threadingCx.canvas.style.width = (cell_size * loom.threading.length) + "px"
    threadingCx.canvas.style.height = (cell_size * frames) + "px"
    threadingCx.clearRect(0, 0, threadingCx.canvas.width, threadingCx.canvas.height);

    this.drawGrid(threadingCx, canvas, cell_size, pixel_ratio);

    for (var j = 0; j < loom.threading.length; j++) {
      this.drawLoomCell(loom, loom_settings, cell_size * pixel_ratio, threadingCx, loom.threading[j], j, "threading");
    }

    return Promise.resolve('');

  }

  private drawTreadling(loom: Loom, loom_settings: LoomSettings, canvas: HTMLCanvasElement, cell_size: number, pixel_ratio: number, show_loom: boolean): Promise<string> {

    if (canvas == null || canvas == undefined) {
      return Promise.resolve('canvas null in drawTreadling')
    }


    const treadlingCx = canvas.getContext('2d');
    const treadles = Math.max(numTreadles(loom), loom_settings.treadles);

    if (loom == null || loom.treadling == null) {
      treadlingCx.clearRect(0, 0, treadlingCx.canvas.width, treadlingCx.canvas.height);
      treadlingCx.canvas.width = 0;
      treadlingCx.canvas.height = 0;
      treadlingCx.canvas.style.width = "0px"
      treadlingCx.canvas.style.height = "0px"
      if (show_loom) return Promise.resolve('loom or threading is null in drawTreadling');
      else return Promise.resolve('')
    }

    treadlingCx.canvas.width = cell_size * treadles * pixel_ratio;
    treadlingCx.canvas.height = cell_size * loom.treadling.length * pixel_ratio;
    treadlingCx.canvas.style.width = (cell_size * treadles) + "px";
    treadlingCx.canvas.style.height = (cell_size * loom.treadling.length) + "px";
    treadlingCx.clearRect(0, 0, treadlingCx.canvas.width, treadlingCx.canvas.height);

    this.drawGrid(treadlingCx, canvas, cell_size, pixel_ratio);

    for (var i = 0; i < loom.treadling.length; i++) {
      loom.treadling[i].forEach(cell => {
        this.drawLoomCell(loom, loom_settings, cell_size * pixel_ratio, treadlingCx, i, cell, "treadling");
      })
    }

    return Promise.resolve('');


  }

  private drawTieups(loom: Loom, loom_settings: LoomSettings, canvas: HTMLCanvasElement, cell_size: number, pixel_ratio: number, show_loom: boolean): Promise<string> {

    if (canvas == null || canvas == undefined) {
      return Promise.resolve('canvas null in drawTreadling')
    }

    const tieupCx = canvas.getContext('2d');
    const treadles = Math.max(numTreadles(loom), loom_settings.treadles);
    const frames = Math.max(numFrames(loom), loom_settings.frames);


    if (loom == null || loom.tieup == null) {
      tieupCx.clearRect(0, 0, tieupCx.canvas.width, tieupCx.canvas.height);
      tieupCx.canvas.width = 0;
      tieupCx.canvas.height = 0;
      tieupCx.canvas.style.width = "0px"
      tieupCx.canvas.style.height = "0px"
      if (show_loom) return Promise.resolve('loom or tieup is null in drawTieup');
      else return Promise.resolve('')
    }


    tieupCx.canvas.width = cell_size * treadles * pixel_ratio;
    tieupCx.canvas.height = cell_size * frames * pixel_ratio;
    tieupCx.canvas.style.width = (cell_size * treadles) + "px";
    tieupCx.canvas.style.height = (cell_size * frames) + "px";
    tieupCx.clearRect(0, 0, tieupCx.canvas.width, tieupCx.canvas.height);

    this.drawGrid(tieupCx, canvas, cell_size, pixel_ratio);


    for (var i = 0; i < loom.tieup.length; i++) {
      for (var j = 0; j < loom.tieup[i].length; j++) {
        if (loom.tieup[i][j]) {
          this.drawLoomCell(loom, loom_settings, cell_size * pixel_ratio, tieupCx, i, j, "tieup");
        }
      }
    }

    return Promise.resolve('');

  }

  private drawDrawdown(draft: Draft, canvas: HTMLCanvasElement, cell_size: number, pixel_ratio: number, rf: RenderingFlags): Promise<string> {


    if (canvas == null || canvas == undefined) {
      return Promise.resolve('drawdown canvas was null');
    }

    //a workaround that goes back to the canvas to render, since it's better for drawing
    return this.drawDrawdownAsCanvas(draft, canvas, cell_size, pixel_ratio, rf);


    // const draft_cx: any = canvas.getContext("2d");

    // if (draft === null || draft.drawdown == null) {
    //   canvas.width = 0;
    //   canvas.height = 0;
    //   canvas.style.width = "0px";
    //   canvas.style.height = "0px";
    //   return Promise.resolve('draft or drawdown was null');
    // } else {

    //   canvas.width = warps(draft.drawdown) * cell_size * pixel_ratio;
    //   canvas.height = wefts(draft.drawdown) * cell_size * pixel_ratio;
    //   canvas.style.width = (warps(draft.drawdown) * cell_size) + "px";
    //   canvas.style.height = (wefts(draft.drawdown) * cell_size) + "px";


    //   let img = getDraftAsImage(draft, cell_size * pixel_ratio, rf.use_floats, rf.use_colors, this.ms.getShuttles());
    //   draft_cx.putImageData(img, 0, 0);
    //   return Promise.resolve('');
    // }
  }

  private drawAsDraft(draft: Draft, draft_cx: any, cell_size: number, pixel_ratio: number, rf: RenderingFlags): Promise<string> {
    const totalCells = warps(draft.drawdown) * wefts(draft.drawdown);
    const totalRows = wefts(draft.drawdown);
    const startTime = performance.now();

    const unit = cell_size * pixel_ratio;
    for (let i = 0; i < wefts(draft.drawdown); i++) {
      // Log progress every 10% for large drafts
      if (totalRows > 100 && i % Math.floor(totalRows / 10) === 0) {
        const progress = ((i / totalRows) * 100).toFixed(0);
      }

      for (let j = 0; j < warps(draft.drawdown); j++) {
        switch (getCellValue(draft.drawdown[i][j])) {
          case true:
            draft_cx.fillStyle = "black";
            break;
          case false:
            draft_cx.fillStyle = "white";
            break;
          default:
            draft_cx.fillStyle = "transparent";
            break;
        }

        draft_cx.strokeStyle = "#333333";
        draft_cx.lineWidth = 1;
        draft_cx.strokeRect(j * unit, i * unit, unit, unit);
        draft_cx.fillRect(j * unit, i * unit, unit, unit);
      }
    }

    const duration = performance.now() - startTime;
    return Promise.resolve('');


  }

  private drawAsCloth(draft: Draft, draft_cx: any, cell_size: number, pixel_ratio: number, rf: RenderingFlags): Promise<string> {
    const totalCells = warps(draft.drawdown) * wefts(draft.drawdown);
    const totalRows = wefts(draft.drawdown);
    const startTime = performance.now();

    const unit = cell_size * pixel_ratio;
    let margin = 2;
    if (unit <= 4) {
      margin = 1;
    } else if (unit <= 2) {
      margin = 0;
    }
    let yarn = unit - (2 * margin)
    //draw warps as a base color
    for (let j = 0; j < warps(draft.drawdown); j++) {
      let color = this.ms.getColor(draft.colShuttleMapping[j]);
      draft_cx.fillStyle = color;
      draft_cx.fillRect(j * unit + margin, 0, yarn, unit * wefts(draft.drawdown));
    }

    for (let i = 0; i < wefts(draft.drawdown); i++) {
      // Log progress every 10% for large drafts
      if (totalRows > 100 && i % Math.floor(totalRows / 10) === 0) {
        const progress = ((i / totalRows) * 100).toFixed(0);
      }

      for (let j = 0; j < warps(draft.drawdown); j++) {
        let cell_val = getCellValue(draft.drawdown[i][j]);
        let color = this.ms.getColor(draft.rowShuttleMapping[i]);
        draft_cx.fillStyle = color;
        if (cell_val == true) {
          //add the traces of the weft to the left and right
          draft_cx.fillRect(j * unit, i * unit + margin, margin, yarn);
          draft_cx.fillRect(j * unit + (margin + yarn), i * unit + margin, margin, yarn);

        } else if (cell_val == false) {
          draft_cx.fillRect(j * unit - margin, i * unit + margin, unit + margin * 2, yarn);
        }
      }
    }

    const duration = performance.now() - startTime;
    return Promise.resolve('');
  }

  private drawAsFloats(draft: Draft, draft_cx: any, cell_size: number, pixel_ratio: number, rf: RenderingFlags): Promise<string> {
    const totalCells = warps(draft.drawdown) * wefts(draft.drawdown);
    const totalRows = wefts(draft.drawdown);
    const startTime = performance.now();

    draft_cx.globalAlpha = 1;
    const unit = cell_size * pixel_ratio;
    let margin = 2;
    if (unit <= 4) {
      margin = 1;
    } else if (unit <= 2) {
      margin = 0;
    }
    margin = 0;
    let yarn = unit - (2 * margin);
    draft_cx.strokeStyle = "#000000";
    draft_cx.lineWidth = 1;
    draft_cx.fillStyle = "#ffffff";
    //draw warps as a base color
    for (let j = 0; j < warps(draft.drawdown); j++) {
      let color = this.ms.getColor(draft.colShuttleMapping[j]);

      draft_cx.fillRect(j * unit + margin, 0, yarn, unit * wefts(draft.drawdown));
      draft_cx.strokeRect(j * unit + margin, 0, yarn, unit * wefts(draft.drawdown));
    }

    for (let i = 0; i < wefts(draft.drawdown); i++) {
      // Log progress every 10% for large drafts
      if (totalRows > 100 && i % Math.floor(totalRows / 10) === 0) {
        const progress = ((i / totalRows) * 100).toFixed(0);
      }

      for (let j = 0; j < warps(draft.drawdown); j++) {
        let cell_val = getCellValue(draft.drawdown[i][j]);
        if (cell_val == false) {

          draft_cx.fillRect(j * unit - margin - 1, i * unit + margin, unit + margin * 2 + 2, yarn);
          draft_cx.beginPath(); // Start a new path

          draft_cx.moveTo(j * unit - margin, i * unit + margin); // Move the pen to (30, 50)
          draft_cx.lineTo(j * unit - margin + unit, i * unit + margin); // Draw a line to (150, 100)
          draft_cx.stroke(); // Render the path
          draft_cx.closePath();

          draft_cx.moveTo(j * unit - margin, i * unit + margin + yarn); // Move the pen to (30, 50)
          draft_cx.lineTo(j * unit - margin + unit, i * unit + margin + yarn); // Draw a line to (150, 100)
          draft_cx.stroke(); // Render the path
          draft_cx.closePath();

        }
      }
    }

    for (let i = 0; i < wefts(draft.drawdown); i++) {
      for (let j = 0; j < warps(draft.drawdown); j++) {
        let cell_val = getCellValue(draft.drawdown[i][j]);
        if (cell_val == true) {

          draft_cx.beginPath(); // Start a new path
          draft_cx.moveTo(j * unit + margin, i * unit); // Move the pen to (30, 50)
          draft_cx.lineTo(j * unit + margin, i * unit + unit); // Draw a line to (150, 100)
          draft_cx.stroke(); // Render the path
          draft_cx.closePath();

          draft_cx.beginPath(); // Start a new path
          draft_cx.moveTo(j * unit + margin + yarn, i * unit); // Move the pen to (30, 50)
          draft_cx.lineTo(j * unit + margin + yarn, i * unit + unit); // Draw a line to (150, 100)
          draft_cx.stroke(); // Render the path
          draft_cx.closePath();

        }
      }
    }

    const duration = performance.now() - startTime;
    return Promise.resolve('');
  }

  /**
   * the canvas is going to be much better for user edits since it doesn't have to recompet and draw. 
   * @param draft 
   * @param canvas 
   * @param cell_size 
   * @param pixel_ratio 
   * @param rf 
   * @returns 
   */
  private drawDrawdownAsCanvas(draft: Draft, canvas: HTMLCanvasElement, cell_size: number, pixel_ratio: number, rf: RenderingFlags): Promise<string> {
    const size = `${warps(draft.drawdown)}x${wefts(draft.drawdown)}`;
    const totalCells = warps(draft.drawdown) * wefts(draft.drawdown);
    const drawStartTime = performance.now();




    /**
     * get draft as image seems to consider the rotation and canvas doesn't. 
     */

    if (canvas == null || canvas == undefined) {
      return Promise.resolve('drawdown canvas was null');
    }

    cell_size = cell_size / pixel_ratio;
    const draft_cx: any = canvas.getContext("2d");
    canvas.width = warps(draft.drawdown) * cell_size * pixel_ratio;
    canvas.height = wefts(draft.drawdown) * cell_size * pixel_ratio;
    canvas.style.width = (warps(draft.drawdown) * cell_size) + "px";
    canvas.style.height = (wefts(draft.drawdown) * cell_size) + "px";
    draft_cx.fillStyle = "#F5F5F5";
    draft_cx.fillRect(0, 0, canvas.width, canvas.height);

    if (!rf.use_colors && !rf.use_floats) {
      return this.drawAsDraft(draft, draft_cx, cell_size, pixel_ratio, rf).then(result => {
        const duration = performance.now() - drawStartTime;
        return result;
      });
    } else if (rf.use_floats == true && rf.use_colors == false) {
      return this.drawAsFloats(draft, draft_cx, cell_size, pixel_ratio, rf).then(result => {
        const duration = performance.now() - drawStartTime;
        return result;
      });
    } else {
      return this.drawAsCloth(draft, draft_cx, cell_size, pixel_ratio, rf).then(result => {
        const duration = performance.now() - drawStartTime;
        return result;
      });
    }


  }


  /**
  * gets the default canvas width (before scaling) of rendering this draft in the current context 
  * which is used to make the canvas fit the scaled content
  */
  getBaseDimensions(draft: Draft, canvas: HTMLCanvasElement, out_format: string): { width: number, height: number } {
    //  let pixel_ratio = this.getPixelRatio(canvas);
    let cell_size = this.calculateCellSize(draft, out_format);

    return {
      width: warps(draft.drawdown) * cell_size * this.pixel_ratio,
      height: wefts(draft.drawdown) * cell_size * this.pixel_ratio
    };

  }




  // getPixelRatio(canvas: HTMLCanvasElement) {
  //   const draft_cx: any = canvas.getContext("2d");
  //   let dpr = window.devicePixelRatio || 1;
  //   let bsr = draft_cx.webkitBackingStorePixelRatio ||
  //     draft_cx.mozBackingStorePixelRatio ||
  //     draft_cx.msBackingStorePixelRatio ||
  //     draft_cx.oBackingStorePixelRatio ||
  //     draft_cx.backingStorePixelRatio || 1;
  //   return dpr / bsr;
  // }


  clear(canvases: CanvasList): Promise<CanvasList> {

    let drawdownCx = canvases.drawdown.getContext('2d');
    drawdownCx.clearRect(0, 0, drawdownCx.canvas.width, drawdownCx.canvas.height);

    let threadingCx = canvases.threading.getContext('2d');
    threadingCx.clearRect(0, 0, threadingCx.canvas.width, threadingCx.canvas.height)

    let tieupCx = canvases.tieup.getContext('2d');
    tieupCx.clearRect(0, 0, tieupCx.canvas.width, tieupCx.canvas.height)

    let treadlingCx = canvases.treadling.getContext('2d');
    treadlingCx.clearRect(0, 0, treadlingCx.canvas.width, treadlingCx.canvas.height)

    let warpMatCx = canvases.warp_mats.getContext('2d');
    warpMatCx.clearRect(0, 0, warpMatCx.canvas.width, warpMatCx.canvas.height)

    let warpSysCx = canvases.warp_systems.getContext('2d');
    warpSysCx.clearRect(0, 0, warpSysCx.canvas.width, warpSysCx.canvas.height)

    let weftMatCx = canvases.weft_mats.getContext('2d');
    weftMatCx.clearRect(0, 0, weftMatCx.canvas.width, weftMatCx.canvas.height)

    let weftSysCx = canvases.weft_systems.getContext('2d');
    weftSysCx.clearRect(0, 0, weftSysCx.canvas.width, weftSysCx.canvas.height)


    return Promise.resolve(canvases);

  }


  /**
   * this draw function is inteded to be called from the tree when a draft node value requires recomputation. 
   * @param draft 
   * @returns 
   */
  async getDraftCanvases(draft: Draft, loom: Loom, loom_settings: LoomSettings, overrideOversize: boolean = false, rf: RenderingFlags): Promise<CanvasList> {
    const sharedCanvasList: CanvasList = {
      id: draft.id,
      drawdown: new HTMLCanvasElement(),
      threading: new HTMLCanvasElement(),
      tieup: new HTMLCanvasElement(),
      treadling: new HTMLCanvasElement(),
      warp_systems: new HTMLCanvasElement(),
      warp_mats: new HTMLCanvasElement(),
      weft_systems: new HTMLCanvasElement(),
      weft_mats: new HTMLCanvasElement()
    }

    let cell_size = this.calculateCellSize(draft, 'canvas');
    let fns = [];

    const area = warps(draft.drawdown) * wefts(draft.drawdown);
    const oversize = (area > this.ws.oversize_dim_threshold)
    const sizeError = (area > this.ws.max_draft_input_area)
    if (draft.drawdown.length == 0 || (oversize && !overrideOversize) || sizeError) {
      this.clear(sharedCanvasList).then(canvases => {
        return Promise.resolve(canvases);
      });
    }


    if (rf.u_drawdown) {
      fns = fns.concat(this.drawDrawdown(draft, sharedCanvasList.drawdown, cell_size, this.pixel_ratio, rf));
    }

    if (rf.u_warp_mats || rf.u_warp_sys) {
      fns = fns.concat(this.drawWarpData(draft, cell_size, this.pixel_ratio, sharedCanvasList.warp_systems, sharedCanvasList.warp_mats));
    }

    if (rf.u_weft_mats || rf.u_weft_sys) {
      fns = fns.concat(this.drawWeftData(draft, cell_size, this.pixel_ratio, sharedCanvasList.weft_systems, sharedCanvasList.weft_mats));
    }

    if (rf.u_threading) {
      fns = fns.concat(this.drawThreading(loom, loom_settings, sharedCanvasList.threading, cell_size, this.pixel_ratio, rf.show_loom));
    }

    if (rf.u_treadling) {
      fns = fns.concat(this.drawTreadling(loom, loom_settings, sharedCanvasList.treadling, cell_size, this.pixel_ratio, rf.show_loom));
    }

    if (rf.u_tieups) {
      fns = fns.concat(this.drawTieups(loom, loom_settings, sharedCanvasList.tieup, cell_size, this.pixel_ratio, rf.show_loom));
    }

    return Promise.all(fns).then(errs => {

      return Promise.resolve(sharedCanvasList);
    });
  }


  /**
   * draw whatever is stored in the draft object to the screen
   * @returns 
   */
  private async drawDraft(draft: Draft, loom: Loom, loom_settings: LoomSettings, canvases: CanvasList, rf: RenderingFlags): Promise<boolean> {
    const renderStartTime = performance.now();

    let fns = [];
    // set the width and height
    // let pixel_ratio = this.getPixelRatio(canvases.drawdown);
    let cell_size = this.calculateCellSize(draft, 'canvas');

    if (draft.drawdown.length == 0) {
      return this.clear(canvases).then(canvases => {
        return Promise.resolve(true);
      });
    }

    if (rf.u_drawdown) {
      fns = fns.concat(this.drawDrawdown(draft, canvases.drawdown, cell_size, this.pixel_ratio, rf));
    }

    if (rf.u_warp_mats || rf.u_warp_sys) {
      fns = fns.concat(this.drawWarpData(draft, cell_size, this.pixel_ratio, canvases.warp_systems, canvases.warp_mats));
    }

    if (rf.u_weft_mats || rf.u_weft_sys) {
      fns = fns.concat(this.drawWeftData(draft, cell_size, this.pixel_ratio, canvases.weft_systems, canvases.weft_mats));
    }

    if (rf.u_threading) {
      fns = fns.concat(this.drawThreading(loom, loom_settings, canvases.threading, cell_size, this.pixel_ratio, rf.show_loom));
    }

    if (rf.u_treadling) {
      fns = fns.concat(this.drawTreadling(loom, loom_settings, canvases.treadling, cell_size, this.pixel_ratio, rf.show_loom));
    }

    if (rf.u_tieups) {
      fns = fns.concat(this.drawTieups(loom, loom_settings, canvases.tieup, cell_size, this.pixel_ratio, rf.show_loom));
    }

    return Promise.all(fns).then(errs => {
      const duration = performance.now() - renderStartTime;

      errs.forEach(el => {
        if (el !== '') console.error(el);
      })

      return Promise.resolve(true);

    });


  }


  /**
   * when the parent div is rescaled on zoom in and out, the container does not change size unless the canvases change size as well.
   * this function, then, is a hack that forces the rendering to change size while also changing the size of the container by manually resetting the 
   * size of the canvases 
   * @param draft 
   * @param factor 
   * @param canvases 
   */
  private async rescaleCanvases(draft: Draft, loom: Loom, loom_settings: LoomSettings, factor: number, canvases: CanvasList): Promise<boolean> {
    // let pixel_ratio = this.getPixelRatio(canvases.drawdown);
    let cell_size = this.calculateCellSize(draft, 'canvas');


    canvases.drawdown.style.width = (warps(draft.drawdown) * cell_size * factor) + "px";
    canvases.drawdown.style.height = (wefts(draft.drawdown) * cell_size * factor) + "px";

    if (loom !== null) {
      let frames = Math.max(numFrames(loom), loom_settings.frames);
      let treadles = Math.max(numTreadles(loom), loom_settings.treadles);

      canvases.threading.style.width = (cell_size * loom.threading.length) * factor + "px"
      canvases.threading.style.height = (cell_size * frames) * factor + "px"

      canvases.treadling.style.width = (cell_size * treadles) * factor + "px";
      canvases.treadling.style.height = (cell_size * loom.treadling.length) * factor + "px";

      canvases.tieup.style.width = (cell_size * treadles) * factor + "px";
      canvases.tieup.style.height = (cell_size * frames) * factor + "px";


    }

    canvases.warp_mats.style.width = (draft.colShuttleMapping.length * cell_size) * factor + "px";
    canvases.warp_mats.style.height = defaults.draft_detail_cell_size * factor + "px";


    canvases.warp_systems.style.width = (draft.colSystemMapping.length * cell_size * factor) + "px";
    canvases.warp_systems.style.height = defaults.draft_detail_cell_size * factor + "px";

    canvases.weft_mats.style.height = (draft.rowSystemMapping.length * cell_size) * factor + "px";
    canvases.weft_mats.style.width = defaults.draft_detail_cell_size * factor + "px";

    canvases.weft_systems.style.height = (draft.rowShuttleMapping.length * cell_size) * factor + "px";
    canvases.weft_systems.style.width = defaults.draft_detail_cell_size * factor + "px";

    return Promise.resolve(true);

  }




  /**
   * given a canvas and a container, this view calculates how much the object should be scaled in order to fit into the canvas. 
   * @param container 
   * @param canvas 
   * @returns 
   */
  private getInitialTransform(container: HTMLElement, canvas: HTMLCanvasElement): number {
    /* now recalc the scale based on the draft size: */
    //  let div_draftviewer = document.getElementById('static_draft_view');
    let rect_viewer = container.getBoundingClientRect();

    let adj = 1;
    let canvas_width = canvas.width;
    let canvas_height = canvas.height;


    //get the ration of the view to the item
    let width_adj = rect_viewer.width / canvas_width;
    let height_adj = rect_viewer.height / canvas_height;

    //make the zoom the larger of the width or height
    adj = Math.min(width_adj, height_adj);

    if (adj < 1) {
      return adj;
      //canvas.style.transform = 'scale('+adj+')';
      // this.draft_canvas.width = (warps(draft.drawdown)*cell_size*adj);
      // this.draft_canvas.height = (wefts(draft.drawdown)*cell_size*adj);
      // this.draft_canvas.style.width = (warps(draft.drawdown)*cell_size*adj)+"px";
      // this.draft_canvas.style.height = (wefts(draft.drawdown)*cell_size*adj)+"px";
    }
    else return 1;
  }
}






