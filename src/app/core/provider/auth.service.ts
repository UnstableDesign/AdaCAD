import { Injectable, Optional } from '@angular/core';
import { Auth, authState, createUserWithEmailAndPassword, GoogleAuthProvider, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, signOut, User } from '@angular/fire/auth';
import { traceUntilFirst } from '@angular/fire/performance';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly userDisposable: Subscription|undefined;
  public readonly user: Observable<User | null> = EMPTY;
  private readonly userData: Subscription|undefined;

  showLoginButton = false;
  showLogoutButton = false;
  isLoggedIn = false;

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
        this.isLoggedIn = isLoggedIn;
        
      });

      this.userData = authState(this.auth).subscribe(user => {
        console.log("user state change", user)
        if(user === undefined || user === null){
          this.username = ""
          this.uid = undefined;
          return;
        } 
        this.username = (user.displayName === null) ? user.email : user.displayName;
        this.uid = user.uid;
      }

      )
    }
  }

  async emailSignUp(email, password) : Promise<string>{
    return await createUserWithEmailAndPassword(this.auth, email, password)
    .then((userCredential) => {
      // Signed in 
      return "";
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      return errorCode;
    });
  }

  async emailSignIn(email, password) : Promise<string>{
    return await signInWithEmailAndPassword(this.auth, email, password)
    .then((userCredential) => {
      // Signed in 
      const user = userCredential.user;
      return "";
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      return error.code;
    });

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
