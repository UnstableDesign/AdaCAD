import { Component, Input, OnInit } from '@angular/core';
import { TreeService } from '../../core/provider/tree.service';
import { SimulationService } from '../../core/provider/simulation.service';
import { Draft, LoomSettings } from '../../core/model/datatypes';
import * as THREE from 'three';
import { convertEPItoMM } from '../../core/model/looms';
import { MaterialsService } from '../../core/provider/materials.service';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {

  @Input('id') id;
  @Input('weft_threshold') weft_threshold;
  @Input('warp_threshold') warp_threshold;
  @Input('layer_spacing') layer_spacing;

  renderer;
  scene;
  camera;
  draft: Draft;
  loom_settings: LoomSettings;

  constructor(private tree: TreeService, public ms: MaterialsService,  public simulation: SimulationService) {

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
    this.draft = draft;
    this.loom_settings = loom_settings;
    this.layer_spacing = this.calcDefaultLayerSpacing(draft);
    this.simulation.setupAndDrawSimulation(draft, this.renderer, this.scene, this.camera, this.weft_threshold, this.warp_threshold, convertEPItoMM(loom_settings), this.layer_spacing, this.ms);
  }

  updateSimulation(draft: Draft, loom_settings){
    this.draft = draft;
    this.loom_settings = loom_settings;
    console.log("UPDATE SIMULATION", draft)
    this.simulation.drawDrawdown(draft,  this.scene, this.weft_threshold, this.warp_threshold, convertEPItoMM(loom_settings), this.layer_spacing,this.ms);
  }

  changeWeftThreshold(threshold: number){
    this.weft_threshold = threshold;
    this.simulation.drawDrawdown(this.draft, this.scene, this.weft_threshold, this.warp_threshold, convertEPItoMM(this.loom_settings), this.layer_spacing, this.ms)
  }


  changeWarpThreshold(threshold: number){
    this.warp_threshold = threshold;
    this.simulation.drawDrawdown(this.draft, this.scene, this.weft_threshold, this.warp_threshold, convertEPItoMM(this.loom_settings), this.layer_spacing,  this.ms)
  }

  changeLayerSpacing(amt: number){
    this.layer_spacing = amt;
    this.simulation.drawDrawdown(this.draft, this.scene, this.weft_threshold, this.warp_threshold, convertEPItoMM(this.loom_settings), this.layer_spacing,  this.ms)
  }

  pageClose(){
    this.simulation.endSimulation(this.scene);
  }


}
