import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import * as firebase from 'firebase/compat/app';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private uid:string;
  public user: firebase.User = undefined;
  private username: string = "";

  constructor( private afAuth: AngularFireAuth,
    private router: Router) {}

  login(email: string, password: string) {
        this.afAuth.auth.signInWithEmailAndPassword(email, password)
        .then(value => {
          console.log('Nice, it worked!');
          this.uid = value.user.uid;
          this.user = value.user;
          this.username = value.user.displayName;
          this.router.navigateByUrl('');
        })
        .catch(err => {
          console.log('Something went wrong: ', err.message);
        });
     }

     emailSignup(email: string, password: string) {
      this.afAuth.auth.createUserWithEmailAndPassword(email, password)
      .then(value => {
       console.log('Sucess', value);
       this.uid = value.user.uid;
       this.user = value.user;
       this.username = value.user.displayName;
       this.router.navigateByUrl('');
      })
      .catch(error => {
        console.log('Something went wrong: ', error);
      });
    }
  
    googleLogin() {
      const provider = new firebase.auth.GoogleAuthProvider();
      return this.oAuthLogin(provider)
        .then(value => {
          this.uid = value.user.uid;
          this.user = value.user;
          this.username = value.user.displayName;
       console.log('Sucess', value),
       this.router.navigateByUrl('');
     })
      .catch(error => {
        console.log('Something went wrong: ', error);
      });
    }

  
    logout() {
      this.afAuth.auth.signOut().then(() => {
        this.user === undefined;
        this.router.navigate(['/']);


      });
    }
  
    private oAuthLogin(provider) {
      return this.afAuth.auth.signInWithPopup(provider);
    }

    loggedIn():boolean{
      console.log("checking login", this.user);
      return this.user !== undefined;
    }


    getUid() : string{
      return this.uid;
    }




}
