import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { evaluateVerticies, getDraftTopology } from './model/yarnsimulation';
import { MaterialsService } from './provider/materials.service';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {

  renderer = new THREE.WebGLRenderer();
  scene = new THREE.Scene();
  hasSimulation: boolean = false;
  
  
  constructor(private ms: MaterialsService) { 

 

  }


  public endSimulation(){

   // document.body.removeChild(this.renderer.domElement);
   const div = document.getElementById('draft-container');
  if(this.hasSimulation) div.removeChild(this.renderer.domElement);

    this.scene.children.forEach(childMesh => {
      if(childMesh.geometry !== undefined) childMesh.geometry.dispose();
      if(childMesh.texture !== undefined) childMesh.texture.dispose();
      if(childMesh.material !== undefined) childMesh.material.dispose();
    });

    this.hasSimulation = false;
  }



  public drawSimulation(draft){
    this.hasSimulation = true;

    const scene = this.scene;
    const div = document.getElementById('draft-container');
    const camera = new THREE.PerspectiveCamera( 75, (div.offsetWidth/div.offsetHeight), 0.1, 1000 );
   const renderer = this.renderer;

   const controls = new OrbitControls( camera, renderer.domElement );


    const animate = function(){
      requestAnimationFrame( animate );
      renderer.render( scene, camera );
      controls.update();

    };

    const topo = getDraftTopology(draft.drawdown);
    console.log(topo);
    const vtxs = evaluateVerticies(topo.warps, topo.wefts, 5, 4);

    this.scene.background = new THREE.Color( 0xf0f0f0 );
  

    // light

    //const amlight = new THREE.AmbientLight( 0x333333, 1.0 );
    //const light = new THREE.PointLight( 0xffffff, 1, 100 );

    const light = new THREE.DirectionalLight( 0xffffff, 1.0);
    const back_light = new THREE.DirectionalLight( 0xffffff, 1.0);
    this.scene.add( light );
    this.scene.add( back_light );


    this.renderer.setSize(div.offsetWidth, div.offsetHeight);
    div.appendChild(this.renderer.domElement);


    vtxs.warps.forEach((warp_vtx_list, j) => {
      const pts = [];
      warp_vtx_list.forEach(vtx => {
        pts.push(new THREE.Vector3(vtx.x, vtx.y, vtx.z));
      });

      const material_id = draft.colShuttleMapping[j];
      const color = this.ms.getColor(material_id)
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1);
      const geometry = new THREE.TubeGeometry( curve, 100, 2, 6, false );
      const material = new THREE.MeshPhysicalMaterial( {
        color: color,
        depthTest: true,
        emissive: 0x000000,
        metalness: 0,
        roughness: 0.5,
        clearcoat: 1.0,
        clearcoatRoughness: 1.0,
        reflectivity: 0.0
        } );      //const material = new THREE.MeshMatcapMaterial( {color: color, opacity: 0.84} );
      const curveObject = new THREE.Mesh( geometry, material );
      this.scene.add(curveObject);
    });


    vtxs.wefts.forEach((weft_vtx_list, i) => {
      const pts = [];
      weft_vtx_list.forEach(vtx => {
        pts.push(new THREE.Vector3(vtx.x, vtx.y, vtx.z));
      });

      const material_id = draft.rowShuttleMapping[i];
      const color = this.ms.getColor(material_id)
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .1);
      const geometry = new THREE.TubeGeometry( curve, 100, 2, 6, false );
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
         this.scene.add(curveObject);
    });


    light.position.set( 20, 0, 50 );
    back_light.position.set( 20, 0, -50 );
    camera.position.set( 20, 0, 50 );
    camera.lookAt( 0, 0, 0 );  
    controls.update();

  



    animate();

  }

  updateSimluation(draft){
  }

  //   const topo = getDraftTopology(draft.drawdown);
  //   const vtxs = evaluateVerticies(topo.warps, [], 2, 1);
    
  //   //get rid of the old data 
  //   this.scene.children.forEach(childMesh => {
  //     if(childMesh.geometry !== undefined) childMesh.geometry.dispose();
  //     if(childMesh.texture !== undefined) childMesh.texture.dispose();
  //     if(childMesh.material !== undefined) childMesh.material.dispose();
  //   });

  //   vtxs.warps.forEach((warp_vtx_list, j) => {
  //     const pts = [];
  //     warp_vtx_list.forEach(vtx => {
  //       pts.push(new THREE.Vector3(vtx.x, vtx.y, vtx.z));
  //     });

  //     const material_id = draft.colShuttleMapping[j];
  //     const color = this.ms.getColor(material_id)
  //     const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .5);
  //     const geometry = new THREE.TubeGeometry( curve, 20, 1, 8, false );
  //     const material = new THREE.MeshMatcapMaterial( {color: color, opacity: 0.84} );
  //     const curveObject = new THREE.Mesh( geometry, material );
  //     this.scene.add(curveObject);
  //   });



  // }
    

}

