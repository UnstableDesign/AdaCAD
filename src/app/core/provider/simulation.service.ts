import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { getDraftToplogy, translateTopologyToPoints } from '../model/yarnsimulation';
import { MaterialsService } from '../provider/materials.service';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Draft, YarnVertex } from '../model/datatypes';
import { warps } from '../model/drafts';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {

  hasSimulation: boolean = false;
  
  
  constructor(private ms: MaterialsService) { 

 

  }


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

  public setupAndDrawSimulation(draft: Draft, renderer, scene, camera, weft_range: number, warp_range: number, warp_spacing: number, layer_spacing: number, ms: MaterialsService){
    this.hasSimulation = true;

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

    this.drawDrawdown(draft, scene, weft_range, warp_range, warp_spacing, layer_spacing, ms);

   
    animate();


    // renderer.setSize(400, 400, false);
  }



  public drawDrawdown(draft: Draft, scene, weft_range: number, warp_range: number, warp_spacing: number, layer_spacing: number, ms: MaterialsService){
    this.hasSimulation = true;

    scene.clear();

    const light = new THREE.DirectionalLight( 0xffffff, 1.0);
    const back_light = new THREE.DirectionalLight( 0xffffff, 1.0);
    scene.add( light );
    scene.add( back_light );

    light.position.set( 20, 0, 50 );
    back_light.position.set( 20, 0, -50 );

    const topology = getDraftToplogy(draft);
    const vtxs = translateTopologyToPoints(draft, topology, warp_spacing, layer_spacing, ms);
      

    for(let j = 0; j < warps(draft.drawdown); j++){
      const pts = [];

      if(vtxs.warps[j].length > 0 && vtxs.warps[j] !== undefined){

      const material_id = draft.colShuttleMapping[j];
      let diameter = ms.getDiameter(material_id);
      let color = this.ms.getColor(material_id);
      
      if(j == 0) color="#ff0000"


     // pts.push(new THREE.Vector3(warp_vtx_list[0].x, warp_vtx_list[0].y-10, warp_vtx_list[0].z));
     vtxs.warps[j].forEach(vtx => {
        console.log(vtx)
        if(vtx.x !== undefined) pts.push(new THREE.Vector3(vtx.x, vtx.y, vtx.z));
      });

    // let last = warp_vtx_list.length -1;
    // pts.push(new THREE.Vector3(warp_vtx_list[last].x, warp_vtx_list[last].y+10, warp_vtx_list[last].z));

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
        
      const curveObject = new THREE.Mesh( geometry, material );
      const quaternion = new THREE.Quaternion();
          
      //rotate around the x axis to match draft orientation in top left
      quaternion.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI );
      curveObject.applyQuaternion(quaternion);

      //then rotate around the y axis to match draft orientation in top left

      // quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI );
      // curveObject.applyQuaternion(quaternion);

      scene.add(curveObject);
      }
    };


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
        let diameter = ms.getDiameter(material_id);
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
          const curveObject = new THREE.Mesh( geometry, material );
          const quaternion = new THREE.Quaternion();
          
          //rotate around the x axis to match draft orientation in top left
          quaternion.setFromAxisAngle( new THREE.Vector3( 1, 0, 0 ), Math.PI );
          curveObject.applyQuaternion(quaternion);

          //then rotate around the y axis to match draft orientation in top left

          // quaternion.setFromAxisAngle( new THREE.Vector3( 0, 1, 0 ), Math.PI );
          // curveObject.applyQuaternion(quaternion);

          scene.add(curveObject);
        }
    });


  

    //this.drawEndCaps(draft,{warps: vtxs.warps, wefts: vtxs.wefts}, ms, scene);



  }

  drawEndCaps(draft: Draft, vtxs: {warps: Array<Array<YarnVertex>>, wefts:Array<Array<YarnVertex>>}, ms: MaterialsService, scene ){


    vtxs.warps.forEach((warp, j) => {
      const material_id = draft.colShuttleMapping[j];
      let diameter = ms.getDiameter(material_id);
      const color = this.ms.getColor(material_id)


      const top_geometry = new THREE.CircleGeometry( diameter/2, 32 );
      top_geometry.rotateX(Math.PI/2);
      top_geometry.translate(warp[0].x, warp[0].y-10, warp[0].z);
      const material = new THREE.MeshBasicMaterial( { color: color } );
      const end_circle = new THREE.Mesh( top_geometry, material );
      scene.add( end_circle );
      
      const bot_geometry = new THREE.CircleGeometry(  diameter/2, 32 );
      bot_geometry.rotateX(3*Math.PI/2);
      bot_geometry.translate(warp[warp.length-1].x, warp[warp.length-1].y+10, warp[warp.length-1].z);
      const top_circle = new THREE.Mesh( bot_geometry, material );
      scene.add( top_circle );

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
      const end_circle = new THREE.Mesh( top_geometry, material );
      scene.add( end_circle );
      
      const bot_geometry = new THREE.CircleGeometry( diameter/2, 32 );
      bot_geometry.rotateY(Math.PI/2);
      bot_geometry.translate(weft[weft.length-1].x+10, weft[weft.length-1].y, weft[weft.length-1].z);
      const top_circle = new THREE.Mesh( bot_geometry, material );
      scene.add( top_circle );
      }

    })
  

  }


    

}

