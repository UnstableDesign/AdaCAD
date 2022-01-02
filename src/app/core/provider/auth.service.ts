import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Component, OnInit, OnDestroy, Optional } from '@angular/core';
import { Auth, authState, signInAnonymously, signOut, User, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { traceUntilFirst } from '@angular/fire/performance';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly userDisposable: Subscription|undefined;
  public readonly user: Observable<User | null> = EMPTY;
  private readonly userData: Subscription|undefined;

  showLoginButton = false;
  showLogoutButton = false;

  public uid:string;
  public username: string = "";


  constructor(@Optional() private auth: Auth) {

    if (auth) {
      this.user = authState(this.auth);

      this.userDisposable = authState(this.auth).pipe(
        traceUntilFirst('auth'),
        map(u => !!u)
      ).subscribe(isLoggedIn => {
        this.showLoginButton = !isLoggedIn;
        this.showLogoutButton = isLoggedIn;
        console.log("auth user", this.user, isLoggedIn);
        
      });

      this.userData = authState(this.auth).subscribe(user => {
        console.log("user state change")
        if(user === undefined || user === null){
          this.username = ""
          this.uid = undefined;
          return;
        } 
        this.username = user.displayName
        this.uid = user.uid;
      }

      )
    }
  }

  async login() {
    return await signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  async loginAnonymously() {
    return await signInAnonymously(this.auth);
  }

  async logout() {
    return await signOut(this.auth);
  }

    ngOnDestroy(): void {
      if (this.userDisposable) {
        this.userDisposable.unsubscribe();
      }

      if (this.userData) {
        this.userData.unsubscribe();
      }
    }
  




}
