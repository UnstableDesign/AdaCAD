import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { createLayerMaps, getDraftTopology, relaxWefts, translateTopologyToPoints } from '../model/yarnsimulation';
import { MaterialsService } from '../provider/materials.service';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { Lut } from 'three/examples/jsm/math/Lut';
import { Draft, SimulationData, SimulationVars, YarnVertex } from '../model/datatypes';
import { warps, wefts } from '../model/drafts';


@Injectable({
  providedIn: 'root'
})
export class SimulationService {

  hasSimulation: boolean = false;
  currentSim: SimulationData  = null;

  warp_layer_map_scene: any;
  weft_layer_map_scene: any;
  warp_scene: any;
  weft_scene: any;
  topo_scene: any;
  draft_scene: any;

  
  constructor(private ms: MaterialsService) { 

 

  }


  /**
   * clears the memory devoted to a scene
   * @param scene 
   */
  public endSimulation(scene){

   // document.body.removeChild(this.renderer.domElement);
    scene.clear();
    scene.children.forEach(childMesh => {
      if(childMesh.geometry !== undefined) childMesh.geometry.dispose();
      if(childMesh.texture !== undefined) childMesh.texture.dispose();
      if(childMesh.material !== undefined) childMesh.material.dispose();
    });

    this.hasSimulation = false;
  }


  /**
   * generates a new simulation with the given draft and simulation parameters
   * @param draft 
   * @param sim 
   * @returns promise for simulation data
   */
  public generateSimulationData(draft: Draft, sim: SimulationVars) : Promise<SimulationData>{

   

    const currentSim:SimulationData  = {
      draft: draft, 
      sim: sim,
      topo: null,
      vtxs: null, 
      layer_maps: null,
      top: 0, 
      right: 0
    };
    


    return getDraftTopology(draft, sim).then(
      topology => {
      currentSim.topo = topology;
      return createLayerMaps(draft, topology, sim);
      }
    ).then(lm => {
      currentSim.layer_maps = lm;
      return translateTopologyToPoints(draft,  currentSim.topo, lm, sim);

    }).then(vtxs => {

      currentSim.top = vtxs.warps.reduce((acc, val, j) => {
        let max = val.reduce((sub_acc, vtx) => {
          if(vtx.y > sub_acc) return vtx.y;
          return sub_acc;
        }, 0);

        if(max > acc) return max;
        return acc;
      }, 0);

      currentSim.right = vtxs.wefts.reduce((acc, val) => {
        let max = val.reduce((sub_acc, vtx) => {
          if(vtx.x > sub_acc) return vtx.x;
          return sub_acc;
        }, 0);

        if(max > acc) return max;
        return acc;
      }, 0);

      // vtxs.wefts = relaxWefts(draft, currentSim.layer_map,sim,  vtxs.wefts);
      currentSim.vtxs = vtxs;
      return currentSim;
    });

  }

  public setupSimulation(draft: Draft, renderer, scene, camera, layer_threshold: number, warp_range: number, warp_spacing: number, layer_spacing: number, max_interlacement_width: number, max_interlacement_height: number,  ms: MaterialsService) : Promise<SimulationData> {

    camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
    const controls = new OrbitControls( camera, renderer.domElement );
    
    const animate = function(){
      requestAnimationFrame( animate );
      renderer.render( scene, camera );
      controls.update();

    };
    scene.background = new THREE.Color( 0xf0f0f0 );

    camera.position.set( 20, 0, 200 );
    camera.lookAt( 0, 0, 0 );  
    controls.update();
    animate();

    const sim:SimulationVars= {
      warp_spacing, 
      layer_spacing, 
      ms,
      layer_threshold,
      max_interlacement_width,
      max_interlacement_height
    }
    
    return this.generateSimulationData(draft, sim)
    .then(simdata => {
      this.currentSim = simdata;
      return simdata;
    })

   

  }

