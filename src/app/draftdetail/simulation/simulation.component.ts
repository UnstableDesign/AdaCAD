import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { TreeService } from '../../core/provider/tree.service';
import { SimulationService } from '../../core/provider/simulation.service';
import { Draft, Interlacement, LoomSettings } from '../../core/model/datatypes';
import * as THREE from 'three';
import { convertEPItoMM } from '../../core/model/looms';
import { MaterialsService } from '../../core/provider/materials.service';
import { createCell, getCellValue } from '../../core/model/cell';
import { initDraftFromDrawdown } from '../../core/model/drafts';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {


  
  @Input('id') id;
  @Output() onExpanded = new EventEmitter();

  renderer;
  scene;
  camera;
  draft: Draft;
  loom_settings: LoomSettings;
  sim_expanded: boolean = false;
  layer_spacing: number = 10;
  layer_threshold: number = 2;
  warp_threshold: number = 2;
  max_interlacement_width: number = 10;
  max_interlacement_height: number = 10;
  showing_warp_layer_map: boolean = false;
  showing_weft_layer_map: boolean = false;
  showing_warps: boolean = true;
  showing_wefts: boolean = true;
  showing_topo: boolean = false;
  showing_draft: boolean = false;
  boundary: number = 10;


  constructor(private tree: TreeService, public ms: MaterialsService,  public simulation: SimulationService) {

  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    
    this.onWindowResize();
  }

  ngOnInit(): void {

    
  }

  ngAfterViewInit(){
    const div = document.getElementById('simulation_container');
    this.renderer = new THREE.WebGLRenderer();
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
    this.renderer.setSize(div.offsetWidth, div.offsetHeight);
    div.appendChild(this.renderer.domElement);
  }

  calcDefaultLayerSpacing(draft: Draft){

    let max_weft = draft.rowShuttleMapping.reduce((acc, val) => {
      let diam = this.ms.getDiameter(val);
      if(diam > acc) return diam;
      return acc;
    }, 0);

    let max_warp = draft.colShuttleMapping.reduce((acc, val) => {
      let diam = this.ms.getDiameter(val);
      if(diam > acc) return diam;
      return acc;
    }, 0);

    return (max_weft/2 + max_warp/2) * 10;

  }


  endSimulation(){
    this.simulation.endSimulation(this.scene);
  }

  drawSimulation(draft: Draft, loom_settings: LoomSettings){
    this.layer_spacing = this.calcDefaultLayerSpacing(draft);

    this.draft = draft;
    this.loom_settings = loom_settings;
    this.layer_spacing = this.calcDefaultLayerSpacing(draft);
  
    this.simulation.setupSimulation(
      draft, 
      this.renderer, 
      this.scene, 
      this.camera, 
      this.layer_threshold, 
      this.warp_threshold, convertEPItoMM(loom_settings), 
      this.layer_spacing, 
      this.max_interlacement_width,
      this.max_interlacement_height, 
      this.boundary,
      this.ms)
      .then(simdata => {
      this.simulation.renderSimdata(
        this.scene, 
        simdata, 
        this.showing_warps, 
        this.showing_wefts, 
        this.showing_warp_layer_map, 
        this.showing_weft_layer_map, 
        this.showing_topo, 
        this.showing_draft);

    })


  }

  /**
   * creates a new draft from a subset of an input draft, and tells the simulator to draw that portion
   * @param draft 
   * @param loom_settings 
   * @param start 
   * @param end 
   */
  updateSelection(draft: Draft, loom_settings:LoomSettings, start: Interlacement, end: Interlacement){

    let dd = [];
    let rowShuttle = [];
    let rowSystem = [];
    let colShuttle = [];
    let colSystem = [];
    
    for(let i = start.i; i < end.i; i++){
        dd.push([]);
        rowShuttle.push(draft.rowShuttleMapping[i]);
        rowSystem.push(draft.rowSystemMapping[i]);

      for(let j = start.j; j < end.j; j++){
        if(i == start.i){
          colShuttle.push(draft.colShuttleMapping[j]);
          colSystem.push(draft.rowSystemMapping[j]);
        }
        dd[i-start.i].push(createCell(getCellValue(draft.drawdown[i][j])));
      }
    }

    let new_draft = initDraftFromDrawdown(dd);
    this.updateSimulation(new_draft, loom_settings);
    


  }

  updateSimulation(draft: Draft, loom_settings){
    this.draft = draft;
    this.loom_settings = loom_settings;
    this.simulation.recalcSimData(
      this.scene, 
      draft, 
      convertEPItoMM(this.loom_settings), 
      this.layer_spacing, 
      this.layer_threshold, 
      this.max_interlacement_width, 
      this.max_interlacement_height,
      this.boundary,
      this.ms
      ).then(simdata => {
      this.simulation.renderSimdata(this.scene, simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map, this.showing_weft_layer_map, this.showing_topo, this.showing_draft);
    });

  }

  changeLayerThreshold(){
    this.simulation.recalcSimData(
      this.scene, 
      this.draft, 
      convertEPItoMM(this.loom_settings), 
      this.layer_spacing, 
      this.layer_threshold, 
      this.max_interlacement_width, 
      this.max_interlacement_height,
      this.boundary,
      this.ms
      ).then(simdata => {
      this.simulation.renderSimdata(this.scene, simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map, this.showing_weft_layer_map, this.showing_topo, this.showing_draft);
    });
  }


  toggleWefts(){
    if(!this.showing_wefts) this.simulation.showWefts();
    else this.simulation.hideWefts();
  }

  toggleDraft(){
    if(!this.showing_draft) this.simulation.showDraft();
    else this.simulation.hideDraft();
  }

  toggleWarps(){
    if(!this.showing_warps) this.simulation.showWarps();
    else this.simulation.hideWarps();
  }


  toggleTopo(){
    if(!this.showing_topo) this.simulation.showTopo();
    else this.simulation.hideTopo();
  }

  toggleWeftLayerView(){
    if(!this.showing_weft_layer_map) this.simulation.showWeftLayerMap();
    else this.simulation.hideWeftLayerMap();
  }

  toggleWarpLayerView(){
    if(!this.showing_warp_layer_map) this.simulation.showWarpLayerMap();
    else this.simulation.hideWarpLayerMap();
  }

  changeLayerSpacing(e: any){

    this.simulation.recalcSimData(
      this.scene, 
      this.draft, 
      convertEPItoMM(this.loom_settings), 
      this.layer_spacing, 
      this.layer_threshold, 
      this.max_interlacement_width, 
      this.max_interlacement_height,
      this.boundary,
      this.ms
      ).then(simdata => {
      this.simulation.renderSimdata(this.scene, simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map,this.showing_weft_layer_map,  this.showing_topo, this.showing_draft);
    });
  }

  changeILaceWidth(){

    this.simulation.recalcSimData(
      this.scene, 
      this.draft, 
      convertEPItoMM(this.loom_settings), 
      this.layer_spacing, 
      this.layer_threshold, 
      this.max_interlacement_width, 
      this.max_interlacement_height,
      this.boundary,
      this.ms
      ).then(simdata => {
      this.simulation.renderSimdata(this.scene, simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map, this.showing_weft_layer_map,this.showing_topo, this.showing_draft);
    });
  }

  changeILaceHeight(){

    this.simulation.recalcSimData(
      this.scene, 
      this.draft, 
      convertEPItoMM(this.loom_settings), 
      this.layer_spacing, 
      this.layer_threshold, 
      this.max_interlacement_width, 
      this.max_interlacement_height,
      this.boundary,
      this.ms
      ).then(simdata => {
      this.simulation.renderSimdata(this.scene, simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map, this.showing_weft_layer_map,this.showing_topo, this.showing_draft);
    });
  }


  pageClose(){
    this.simulation.endSimulation(this.scene);
  }

  expand(){
    this.onExpanded.emit();
    this.sim_expanded = !this.sim_expanded;


    if(this.sim_expanded){
      const ex_div = document.getElementById('expanded-container');
      this.renderer.setSize( ex_div.offsetWidth, ex_div.offsetHeight );
      this.camera.aspect = ex_div.offsetWidth /ex_div.offsetHeight ;
    }else{
      const small_div = document.getElementById('simulation_container');

      this.renderer.setSize( small_div.offsetWidth, small_div.offsetHeight );
      this.camera.aspect = small_div.offsetWidth /small_div.offsetHeight ;
    }



  
    this.camera.updateProjectionMatrix();

    this.renderer.render( this.scene, this.camera );
  }

  onWindowResize() {


    if(this.sim_expanded){
      const ex_div = document.getElementById('expanded-container');
      this.renderer.setSize( ex_div.offsetWidth, ex_div.offsetHeight );
      this.camera.aspect = ex_div.offsetWidth /ex_div.offsetHeight ;
    }else{
      const small_div = document.getElementById('simulation_container');

      this.renderer.setSize( small_div.offsetWidth, small_div.offsetHeight );
      this.camera.aspect = small_div.offsetWidth /small_div.offsetHeight ;
    }

    this.camera.updateProjectionMatrix();

    this.renderer.render( this.scene, this.camera );

  }


}
