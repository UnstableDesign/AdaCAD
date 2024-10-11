import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoreComponent } from '../core/core.component';
import { MixerComponent } from '../mixer/mixer.component';
import { CommunityComponent } from './community.component';
import { AppModule } from '../app.module';
import { MixerModule } from '../mixer/mixer.module';
import { CoreModule } from '../core/core.module';



@NgModule({
  declarations: [
    CommunityComponent
  ],
  imports: [
    CoreModule,
    MixerModule
  ]
})
export class CommunityModule { }
