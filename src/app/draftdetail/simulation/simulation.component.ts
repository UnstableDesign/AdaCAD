import { Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { TreeService } from '../../core/provider/tree.service';
import { SimulationService } from '../../core/provider/simulation.service';
import { Draft, Interlacement, LoomSettings, SimulationData } from '../../core/model/datatypes';
import * as THREE from 'three';
import { convertEPItoMM } from '../../core/model/looms';
import { MaterialsService } from '../../core/provider/materials.service';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { initDraftFromDrawdown, warps, wefts } from '../../core/model/drafts';

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
  controls;
  draft: Draft;
  loom_settings: LoomSettings;
  sim_expanded: boolean = false;
  layer_spacing: number = 10;
  layer_threshold: number = 1;
  warp_threshold: number = 10;
  max_interlacement_width: number = 10;
  max_interlacement_height: number = 10;
  showing_warp_layer_map: boolean = false;
  showing_weft_layer_map: boolean = false;
  showing_warps: boolean = true;
  showing_wefts: boolean = true;
  showing_topo: boolean = false;
  showing_draft: boolean = false;
  boundary: number = 10;
  radius: number = 40;
  current_simdata: SimulationData = null;
  tanFOV: number = 0;
  originalHeight: number = 0; 
  dirty: boolean; //flags the need to recompute 


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


    let width = 2 * window.innerWidth / 3;
    let height = window.innerHeight;


    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize( width, height );
    div.appendChild( this.renderer.domElement );


    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color( 0xf0f0f0 );

    this.camera = new THREE.PerspectiveCamera( 30, width / height, 1, 5000 );
    // this.camera.position.set( 20, 0, 200 );
    // this.camera.lookAt( 0, 0, 0 );  
    this.camera.position.set(0, 0, 500); 
    this.camera.lookAt( this.scene.position );
    this.scene.add(this.camera);


    // this.camera = new THREE.OrthographicCamera(  div.offsetWidth / - 2,  div.offsetWidth / 2,div.offsetHeight / 2, div.offsetHeight / - 2, 1, 1000 );
    // console.log("DIV OFFSET ",div.offsetWidth, div.offsetHeight)
     this.controls = new OrbitControls( this.camera, this.renderer.domElement );


    this.tanFOV = Math.tan( ( ( Math.PI / 180 ) * this.camera.fov / 2 ) );
    this.originalHeight = height;

    this.renderer.render(this.scene, this.camera);

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


  setDirty(){
    this.dirty = true;
  }

  unsetDirty(){
    this.dirty = false;
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
      this.controls,
      this.layer_threshold, 
      this.warp_threshold, convertEPItoMM(loom_settings), 
      this.layer_spacing, 
      this.max_interlacement_width,
      this.max_interlacement_height, 
      this.boundary,
      this.radius,
      this.ms)
      .then(simdata => {
        this.current_simdata = simdata;
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
   * this passes new information to a current rendering, updating which portion of the data we are visualizing. 
   * @param draft 
   * @param loom_settings 
   * @param start 
   * @param end 
   */
  updateSelection(start: Interlacement, end: Interlacement){

    let width = end.j - start.j;
    if(width <= 0) return;

    let height = end.i - start.i;
    if(height <= 0) return;

    this.current_simdata.bounds = {
      topleft: {x: start.j, y: start.i},
      width, height
    }

    this.simulation.renderSimdata(this.scene, this.current_simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map, this.showing_weft_layer_map, this.showing_topo, this.showing_draft);

  }

  unsetSelection(){
    this.current_simdata.bounds = {
      topleft: {x: 0, y: 0},
      width: warps(this.draft.drawdown), 
      height: wefts(this.draft.drawdown)
    }

    this.simulation.renderSimdata(this.scene, this.current_simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map, this.showing_weft_layer_map, this.showing_topo, this.showing_draft);
  }

  /**
   * call this when the simulation needs to be updated due to a structural change. 
   * This will recalculate all the simulation data and then redraw it to screen. 
   * @param draft 
   * @param loom_settings 
   */
  updateSimulation(draft: Draft, loom_settings){

    if(!this.dirty) return; //only recalc and redraw when there is a change that requires it. 


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
      this.radius,
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
      this.radius,
      this.ms
      ).then(simdata => {
      this.simulation.renderSimdata(this.scene, simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map, this.showing_weft_layer_map, this.showing_topo, this.showing_draft);
    });
  }

  snapToX(){
    this.simulation.snapToX(this.controls);
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


  changeRadius(e: any){

    this.simulation.recalcSimData(
      this.scene, 
      this.draft, 
      convertEPItoMM(this.loom_settings), 
      this.layer_spacing, 
      this.layer_threshold, 
      this.max_interlacement_width, 
      this.max_interlacement_height,
      this.boundary,
      this.radius,
      this.ms
      ).then(simdata => {
      this.simulation.renderSimdata(this.scene, simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map,this.showing_weft_layer_map,  this.showing_topo, this.showing_draft);
    });
  }

  
  changeLayerSpacing(e: any){

    this.simulation.redrawCurrentSim(this.scene, this.draft, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map, this.showing_weft_layer_map, this.showing_topo, this.showing_draft)

    // this.simulation.recalcSimData(
    //   this.scene, 
    //   this.draft, 
    //   convertEPItoMM(this.loom_settings), 
    //   this.layer_spacing, 
    //   this.layer_threshold, 
    //   this.max_interlacement_width, 
    //   this.max_interlacement_height,
    //   this.boundary,
    //   this.radius,
    //   this.ms
    //   ).then(simdata => {
    //   this.simulation.renderSimdata(this.scene, simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map,this.showing_weft_layer_map,  this.showing_topo, this.showing_draft);
    // });
  }


  //this will update the colors on the current sim without recomputing the layer maps
  redrawCurrentSim(){
    this.simulation.redrawCurrentSim(this.scene, this.draft, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map, this.showing_weft_layer_map, this.showing_topo, this.showing_draft)

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
      this.radius,
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
      this.radius, 
      this.ms
      ).then(simdata => {
      this.simulation.renderSimdata(this.scene, simdata, this.showing_warps, this.showing_wefts, this.showing_warp_layer_map, this.showing_weft_layer_map,this.showing_topo, this.showing_draft);
    });
  }


  pageClose(){
    this.simulation.endSimulation(this.scene);
  }

  expandSimulation(){
   
    this.onExpanded.emit();
    this.sim_expanded = !this.sim_expanded;
    this.onWindowResize();
  
  }

  /**
   * this gets called even if its not open!
   */
  onWindowResize() {
    let width;

    if(this.sim_expanded)   width = 2*window.innerWidth/3;
    else width = window.innerWidth/3;

    let height = window.innerHeight;

    this.camera.aspect = width / height;
    
    // adjust the FOV
    this.camera.fov = ( 360 / Math.PI ) * Math.atan( this.tanFOV * ( height / this.originalHeight ) );
    
    this.camera.updateProjectionMatrix();
    // this.camera.lookAt( this.scene.position );

    this.renderer.setSize( width, height );
    this.renderer.render( this.scene, this.camera );

  }


}
