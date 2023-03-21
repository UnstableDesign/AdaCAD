import { Component, Input, OnInit } from '@angular/core';
import { TreeService } from '../../core/provider/tree.service';
import { SimulationService } from '../../core/provider/simulation.service';
import { Draft } from '../../core/model/datatypes';
import * as THREE from 'three';

@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {

  @Input('id') id;

  renderer;
  scene;
  camera;


  constructor(private tree: TreeService, public simulation: SimulationService) {

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

  drawSimulation(draft: Draft){


    const div = document.getElementById('simulation_container');
    this.simulation.drawSimulation(draft, this.renderer, this.scene, this.camera);
    const after = document.getElementById('simulation_container');
    console.log("AFTER DRAW SIM", after.offsetHeight)
  }

  pageClose(){
    this.simulation.endSimulation(this.scene);
  }


}