  public recalcSimData(scene, draft: Draft, warp_spacing:number, layer_spacing:number, layer_threshold:number,max_interlacement_width: number, max_interlacement_height: number, ms: MaterialsService) : Promise<SimulationData>{

    const sim:SimulationVars= {
      warp_spacing, 
      layer_spacing, 
      ms,
      layer_threshold,
      max_interlacement_width,
      max_interlacement_height
    };
    this.currentSim.sim = sim;
    
    return this.generateSimulationData(draft, sim)
    .then(simdata => {
      this.currentSim = simdata;
      return simdata
    })
  }

  public renderSimdata(scene, simdata: SimulationData, warps: boolean, wefts: boolean, warp_layer: boolean,weft_layers: boolean, topo: boolean, show_draft: boolean){
    this.hasSimulation = true;

    if(this.currentSim.draft == null) return;

    scene.clear();

    const light = new THREE.DirectionalLight( 0xffffff, 1.0);
    const back_light = new THREE.DirectionalLight( 0xffffff, 1.0);
    scene.add( light );
    scene.add( back_light );

    light.position.set( 20, 0, 50 );
    back_light.position.set( 20, 0, -50 );
   
    this.drawYarns(scene, simdata);
    this.drawEndCaps(scene, simdata);
    this.drawWarpLayerMap(scene);
    this.drawWeftLayerMap(scene);
    this.drawTopology(scene);
    this.drawDraft(scene, this.currentSim.draft, this.currentSim.sim);


    if(!wefts) this.hideWefts();
    if(!warps) this.hideWarps();
    if(!warp_layer) this.hideWarpLayerMap();
    if(!weft_layers) this.hideWeftLayerMap();
    if(!topo) this.hideTopo();
    if(!show_draft) this.hideDraft();

  }

  drawYarns(scene, simdata: SimulationData){

    this.warp_scene =  new THREE.Group();
    this.weft_scene =  new THREE.Group();

    const vtxs = simdata.vtxs;
    const draft = simdata.draft;

    for(let j = 0; j < warps(simdata.draft.drawdown); j++){
      const pts = [];

      if(simdata.vtxs.warps[j].length > 0 && vtxs.warps[j] !== undefined){

      const material_id = draft.colShuttleMapping[j];
      let diameter = this.ms.getDiameter(material_id);
      let color = this.ms.getColor(material_id);
      
      if(j == 0) color="#ff0000";

     pts.push(new THREE.Vector3(vtxs.warps[j][0].x, vtxs.warps[j][0].y-10, vtxs.warps[j][0].z));
     vtxs.warps[j].slice().forEach(vtx => {
        if(vtx.x !== undefined) pts.push(new THREE.Vector3(vtx.x, vtx.y, vtx.z));
      });

    let last = vtxs.warps[j].length -1;
    pts.push(new THREE.Vector3(vtxs.warps[j][last].x, vtxs.warps[j][last].y+10, vtxs.warps[j][last].z));

      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1);
      const geometry = new THREE.TubeGeometry( curve, 100, diameter/2, 6, false );
      const material = new THREE.MeshPhysicalMaterial( {
        color: color,
        depthTest: true,
        emissive: 0x000000,
        metalness: 0,
        roughness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 1.0,
        reflectivity: 0.0
        } );     
      
      let curveObject = new THREE.Mesh( geometry, material );


      this.warp_scene.add(curveObject);
      }
    };

    this.warp_scene = this.applyOrientationConversion(this.warp_scene, this.currentSim.top, this.currentSim.right);
    scene.add(this.warp_scene);





