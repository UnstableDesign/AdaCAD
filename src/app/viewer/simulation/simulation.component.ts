import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { Draft, LoomSettings, SimulationData, convertEPItoMM, warps, wefts } from 'adacad-drafting-lib';
import { SimulationVars } from 'adacad-drafting-lib/simulation';
import { GUI } from 'dat.gui';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Bounds } from '../../core/model/datatypes';
import { defaults } from '../../core/model/defaults';
import { MaterialsService } from '../../core/provider/materials.service';
import { SimulationService } from '../../core/provider/simulation.service';
import { TreeService } from '../../core/provider/tree.service';
@Component({
  selector: 'app-simulation',
  templateUrl: './simulation.component.html',
  styleUrls: ['./simulation.component.scss']
})
export class SimulationComponent implements OnInit {
  private tree = inject(TreeService);
  ms = inject(MaterialsService);
  sim = inject(SimulationService);


  @Input('id') id;
  @Input('new_draft_flag$') new_draft_flag$;
  @Output() onExpanded = new EventEmitter();

  renderer;
  scene;
  camera;
  controls;
  gui;
  sim_expanded: boolean = false;

  simVars: SimulationVars = null;
  simData: SimulationData = null;


  tanFOV: number = 0;
  originalHeight: number = 0;
  dirty: boolean; //flags the need to recompute 
  selection_bounds: Bounds = null;
  render_size_error: boolean = false;

  constructor(
  ) {

    this.simVars = {
      pack: defaults.pack,
      warp_spacing: 10,
      lift_limit: 4,
      wefts_as_written: defaults.wefts_as_written,
      layer_spacing: defaults.layer_spacing,
      use_layers: true,
      ms: this.ms.getShuttles(),
      simulate: false,
      use_smoothing: true,
      repulse_force_correction: 0,
      time: .05,
      mass: 150,
      max_theta: Math.PI / 12
    }


  }


  ngOnInit(): void {



  }



  ngAfterViewInit() {

    const controls_div = document.getElementById('simulation_controls');
    const rendering_div = document.getElementById('simulation_rendering');
    const width = 1000;
    const height = 1000;


    this.gui = new GUI({ autoPlace: false });
    controls_div.appendChild(this.gui.domElement)


    const simulate = this.gui.add(this.simVars, 'simulate').name('Relax');
    simulate.onChange((value) => {
      this.handleSimulateChange(value);
    });

    const weft_change = this.gui.add(this.simVars, 'wefts_as_written').name('Actual Paths');
    weft_change.onChange((value) => {
      this.handleWeftAsWrittenChange(value);
    });

    const layers = this.gui.add(this.simVars, 'use_layers').name('Locate Layers');
    layers.onChange((value) => {
      this.handleLayersChange(value);
    });

    const smoothing = this.gui.add(this.simVars, 'use_smoothing').name('Smoothing');
    smoothing.onChange((value) => {
      this.handleSmoothingChange(value);
    });

    const lift_limit = this.gui.add(this.simVars, 'lift_limit', 0, 50, 1).name('Lift Limit');
    lift_limit.onChange((value) => {
      this.handleLiftLimitChange(value);
    });


    const pack = this.gui.add(this.simVars, 'pack', 0.001, 1, .001).name('Pack');
    pack.onChange((value) => {
      this.handlePackChange(value);
    });

    const time = this.gui.add(this.simVars, 'time', .0001, 1, .001).name('Time');
    time.onChange((value) => {
      this.handleTimeChange(value);
    });

    const mass = this.gui.add(this.simVars, 'mass', 100, 1000, 10).name('Mass');
    mass.onChange((value) => {
      this.handleMassChange(value);
    });

    const max_theta = this.gui.add(this.simVars, 'max_theta', 0, Math.PI / 2).name('Max Theta');
    max_theta.onChange((value) => {
      this.handleMaxThetaChange(value);
    });


    const warp_spacing_change = this.gui.add(this.simVars, 'warp_spacing', .25, 25, .25).name("Warp-Density");
    warp_spacing_change.onChange((value) => {
      this.handleWarpSpacingChange(value);
    });

    const layer_spacing_change = this.gui.add(this.simVars, 'layer_spacing', 0, 50, 1).name("Layer-Size");
    layer_spacing_change.onChange((value) => {
      this.handleLayerSpacingChange(value);
    });


    // this.renderer = new THREE.WebGLRenderer();
    // this.renderer.setSize(width, height);
    // div.appendChild(this.renderer.domElement);


    // this.scene = new THREE.Scene();
    // this.scene.background = new THREE.Color(0xf0f0f0);


    /////

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f0);

