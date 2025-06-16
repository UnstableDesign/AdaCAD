import { Directive, EventEmitter, HostListener, Output } from '@angular/core';
import { DesignmodesService } from './provider/designmodes.service';
import { FileService } from './provider/file.service';
import { StateService } from './provider/state.service';
import { ViewadjustService } from './provider/viewadjust.service';

@Directive({
  selector: 'appKeycodes'
})
export class EventsDirective {
  
  mixer_has_focus = true;
  event_on_input_flag = false;
  
  @Output() onUndo: any = new EventEmitter();
  @Output() onRedo: any = new EventEmitter();
  @Output() zoomOut: any = new EventEmitter();
  @Output() zoomIn: any = new EventEmitter();
  @Output() updateMixerView: any = new EventEmitter();
  @Output() updateDetailView: any = new EventEmitter();
  @Output() onCopySelections: any = new EventEmitter();
  @Output() onPasteSelections: any = new EventEmitter();
  @Output() onDrawModeChange: any = new EventEmitter();
  @Output() onExplode: any = new EventEmitter();
  @Output() onWindowResize: any = new EventEmitter();
  
  constructor( 
    private fs: FileService,
    private ss: StateService,
    private dm: DesignmodesService, 
    private vas: ViewadjustService) { 
    }
    
    
    @HostListener('window:resize', ['$event'])
    onResize(event) {
      this.vas.updateFromWindowResize(event.target.innerWidth);
      this.onWindowResize.emit();
    }
    
    /**
    * check the series of the targets for this mouse or key event and see if it tracks to 
    */
    
    
    @HostListener('window:keydown', ['$event'])
    private keyEventDetected(e) {
      
      
      /**
      * ZOOM IN 
      */
      if(e.key =="=" && e.metaKey){
        
        this.zoomIn.emit();
        return false;
        
        
        
      }
      /**
      *  ZOOM OUT 
      */
      if(e.key =="-" && e.metaKey){
        
        this.zoomOut.emit();
        return false;
        
      }
      
      
      /**
      * SAVE
      */
      if(e.key =="s" && e.metaKey){
        this.fs.saver.ada()
        .then(so => {
          const err = this.ss.addMixerHistoryState(so);
          if(err == 1){
            //TO DO: handle error state
          }
        });
        e.preventDefault();
      }
      
      
      /**
      * TOGGLE DRAW / SELECT MODE
      */
      if(e.key =="d" && e.metaKey){
        
        if(this.dm.cur_draft_edit_mode == 'select'){
          this.onDrawModeChange.emit('toggle')
        }else if(this.dm.cur_draft_edit_mode == 'draw'){
          this.dm.selectDraftEditingMode('select');
        }
        e.preventDefault()
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
      
      
      /**
      * Copy
      */
      if(e.key =="c" && e.metaKey){
        this.onCopySelections.emit();
      }
      
      /**
      * PASTE
      */
      if(e.key =="v" && e.metaKey){
        this.onPasteSelections.emit();
      }
      
      
      /**
      * Explode (move every top left position by a factor of 10 (a hack to work with older files))
      */
      if(e.key =="e" && e.metaKey){
        this.onExplode.emit();
      }
      
      
      
    }
  }