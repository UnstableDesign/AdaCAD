import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Draft, Interlacement } from '../../core/model/datatypes';
import * as THREE from 'three';
import { evaluateVerticies, getDraftTopology } from '../../core/model/yarnsimulation';
import { MaterialsService } from '../../core/provider/materials.service';

@Component({
  selector: 'app-crosssection',
  templateUrl: './crosssection.component.html',
  styleUrls: ['./crosssection.component.scss']
})
export class CrosssectionComponent implements AfterViewInit{


  hasSelection: boolean = false;
  isInit: boolean = false;


  constructor(private ms: MaterialsService){


  }

  ngAfterViewInit(){

  }

  onLeaveTab(){

  }


  




  updateSelection(draft: Draft, start: Interlacement, end: Interlacement){

    console.log("Update Selection")
    if(!this.isInit) return;


    const topo = getDraftTopology(draft.drawdown);
    const vtxs = evaluateVerticies(topo.warps, [], 2, 1);

    console.log("INIT")
    const renderer = new THREE.WebGLRenderer();
    const size = 3;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    const div = document.getElementById('crosssection_viewer');

    const camera = new THREE.PerspectiveCamera( 75, (div.offsetWidth/div.offsetHeight), 0.1, 1000 );

    // light

    const light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 0, 0, 1 );
    scene.add( light );


    renderer.setSize(div.offsetWidth, div.offsetHeight);
    div.appendChild(renderer.domElement);

  
    // const geometry = new THREE.BoxGeometry( 1, 1, 1 );
    // const material = new THREE.MeshBasicMaterial( { color: 0x00ff00 } );
    // const cube = new THREE.Mesh( geometry, material );


    vtxs.warps.forEach((warp_vtx_list, j) => {
      const pts = [];
      warp_vtx_list.forEach(vtx => {
        pts.push(new THREE.Vector3(vtx.x, vtx.y, vtx.z));
      });

      const material_id = draft.colShuttleMapping[j];
      const color = this.ms.getColor(material_id)
      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .5);
      const geometry = new THREE.TubeGeometry( curve, 20, size/3, 8, false );
      const material = new THREE.MeshMatcapMaterial( {color: color, opacity: 0.84} );
      const curveObject = new THREE.Mesh( geometry, material );
      scene.add(curveObject);
    });





  //wefts aligned to wy
    // for(let i = 0; i < end.i - start.i; i++){

    //   const y = i*-size;

    //   const draft_line = draft.drawdown[i+start.i];
    //   const pts = [];
    //   draft_line.forEach((cell, j) => {
    //     let z = cell.getHeddle() ? -size : size;
    //     pts.push(new THREE.Vector3(j*size, y, z));
    //   });

    //   const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .5);
    //   const geometry = new THREE.TubeGeometry( curve, 20, size/3, 8, false );
    //   const material = new THREE.MeshMatcapMaterial( {opacity: 0.84} );
    //   const curveObject = new THREE.Mesh( geometry, material );

    
    //    scene.add(curveObject);

    // }






    camera.position.set( 20, 0, 50 );
    camera.lookAt( 20, 0, 0 );  

    animate();

    function animate() {
      requestAnimationFrame( animate );

      //  line.rotation.x += 0.01;
      //  line.rotation.y += 0.01;

      renderer.render( scene, camera );
    }
  

  }

  onDraftUpdated(draft: Draft, start: Interlacement, end: Interlacement){

  }

  initScene(){
    this.isInit = true;


  }

  

  redraw(){
  }



}
