import { Directive, EventEmitter, HostListener, Output } from '@angular/core';
import { Subject } from 'rxjs';
import { RenderService } from '../draftdetail/provider/render.service';
import { ZoomService } from '../mixer/provider/zoom.service';
import { FileService } from './provider/file.service';
import { StateService } from './provider/state.service';

@Directive({
  selector: 'appKeycodes'
})
export class KeycodesDirective {

  mixer_has_focus = true;

  @Output() onUndo: any = new EventEmitter();
  @Output() onRedo: any = new EventEmitter();
  @Output() updateMixerView: any = new EventEmitter();
  @Output() updateDetailView: any = new EventEmitter();


  constructor( 
    private zs: ZoomService, 
    private fs: FileService,
    private ss: StateService,
    private render: RenderService) { 
    }



    /**
     * Set a listern to keep track of the location that the user last clicked
     * @param event 
     */
    @HostListener('window:mousedown', ['$event'])
    onMouseDown(event: MouseEvent) { 
      if((<HTMLElement>event.target).id == 'scrollable-container') this.mixer_has_focus = true;
      if((<HTMLElement>event.target).id == 'draft-container') this.mixer_has_focus = false;

    }
  


  

  @HostListener('window:keydown', ['$event'])
  private keyEventDetected(e) {

  /**
   * ZOOM IN 
   */
    if(e.key =="=" && e.metaKey){

      if(!this.mixer_has_focus){
        console.log("ZOOM IN ON RENDER", e,  e.target);
        this.render.zoomIn();
        this.updateDetailView.emit();
        return false;
      }else{
        console.log("ZOOM IN on MIXER", e,  e.target)
        const old_zoom = this.zs.zoom;
        this.zs.zoomIn();
        this.updateMixerView.emit(old_zoom);
        return false;

      }

     
    }
  /**
   *  ZOOM OUT 
   */
    if(e.key =="-" && e.metaKey){

      if(!this.mixer_has_focus){
        console.log("ZOOM IN ON RENDER", e,  e.target);
        this.render.zoomOut();
        this.updateDetailView.emit();
        return false;
      }else{
        console.log("ZOOM IN on MIXER", e,  e.target)
        const old_zoom = this.zs.zoom;
        this.zs.zoomOut();
        this.updateMixerView.emit(old_zoom);
        return false;

      }
    }

    
  /**
   * SAVE
   */
    if(e.key =="s" && e.metaKey){
    this.fs.saver.ada(
      'mixer', 
      true,
      this.zs.zoom)
      .then(so => {
        this.ss.addMixerHistoryState(so);
      });
      e.preventDefault();
    }


    /**
     * UNDO
     */
    if(e.key =="z" && e.metaKey){
    this.onUndo.emit();
    }

    /**
     * REDO
     */
    if(e.key =="y" && e.metaKey){
    this.onRedo.emit();
    }

   

  // /**
  //  * Sets selected area to clear
  //  * @extends WeaveComponent
  //  * @param {Event} delete key pressed
  //  * @returns {void}
  //  */

  // @HostListener('window:keydown.e', ['$event'])
  // private keyEventErase(e) {

  //   this.dm.selectDesignMode('down','draw_modes');
  //   this.weaveRef.unsetSelection();
  // }

  // /**
  //  * Sets brush to point on key control + d.
  //  * @extends WeaveComponent
  //  * @param {Event} e - Press Control + d
  //  * @returns {void}
  //  */
  // @HostListener('window:keydown.d', ['$event'])
  // private keyEventPoint(e) {
  //   this.dm.selectDesignMode('up','draw_modes');
  //   this.weaveRef.unsetSelection();

  // }

  // /**
  //  * Sets brush to select on key control + s
  //  * @extends WeaveComponent
  //  * @param {Event} e - Press Control + s
  //  * @returns {void}
  //  */
  // @HostListener('window:keydown.s', ['$event'])
  // private keyEventSelect(e) {
  //   this.dm.selectDesignMode('select','design_modes');
  //   this.weaveRef.unsetSelection();

  // }

  // /**
  //  * Sets key control to invert on control + x
  //  * @extends WeaveComponent
  //  * @param {Event} e - Press Control + x
  //  * @returns {void}
  //  */
  // @HostListener('window:keydown.x', ['$event'])
  // private keyEventInvert(e) {

  //   this.dm.selectDesignMode('toggle','draw_modes');
  //   this.weaveRef.unsetSelection();

  // }

  // /**
  //  * Sets key to copy 
  //  * @extends WeaveComponent
  //  * @param {Event} e - Press Control + x
  //  * @returns {void}
  //  */
  // // @HostListener('window:keydown.c', ['$event'])
  // // private keyEventCopy(e) {
  // //   this.onCopy();  
  // // }

  //   /**
  //  * Sets key to copy 
  //  * @extends WeaveComponent
  //  * @param {Event} e - Press Control + x
  //  * @returns {void}
  //  */
  // @HostListener('window:keydown.p', ['$event'])
  // private keyEventPaste(e) {
  //   this.weaveRef.onPaste({});
  // }


  // }



}
}