import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { WeaverComponent } from './weaver/weaver.component';
import { MixerComponent } from './mixer/mixer.component';


const routes: Routes = [
   {
     path: '',
     component: MixerComponent,
     children: []
   },
  {
    path: 'weaver',
    component: WeaverComponent,
    children: []
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
