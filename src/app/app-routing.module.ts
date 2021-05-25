import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WeaverComponent } from './weaver/weaver.component';
import { MixerComponent } from './mixer/mixer.component';



/**
 * Use this to specify if you want to load the weaver application or the mixer application. 
 * enable this by changing "component" below to "WeaverComponent" or "MixerComponent"
 */
const routes: Routes = [
  {
    path: '',
    component: WeaverComponent,
    children: []
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
