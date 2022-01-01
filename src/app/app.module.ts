import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser'
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { CoreModule } from './core/core.module';
import { WeaverModule } from './weaver/weaver.module';
import { MixerModule } from './mixer/mixer.module';

@NgModule({
  declarations: [
    AppComponent
    ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    WeaverModule,
    MixerModule,
    BrowserAnimationsModule],
  providers: [{ 
    provide: HAMMER_GESTURE_CONFIG, 
    useClass: HammerGestureConfig 
  }],
  bootstrap: [AppComponent]
})
export class AppModule { 
  
}
