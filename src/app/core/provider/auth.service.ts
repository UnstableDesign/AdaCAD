import { Injectable, Optional } from '@angular/core';
import { EMPTY, Observable, Subscription } from 'rxjs';
import { getDatabase, ref as fbref, get as fbget } from '@angular/fire/database';
import { Auth, authState, createUserWithEmailAndPassword, GoogleAuthProvider, signInAnonymously, signInWithEmailAndPassword, signInWithPopup, signOut, User } from '@angular/fire/auth';



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
  firstLoad = true;

  public uid:string;
  public username: string = "";

  constructor(@Optional() private auth: Auth) {

    if (auth) {

       this.userDisposable = authState(this.auth).subscribe(user => {
        console.log("AUTH SUBSCRIBE CALLED")
        this.showLoginButton = (user === null);
        this.showLogoutButton = (user !== null);
        this.isLoggedIn = (user !== null);
        this.uid =(user === null) ? "" : user.uid;
        this.firstLoad = false;
        if(user !== null) this.username = (user.displayName === null) ? user.email : user.displayName;        

       });

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

  /**
   * Used to determine when login is taking place, at very first load or mid use?
   * @returns true if this is the first time the page is being loaded, false if it has already been active
   */
  isFirstSession() : boolean {
    return this.firstLoad;
  }

  /**
   * pings the users database to see if this user has an account already
   * if it does, returns the account info
   * if not, it returns null
   */
  getAccount(uid: string) : Promise<any> {
    const db = getDatabase();
    return fbget(fbref(db, `users/${uid}`)).then((userdata) => {
      if(userdata.exists()){
        return Promise.resolve(userdata.val());
      }else{
        return Promise.resolve(null);
      }
    });
  }

  /**
   * checks to see if this user has an id already saved for their last used file
   * @param user 
   */
  getMostRecentFileIdFromUser(user: any): Promise<number>{
    
    return this.getAccount(user.uid).then(data => {
      if(data.last_opened === undefined) return Promise.resolve(null);
      else return Promise.resolve(data.last_opened)
  
    }).catch(console.error);
  }

  /**
   * checks to see if this user has an ada file already saved for their last used file
   * @param user 
   */
    getMostRecentAdaFromUser(user: any): Promise<any>{
      
      return this.getAccount(user.uid).then(data => {
        if(data.ada === undefined) return Promise.resolve(null);
        else return Promise.resolve(data.ada)
     })
  
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
