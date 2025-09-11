import { inject, Injectable, OnDestroy } from '@angular/core';
import { Auth, User, user } from '@angular/fire/auth';
import { Subscription } from 'rxjs';

/**
 * A service to streamline interactions with firebase
 */
@Injectable({
  providedIn: 'root'
})
export class FirebaseService implements OnDestroy {

  //USER AUTHENTICATION
  private auth: Auth = inject(Auth);
  user$ = user(this.auth);
  userSubscription: Subscription;


  constructor() {
    this.userSubscription = this.user$.subscribe((aUser: User | null) => {
      //handle user state changes here. Note, that user will be null if there is no currently logged in user.
      console.log("FROM FIREBASE SERVICE ", aUser);
    })
  }


  ngOnDestroy() {
    // when manually subscribing to an observable remember to unsubscribe in ngOnDestroy
    this.userSubscription.unsubscribe();
  }

}

