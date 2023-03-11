import { AfterViewInit, Component, OnInit } from '@angular/core';
import { Draft, Interlacement } from '../../core/model/datatypes';
import * as THREE from 'three';
import { getCol } from '../../core/model/drafts';

@Component({
  selector: 'app-crosssection',
  templateUrl: './crosssection.component.html',
  styleUrls: ['./crosssection.component.scss']
})
export class CrosssectionComponent implements AfterViewInit{


  hasSelection: boolean = false;
  isInit: boolean = false;


  constructor(){


  }

  ngAfterViewInit(){

  }




  updateSelection(draft: Draft, start: Interlacement, end: Interlacement){

    console.log("Update Selection")
    if(!this.isInit) return;

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

    const lines = [];

    //warps aligned in x 
    for(let j = 0; j < end.j - start.j; j++){
      

        const x = j*size;
  
        const draft_col = getCol(draft.drawdown, start.j+j);
        const pts = [];
        draft_col.forEach((cell, i) => {
          let z = cell.getHeddle() ? size/2 : -size/2;
          pts.push(new THREE.Vector3(x, i*-size, z));
        });
  
        const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .5);
        const geometry = new THREE.TubeGeometry( curve, 20, size/3, 8, false );
        const material = new THREE.MeshBasicMaterial( {color: 0xff0000, opacity: 0.84} );
        const curveObject = new THREE.Mesh( geometry, material );
        scene.add(curveObject);
  
      
  
  
    }

    for(let i = 0; i < end.i - start.i; i++){

      const y = i*-size;

      const draft_line = draft.drawdown[i+start.i];
      const pts = [];
      draft_line.forEach((cell, j) => {
        let z = cell.getHeddle() ? -size : size;
        pts.push(new THREE.Vector3(j*size, y, z));
      });

      const curve = new THREE.CatmullRomCurve3(pts, false, 'catmullrom', .5);
      const geometry = new THREE.TubeGeometry( curve, 20, size/3, 8, false );
     // const geometry = new THREE.BufferGeometry().setFromPoints( points );
     // const material = new THREE.LineBasicMaterial( { color: 0xff0000, 	linewidth: 4,      } );
      const material = new THREE.MeshDepthMaterial( {opacity: 0.84} );
      const curveObject = new THREE.Mesh( geometry, material );

     // const curveObj = new THREE.Line(geometry, material);
      // const tubeGeometry = new THREE.TubeGeometry( points,100, 2, 3, false );
       
       scene.add(curveObject);

    }






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
