import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpClientModule } from '@angular/common/http';
import { HttpModule } from '@angular/http';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { HammerGestureConfig, HAMMER_GESTURE_CONFIG } from '@angular/platform-browser'
import { AngularFireModule } from 'angularfire2';
import { AngularFireDatabaseModule } from 'angularfire2/database';
import { AngularFireAuthModule } from 'angularfire2/auth';
import { AngularFireStorageModule } from 'angularfire2/storage';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { CoreModule } from './core/core.module';
import { WeaverModule } from './weaver/weaver.module';

export const firebaseConfig = 
{
  apiKey: "AIzaSyC5lSe7NkzFdJkAMUNeh78t7SqLL9r6foU",
  authDomain: "adacad-weaver.firebaseapp.com",
  databaseURL: "https://adacad-weaver.firebaseio.com",
  projectId: "adacad-weaver",
  storageBucket: "adacad-weaver.appspot.com",
  messagingSenderId: "949203732957"
};

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    HttpModule,
    WeaverModule,
    BrowserAnimationsModule,
    AngularFireModule.initializeApp(firebaseConfig),
    AngularFireDatabaseModule,
    AngularFireAuthModule,
    AngularFireStorageModule
  ],
  providers: [{ 
    provide: HAMMER_GESTURE_CONFIG, 
    useClass: HammerGestureConfig 
  }],
  bootstrap: [AppComponent]
})
export class AppModule { }
