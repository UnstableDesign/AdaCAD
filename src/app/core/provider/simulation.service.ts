import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { positionWarpsInYandZ, positionWeftsInXYZ } from '../model/yarnsimulation';
import { MaterialsService } from '../provider/materials.service';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { Draft, YarnVertex } from '../model/datatypes';

@Injectable({
  providedIn: 'root'
})
export class SimulationService {

  hasSimulation: boolean = false;
  
  
  constructor(private ms: MaterialsService) { 

 

  }


  public endSimulation(scene){

   // document.body.removeChild(this.renderer.domElement);

    scene.children.forEach(childMesh => {
      if(childMesh.geometry !== undefined) childMesh.geometry.dispose();
      if(childMesh.texture !== undefined) childMesh.texture.dispose();
      if(childMesh.material !== undefined) childMesh.material.dispose();
    });

    this.hasSimulation = false;
  }



  public drawSimulation(draft: Draft, renderer, scene, camera){
    this.hasSimulation = true;

    camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 1000 );
    // renderer.setSize(400, 400, false);
  

   const controls = new OrbitControls( camera, renderer.domElement );


    const animate = function(){
      requestAnimationFrame( animate );
      renderer.render( scene, camera );
      controls.update();

    };

    // const topo = getDraftTopology(draft.drawdown);
    // console.log(topo);
    // const vtxs = evaluateVerticies(topo.warps, topo.wefts, 5, 4.5);
    const warp_vtxs = positionWarpsInYandZ(draft, 10);
    const weft_vtxs = positionWeftsInXYZ(draft, 3, warp_vtxs);

    let vtxs = {
      warps: warp_vtxs,
      wefts: weft_vtxs
    };
    

    scene.background = new THREE.Color( 0xf0f0f0 );
  

    // light

    //const amlight = new THREE.AmbientLight( 0x333333, 1.0 );
    //const light = new THREE.PointLight( 0xffffff, 1, 100 );

    const light = new THREE.DirectionalLight( 0xffffff, 1.0);
    const back_light = new THREE.DirectionalLight( 0xffffff, 1.0);
    scene.add( light );
    scene.add( back_light );


    


    vtxs.warps.forEach((warp_vtx_list, j) => {
      const pts = [];

      warp_vtx_list = vtxs.warps.reduce((acc, val)=> {
        return acc.concat(val[j]);
      }, [])

      //pts.push(new THREE.Vector3(warp_vtx_list[0].x, warp_vtx_list[0].y-10, warp_vtx_list[0].z));
      warp_vtx_list.forEach(vtx => {
        pts.push(new THREE.Vector3(vtx.x*10, vtx.y*10, vtx.z*10));
      });
     // let last = warp_vtx_list.length -1;
     // pts.push(new THREE.Vector3(warp_vtx_list[last].x, warp_vtx_list[last].y+10, warp_vtx_list[last].z));


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
      scene.add(curveObject);
    });


    console.log("VTX wefts", vtxs.wefts)
    vtxs.wefts.forEach((weft_vtx_list, i) => {
      const pts = [];
     // pts.push(new THREE.Vector3(weft_vtx_list[0].x-10, weft_vtx_list[0].y, weft_vtx_list[0].z));
      weft_vtx_list.forEach(vtx => {
        pts.push(new THREE.Vector3(vtx.x*10, vtx.y*10, vtx.z*10));
      });
      //let last = weft_vtx_list.length -1;
      //pts.push(new THREE.Vector3(weft_vtx_list[last].x+10, weft_vtx_list[last].y, weft_vtx_list[last].z));


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
         scene.add(curveObject);
    });


    light.position.set( 20, 0, 50 );
    back_light.position.set( 20, 0, -50 );
    camera.position.set( 20, 0, 50 );
    camera.lookAt( 0, 0, 0 );  
    controls.update();

  

   // this.drawEndCaps(draft, 2, {warps: vtxs.warps, wefts: vtxs.wefts}, scene);

    animate();

  }

  drawEndCaps(draft: Draft, radius: number, vtxs: {warps: Array<Array<YarnVertex>>, wefts:Array<Array<YarnVertex>>}, scene ){


    vtxs.warps.forEach((warp, j) => {

      const top_geometry = new THREE.CircleGeometry( radius, 32 );
      top_geometry.rotateX(Math.PI/2);
      top_geometry.translate(warp[0].x, warp[0].y-10, warp[0].z);
      const color = this.ms.getColor(draft.colShuttleMapping[j]);
      const material = new THREE.MeshBasicMaterial( { color: color } );
      const end_circle = new THREE.Mesh( top_geometry, material );
      scene.add( end_circle );
      
      const bot_geometry = new THREE.CircleGeometry( radius, 32 );
      bot_geometry.rotateX(3*Math.PI/2);
      bot_geometry.translate(warp[warp.length-1].x, warp[warp.length-1].y+10, warp[warp.length-1].z);
      const top_circle = new THREE.Mesh( bot_geometry, material );
      scene.add( top_circle );

    })

    vtxs.wefts.forEach((weft, i) => {

      const top_geometry = new THREE.CircleGeometry( radius, 32 );
      top_geometry.rotateY(3*Math.PI/2);
      top_geometry.translate(weft[0].x-10, weft[0].y, weft[0].z);
      const color = this.ms.getColor(draft.rowShuttleMapping[i]);
      const material = new THREE.MeshBasicMaterial( { color: color } );
      const end_circle = new THREE.Mesh( top_geometry, material );
      scene.add( end_circle );
      
      const bot_geometry = new THREE.CircleGeometry( radius, 32 );
      bot_geometry.rotateY(Math.PI/2);
      bot_geometry.translate(weft[weft.length-1].x+10, weft[weft.length-1].y, weft[weft.length-1].z);
      const top_circle = new THREE.Mesh( bot_geometry, material );
      scene.add( top_circle );

    })
  

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