    vtxs.wefts.forEach((weft_vtx_list, i) => {
      const pts = [];
      if(weft_vtx_list.length != 0){
        pts.push(new THREE.Vector3(weft_vtx_list[0].x-10, weft_vtx_list[0].y, weft_vtx_list[0].z));
        weft_vtx_list.forEach(vtx => {
          if(vtx.x !== undefined) pts.push(new THREE.Vector3(vtx.x, vtx.y, vtx.z));
        });
      let last = weft_vtx_list.length -1;
      pts.push(new THREE.Vector3(weft_vtx_list[last].x+10, weft_vtx_list[last].y, weft_vtx_list[last].z));
        const material_id = draft.rowShuttleMapping[i];
        let diameter = this.ms.getDiameter(material_id);
        let color = this.ms.getColor(material_id)
        if(i == 0) color="#ff0000"
        const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1);
        const geometry = new THREE.TubeGeometry( curve, 100, diameter/2, 6, false );
        const material = new THREE.MeshPhysicalMaterial( {
          color: color,
          emissive: 0x000000,
          depthTest: true,
          metalness: 0,
          roughness: 0.5,
          clearcoat: 1.0,
          clearcoatRoughness: 1.0,
          reflectivity: 0.0
          } );        
          let curveObject = new THREE.Mesh( geometry, material );
          this.weft_scene.add(curveObject);

          
        }
    });

    this.weft_scene = this.applyOrientationConversion(this.weft_scene, this.currentSim.top, this.currentSim.right);
    scene.add(this.weft_scene);

  }

  drawDraft(scene, draft: Draft, sim: SimulationVars){
    this.draft_scene =  new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    // const yarn_height = 5;
    const yarn_height = this.currentSim.sim.warp_spacing;

    let alldata = [];
    let positions = [];
    let colors = [];
    let normals = [];
    let indicies = [];

    for(let i = 0; i < wefts(draft.drawdown); i++){
      for(let j = 0; j < warps(draft.drawdown); j++){

       const col = (draft.drawdown[i][j].isUp()) ? 0 : 1;


       alldata.push({
          pos: [sim.warp_spacing*j, yarn_height*i, 0],
          norm: [0, 1, 0],
          color: [col, col, col]
        });
    
        alldata.push({
          pos: [sim.warp_spacing*(j+1), yarn_height*i, 0],
          norm: [0, 1, 0],
          color: [col, col, col]
        })
    
        alldata.push({
          pos: [sim.warp_spacing*j, yarn_height*(i+1), 0],
          norm: [0, 1, 0],
          color: [col, col, col]
        });
    
        alldata.push({
          pos: [sim.warp_spacing*(j+1), yarn_height*(i+1), 0],
          norm: [0, 1, 0],
          color: [col, col, col]
        });

        let starting_index = ((i*warps(draft.drawdown)) + j) *4;

        indicies =  indicies.concat([
          starting_index+2,starting_index+0,starting_index+3,starting_index+1,starting_index+3,starting_index+0
        ]);
      }
    }


    for (const vertex of alldata) {
      positions.push(...vertex.pos);
      normals.push(...vertex.norm);
      colors.push(...vertex.color);
    }

    geometry.setIndex(indicies);
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    const material = new THREE.MeshBasicMaterial( {
      side: THREE.DoubleSide,
      vertexColors: true
    } );



    let mesh = new THREE.Mesh( geometry, material );
    this.draft_scene.add(mesh);
    this.draft_scene = this.applyOrientationConversion(this.draft_scene, this.currentSim.top, this.currentSim.right);
		scene.add( this.draft_scene );


  }

  showDraft(){
    this.draft_scene.visible = true;
  }

  hideDraft(){
    this.draft_scene.visible = false;
  }


  showWarps(){
    this.warp_scene.visible = true;
  }

  hideWarps(){
    this.warp_scene.visible = false;
  }

  showWefts(){
    // console.log("SHOW WEFTS");
    this.weft_scene.visible = true;
  }

  hideWefts(){
    this.weft_scene.visible = false;
  }


  hideWarpLayerMap(){
    this.warp_layer_map_scene.visible = false;
  }

  showWarpLayerMap(){
    this.warp_layer_map_scene.visible = true;
    console.log("SHOW WARP LAYER MAP", this.warp_layer_map_scene)
  }

  hideWeftLayerMap(){
    this.weft_layer_map_scene.visible = false;
  }

  showWeftLayerMap(){
    this.weft_layer_map_scene.visible = true;
    console.log("SHOW LAYER MAP", this.weft_layer_map_scene)
  }

  hideTopo(){
    this.topo_scene.visible = false;
  }

  showTopo(){
    this.topo_scene.visible = true;
    console.log("SHOW LAYER MAP", this.topo_scene)
  }

  drawWeftLayerMap(scene){

    this.weft_layer_map_scene =  new THREE.Group();

    let z = -20;

    const lm = this.currentSim.layer_maps;
    const sim = this.currentSim.sim;
    const draft = this.currentSim.draft;

    let range = lm.weft.reduce((acc, val) => {
      let max = val.reduce((sub_acc, vtx) => {
        if(vtx > sub_acc) return vtx;
        return sub_acc;
      }, 0);

      if(max > acc) return max;
      return acc;
    }, 0);

    if(range == 0) range = 1;

    const lut = new Lut();

    lut.setColorMap( 'rainbow', 512);

  
    const geometry = new THREE.BufferGeometry();
    // const yarn_height = 5;
    const yarn_height = this.currentSim.sim.warp_spacing;

    let alldata = [];
    let positions = [];
    let colors = [];
    let normals = [];
    let indicies = [];

    for(let i = 0; i < lm.weft.length; i++){
      for(let j = 0; j < lm.weft[0].length; j++){

        const r = 0.5 + ( lm.weft[i][j] / range );
        const col = lut.getColor(r);
       



       alldata.push({
          pos: [sim.warp_spacing*j, yarn_height*i, z],
          norm: [0, 1, 0],
          color: [col.r, col.g, col.b]
        });
    
        alldata.push({
          pos: [sim.warp_spacing*(j+1), yarn_height*i, z],
          norm: [0, 1, 0],
          color: [col.r, col.g, col.b]
        })
    
        alldata.push({
          pos: [sim.warp_spacing*j, yarn_height*(i+1), z],
          norm: [0, 1, 0],
          color: [col.r, col.g, col.b]
        });
    
        alldata.push({
          pos: [sim.warp_spacing*(j+1), yarn_height*(i+1), z],
          norm: [0, 1, 0],
          color: [col.r, col.g, col.b]
        });

        let starting_index = ((i*warps(draft.drawdown)) + j) *4;

        indicies =  indicies.concat([
          starting_index+2,starting_index+0,starting_index+3,starting_index+1,starting_index+3,starting_index+0
        ]);
      }
    }



    for (const vertex of alldata) {
      positions.push(...vertex.pos);
      normals.push(...vertex.norm);
      colors.push(...vertex.color);
    }




    geometry.setIndex(indicies);
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    const material = new THREE.MeshBasicMaterial( {
      side: THREE.DoubleSide,
      transparent: true,
      vertexColors: true,
      opacity: .5
    } );



    let mesh = new THREE.Mesh( geometry, material );    
    this.weft_layer_map_scene.add(mesh);
    this.weft_layer_map_scene = this.applyOrientationConversion( this.weft_layer_map_scene, this.currentSim.top, this.currentSim.right);
		scene.add(  this.weft_layer_map_scene );

  }



  drawWarpLayerMap(scene){

    this.warp_layer_map_scene =  new THREE.Group();

    let z = -20;

    const lm = this.currentSim.layer_maps;
    const sim = this.currentSim.sim;
    const draft = this.currentSim.draft;

    let range = lm.warp.reduce((acc, val) => {
      let max = val.reduce((sub_acc, vtx) => {
        if(vtx > sub_acc) return vtx;
        return sub_acc;
      }, 0);

      if(max > acc) return max;
      return acc;
    }, 0);

    if(range == 0) range = 1;

    const lut = new Lut();

    lut.setColorMap( 'rainbow', 512);

  
    const geometry = new THREE.BufferGeometry();
    // const yarn_height = 5;
    const yarn_height = this.currentSim.sim.warp_spacing;

    let alldata = [];
    let positions = [];
    let colors = [];
    let normals = [];
    let indicies = [];

    for(let i = 0; i < lm.warp.length; i++){
      for(let j = 0; j < lm.warp[0].length; j++){

        const r = 0.5 + ( lm.warp[i][j] / range );
        const col = lut.getColor(r);
       



       alldata.push({
          pos: [sim.warp_spacing*j, yarn_height*i, z],
          norm: [0, 1, 0],
          color: [col.r, col.g, col.b]
        });
    
        alldata.push({
          pos: [sim.warp_spacing*(j+1), yarn_height*i, z],
          norm: [0, 1, 0],
          color: [col.r, col.g, col.b]
        })
    
        alldata.push({
          pos: [sim.warp_spacing*j, yarn_height*(i+1), z],
          norm: [0, 1, 0],
          color: [col.r, col.g, col.b]
        });
    
        alldata.push({
          pos: [sim.warp_spacing*(j+1), yarn_height*(i+1), z],
          norm: [0, 1, 0],
          color: [col.r, col.g, col.b]
        });

        let starting_index = ((i*warps(draft.drawdown)) + j) *4;

        indicies =  indicies.concat([
          starting_index+2,starting_index+0,starting_index+3,starting_index+1,starting_index+3,starting_index+0
        ]);
      }
    }



    for (const vertex of alldata) {
      positions.push(...vertex.pos);
      normals.push(...vertex.norm);
      colors.push(...vertex.color);
    }




    geometry.setIndex(indicies);
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    const material = new THREE.MeshBasicMaterial( {
      side: THREE.DoubleSide,
      transparent: true,
      vertexColors: true,
      opacity: .5
    } );



    let mesh = new THREE.Mesh( geometry, material );    
    this.warp_layer_map_scene.add(mesh);
    this.warp_layer_map_scene = this.applyOrientationConversion( this.warp_layer_map_scene, this.currentSim.top, this.currentSim.right);
		scene.add(  this.warp_layer_map_scene );

  }

  drawTopology(scene){


    console.log("LAYER MAP DRAWN")
    this.topo_scene =  new THREE.Group();
    const geometry = new THREE.BufferGeometry();
    let alldata = [];
    let positions = [];
    let colors = [];
    let normals = [];
    let indicies = [];


    const topo = this.currentSim.topo;
    const sim = this.currentSim.sim;
    const yarn_height = sim.warp_spacing;

    const lut = new Lut();
    const range = 10;

    lut.setColorMap( 'rainbow', 10);

    topo.forEach((vtx, x) => {
      const r = 0.5 + ( vtx.z_pos / range );
      const col = lut.getColor(r);
      // let z = vtx.z_pos * sim.layer_spacing;

      // let z = -10 + vtx.z_pos;
      let z = -1;
      alldata.push({
        pos: [sim.warp_spacing*vtx.j_left+2, yarn_height*vtx.i_bot+2, z],
        norm: [0, 1, 0],
        color: [col.r, col.g, col.b]
      });
  
      alldata.push({
        pos: [sim.warp_spacing*vtx.j_right+sim.warp_spacing-2, yarn_height*vtx.i_bot+2, z],
        norm: [0, 1, 0],
        color: [col.r, col.g, col.b]
      })
  
      alldata.push({
        pos: [sim.warp_spacing*vtx.j_left+2,yarn_height*vtx.i_top+yarn_height-2, z],
        norm: [0, 1, 0],
        color: [col.r, col.g, col.b]
      });
  
      alldata.push({
        pos: [sim.warp_spacing*vtx.j_right+sim.warp_spacing-2, yarn_height*vtx.i_top+yarn_height-2, z],
        norm: [0, 1, 0],
        color: [col.r, col.g, col.b]
      });

      let starting_index = x*4;

      indicies =  indicies.concat([
        starting_index+2,starting_index+0,starting_index+3,starting_index+1,starting_index+3,starting_index+0
      ]);

    })


    for (const vertex of alldata) {
      positions.push(...vertex.pos);
      normals.push(...vertex.norm);
      colors.push(...vertex.color);
    }


    geometry.setIndex(indicies);
    geometry.setAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
		geometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
		geometry.setAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    const material = new THREE.MeshBasicMaterial( {
      side: THREE.DoubleSide,
      transparent: true,
      vertexColors: true,
      opacity: .5,
      wireframe: true
    } );



    let mesh = new THREE.Mesh( geometry, material );
    this.topo_scene.add(mesh);
    this.topo_scene = this.applyOrientationConversion(  this.topo_scene, this.currentSim.top, this.currentSim.right);
		scene.add(  this.topo_scene );

  }


  applyOrientationConversion(object, top, right) {
    const trans = new THREE.Matrix4();
    trans.makeTranslation(-right/2,top/2, 0);
    object.applyMatrix4(trans);


    const quaternion = new THREE.Quaternion();
          
    //rotate around the x axis to match draft orientation in top left
    quaternion.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI );
    object.applyQuaternion(quaternion);

              // quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI );
          // curveObject.applyQuaternion(quaternion);

    return object;
  }

  drawEndCaps(scene,simdata: SimulationData ){

    const vtxs = simdata.vtxs;
    const draft = simdata.draft;
    const ms = simdata.sim.ms;
    const top = simdata.top;
    const right = simdata.right;

    vtxs.warps.forEach((warp, j) => {
      if(warp.length > 0){
      const material_id = draft.colShuttleMapping[j];
      let diameter = ms.getDiameter(material_id);
      const color = this.ms.getColor(material_id)


      const top_geometry = new THREE.CircleGeometry( diameter/2, 32 );
      top_geometry.rotateX(Math.PI/2);
      
      top_geometry.translate(vtxs.warps[j][0].x, vtxs.warps[j][0].y-10, vtxs.warps[j][0].z);
      const material = new THREE.MeshBasicMaterial( { color: color } );
      let end_circle = new THREE.Mesh( top_geometry, material );
      this.warp_scene.add(end_circle);

      
      const bot_geometry = new THREE.CircleGeometry(  diameter/2, 32 );
      bot_geometry.rotateX(3*Math.PI/2);
      bot_geometry.translate(warp[warp.length-1].x, warp[warp.length-1].y+10, warp[warp.length-1].z);
      let top_circle = new THREE.Mesh( bot_geometry, material );
      // top_circle.tranlsateY(-top/2);
      // top_circle.tranlsateX(-right/2);
      this.warp_scene.add( top_circle );
      }

    })


    vtxs.wefts.forEach((weft, i) => {
      if(weft.length > 0){
      const material_id = draft.rowShuttleMapping[i];
      let diameter = ms.getDiameter(material_id);
      const color = this.ms.getColor(material_id)

      const top_geometry = new THREE.CircleGeometry(  diameter/2, 32 );
      top_geometry.rotateY(3*Math.PI/2);
      top_geometry.translate(weft[0].x-10, weft[0].y, weft[0].z);
      const material = new THREE.MeshBasicMaterial( { color: color } );
      let end_circle = new THREE.Mesh( top_geometry, material );

      this.weft_scene.add(end_circle);
      
      const bot_geometry = new THREE.CircleGeometry( diameter/2, 32 );
      bot_geometry.rotateY(Math.PI/2);
      bot_geometry.translate(weft[weft.length-1].x+10, weft[weft.length-1].y, weft[weft.length-1].z);
      let top_circle = new THREE.Mesh( bot_geometry, material );
      this.weft_scene.add(top_circle);

      }

    })
  

  }


    

}