    this.camera = new THREE.PerspectiveCamera(30, width / height, 1, 500);
    this.camera.position.set(0, 0, 5);
    this.camera.lookAt(this.scene.position);


    this.renderer = new THREE.WebGLRenderer();
    this.renderer.setSize(width, height);
    rendering_div.appendChild(this.renderer.domElement);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    this.scene.add(cube);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.tanFOV = Math.tan(((Math.PI / 180) * this.camera.fov / 2));

    this.renderer.setAnimationLoop(() => {
      this.controls.update();
      this.renderer.render(this.scene, this.camera);
    });

  }


  handleSimulateChange(value) {
    this.redrawCurrentSim();

  }

  handleLayersChange(value) {
    this.sim.computeSimulationData(this.simData.draft, this.simVars).then(simdata => {
      this.simData = simdata;
      this.redrawCurrentSim();
    })
  }


  handleLiftLimitChange(value) {
    this.sim.computeSimulationData(this.simData.draft, this.simVars).then(simdata => {
      this.simData = simdata;
      this.redrawCurrentSim();
    })
  }




  handlePackChange(value) {
    this.sim.computeSimulationData(this.simData.draft, this.simVars, this.simData.topo, this.simData.floats).then(simdata => {
      this.simData = simdata;
      this.redrawCurrentSim();
    })
  }

  handleSmoothingChange(value) {
    this.sim.computeSimulationData(this.simData.draft, this.simVars, this.simData.topo, this.simData.floats).then(simdata => {
      this.simData = simdata;
      this.redrawCurrentSim();
    })
  }

  handleMaxThetaChange(value) {
    this.sim.computeSimulationData(this.simData.draft, this.simVars, this.simData.topo, this.simData.floats).then(simdata => {
      this.simData = simdata;
      this.redrawCurrentSim();
    })
  }

  handleTimeChange(value) {
    this.sim.computeSimulationData(this.simData.draft, this.simVars, this.simData.topo, this.simData.floats).then(simdata => {
      this.simData = simdata;
      this.redrawCurrentSim();
    })
  }

  handleMassChange(value) {
    this.sim.computeSimulationData(this.simData.draft, this.simVars, this.simData.topo, this.simData.floats).then(simdata => {
      this.simData = simdata;
      this.redrawCurrentSim();
    })
  }



  handleWeftAsWrittenChange(value) {
    this.sim.computeSimulationData(this.simData.draft, this.simVars).then(simdata => {
      this.simData = simdata;
      this.redrawCurrentSim();
    })
  }

  handleLayerSpacingChange(value) {
    this.sim.computeSimulationData(this.simData.draft, this.simVars, this.simData.topo, this.simData.floats).then(simdata => {
      this.simData = simdata;
      this.redrawCurrentSim();
    })
  }


  handleWarpSpacingChange(value) {
    this.sim.computeSimulationData(this.simData.draft, this.simVars, this.simData.topo, this.simData.floats).then(simdata => {
      this.simData = simdata;
      this.redrawCurrentSim();
    })
  }



  setDirty() {
    this.dirty = true;
  }

  unsetDirty() {
    this.dirty = false;
  }


  endSimulation() {


    // document.body.removeChild(this.renderer.domElement);
    this.scene.clear();
    this.scene.children.forEach(childMesh => {
      if (childMesh.geometry !== undefined) childMesh.geometry.dispose();
      if (childMesh.texture !== undefined) childMesh.texture.dispose();
      if (childMesh.material !== undefined) childMesh.material.dispose();
    });

  }


  public resetSimVars(d: Draft, ls: LoomSettings) {

    this.simVars.warp_spacing = convertEPItoMM(ls);
    this.simVars.layer_spacing = defaults.layer_spacing;
  }


  loadNewDraft(id): Promise<any> {
    console.log("LOADING NEW DRAFT ", id)

    const draft = this.tree.getDraft(id);
    const loom_settings = this.tree.getLoomSettings(id);

    //reset the sim vars 
    this.resetSimVars(draft, loom_settings);

    //this.layer_spacing = this.calcDefaultLayerSpacing(draft);
    //this.resetSelectionBounds(draft);
    this.recalcAndRenderSimData(draft, this.selection_bounds);
    return Promise.resolve('done')

  }

  /**
   * this passes new information to a current rendering, updating which portion of the data we are visualizing. 
   * @param draft 
   * @param loom_settings 
   * @param start 
   * @param end 
   */
  // updateSelection(start: Interlacement, end: Interlacement) {

  //   let width = end.j - start.j;
  //   if (width <= 0) return;

  //   let height = end.i - start.i;
  //   if (height <= 0) return;



  //   //recalc if this was currently too large to render or if we are making a new selection within an existing  
  //   if (this.simData == null || this.render_size_error) {

  //     let draft = this.tree.getDraft(this.id);
  //     let loom_settings = this.tree.getLoomSettings(this.id);
  //     let crop = cropDraft(draft, start.i, start.j, width, height);

  //     //since we trimmed the draft, the selection is now the entire trimmed draft
  //     this.selection_bounds = {
  //       topleft: { x: 0, y: 0 },
  //       width, height
  //     }
  //     this.recalcAndRenderSimData(crop, this.selection_bounds);

  //   } else {

  //     this.selection_bounds = {
  //       topleft: { x: start.j, y: start.i },
  //       width, height
  //     }

  //     console.log("RENDERING UPDATED DATA ", this.selection_bounds)
  //     this.sim.redraw(this.selection_bounds, this.simData, this.simVars);

  //   }

  // }


  resetSelectionBounds(draft: Draft) {
    if (draft == null) draft = this.tree.getDraft(this.id);
    this.selection_bounds = {
      topleft: { x: 0, y: 0 },
      width: warps(draft.drawdown),
      height: wefts(draft.drawdown)
    }
  }

  /**
   * returns the simdata bounds to the size of the entire draft stored at this ID
   */
  unsetSelection() {

    this.resetSelectionBounds(null);
    //this.sim.redraw(this.selection_bounds, this.simData, this.simVars);
  }

  /**
   * call this when the simulation needs to be updated due to a structural change. 
   * This will recalculate all the simulation data and then redraw it to screen. 
   * @param draft 
   * @param loom_settings 
   */
  // updateSimulation(draft: Draft, loom_settings: LoomSettings, sim: SimulationVars) {


  //   if (!this.dirty) return; //only recalc and redraw when there is a change that requires it. 
  //   this.recalcAndRenderSimData(draft, this.selection_bounds);

  // }

  // changeLayerThreshold(){
  //   this.recalcAndRenderSimData();
  // }

  snapToX() {
    this.sim.snapToX(this.controls);
  }

  // toggleWefts(){
  //   if(!this.showing_wefts) this.simulation.showWefts();
  //   else this.simulation.hideWefts();
  // }

  // toggleDraft(){
  //   if(!this.showing_draft) this.simulation.showDraft();
  //   else this.simulation.hideDraft();
  // }

  // toggleWarps(){
  //   if(!this.showing_warps) this.simulation.showWarps();
  //   else this.simulation.hideWarps();
  // }


  // toggleTopo(){
  //   if(!this.showing_topo) this.simulation.showTopo();
  //   else this.simulation.hideTopo();
  // }

  // toggleWeftLayerView(){
  //   if(!this.showing_weft_layer_map) this.simulation.showWeftLayerMap();
  //   else this.simulation.hideWeftLayerMap();
  // }

  // toggleWarpLayerView(){
  //   if(!this.sim.showing_warp_layer_map) this.simulation.showWarpLayerMap();
  //   else this.simulation.hideWarpLayerMap();
  // }





  //redraws whatever is stored at this.simData. 
  redrawCurrentSim() {
    this.sim.redraw(this.selection_bounds, this.simData, this.simVars, this.scene).then(
      scene => {
        this.scene = scene;
        this.renderer.render(this.scene, this.camera);
        this.resetCamera();
      }
    );
  }

  redrawSimColors() {
    let draft = this.tree.getDraft(this.id);
    this.sim.redrawSimColors(draft, this.simVars)

  }

  /**
   * recomputes the topology and verticies of the simulation data for a given draft and selection (e.g. if will only compute the selection if there is one). Loom settings is passed to speak for the EPI. 
   * @param draft 
   * @param loom_settings 
   * @param selection the bounds of the selection or null if no selection has been made. 
   */
  recalcAndRenderSimData(draft: Draft, selection: Bounds) {


    if (selection == null) selection = {
      topleft: { x: 0, y: 0 },
      width: warps(draft.drawdown),
      height: wefts(draft.drawdown)
    };
    this.selection_bounds = selection;

    this.sim.recalcSimData(draft, this.simVars)
      .then(simdata => {

        this.simData = simdata;

        // document.getElementById('sizeerror').style.display = "none"
        // document.getElementById('simulation_container').style.display = "flex";
        // this.render_size_error = false;
        this.sim.redraw(selection, this.simData, this.simVars, this.scene).then(
          scene => {
            this.scene = scene;
            this.renderer.render(this.scene, this.camera);
            this.resetCamera();
          }
        )

      }).catch(err => {

        this.simData = null;
        console.error("Gen Sim Data Returned Error", err);
        this.render_size_error = true;
        document.getElementById('sizeerror').style.display = "block"
        document.getElementById('simulation_container').style.display = "none"
      })
  }




  // changeILaceWidth(){
  //   this.recalcAndRenderSimData();
  // }

  // changeILaceHeight(){
  //   this.recalcAndRenderSimData(draft);

  // }


  // pageClose() {
  //   this.sim.endSimulation(this.scene);
  // }

  // expandSimulation() {

  //   this.onExpanded.emit();
  //   this.sim_expanded = !this.sim_expanded;
  //   this.onWindowResize();

  // }

  /**
   * this gets called even if its not open!
   */
  // onWindowResize() {
  //   let width;

  //   if (this.sim_expanded) width = 2 * window.innerWidth / 3;
  //   else width = window.innerWidth / 3;

  //   let height = window.innerHeight;

  //   this.camera.aspect = width / height;

  //   // adjust the FOV
  //   this.camera.fov = (360 / Math.PI) * Math.atan(this.tanFOV * (height / this.originalHeight));

  //   this.camera.updateProjectionMatrix();
  //   // this.camera.lookAt( this.scene.position );

  //   this.renderer.setSize(width, height);
  //   this.renderer.render(this.scene, this.camera);

  // }

  /**
   * Resets the camera to center and frame the simulation scene
   */
  resetCamera() {
    if (!this.scene || !this.camera || !this.controls) return;

    // Calculate bounding box of all objects in the scene
    const box = new THREE.Box3();
    const objects = this.scene.children.filter(child => {
      // Only include meshes and groups, exclude lights
      return child.type === 'Mesh' || child.type === 'Group' || child.type === 'Line';
    });

    if (objects.length === 0) return;

    // Expand box to include all objects
    objects.forEach(object => {
      box.expandByObject(object);
    });

    // Get center and size of the bounding box
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Calculate the distance needed to fit the scene
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov = this.camera.fov * (Math.PI / 180);
    const cameraZ = Math.abs(maxDim / 2 / Math.tan(fov / 2));

    // Add some padding
    const distance = cameraZ * 1.5;

    // Position camera to view the scene from an angle
    this.camera.position.set(
      center.x + distance * 0.5,
      center.y + distance * 0.5,
      center.z + distance
    );

    // Set controls target to center of scene
    this.controls.target.copy(center);
    this.controls.update();

    // Render the scene with the new camera position
    this.renderer.render(this.scene, this.camera);
  }


}
