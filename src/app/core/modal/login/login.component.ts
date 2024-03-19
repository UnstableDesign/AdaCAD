import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../../provider/auth.service';
import {UntypedFormControl, FormGroupDirective, NgForm, Validators} from '@angular/forms';
import {ErrorStateMatcher} from '@angular/material/core';

/** Error when invalid control is dirty, touched, or submitted. */
export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
  emailFormControl = new UntypedFormControl('', [Validators.required, Validators.email]);
  passwordFormControl = new UntypedFormControl('', [Validators.required]);
  matcher = new MyErrorStateMatcher();

  useemail: boolean = false;
  error: string ="";

  constructor(private router: Router, private auth: AuthService, private dialogRef: MatDialogRef<LoginComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) { }

  ngOnInit() {
  }


  onEmailLogin(){
    console.log("sign in with ", this.emailFormControl.value, this.passwordFormControl.value);

    this.auth.emailSignIn(this.emailFormControl.value, this.passwordFormControl.value).then(res => {
      if(res === ''){
        this.dialogRef.close('Created and Logged In New User!');
      }else{
        console.log("res", res);
        switch(res){
          case "auth/user-not-found" :
            this.error = "there is no user at that email address, did you mean to hit sign up?"
          break;
          case "auth/wrong-password":
            this.error = "wrong password"
          break;
          default:
            this.error = res;
        }
      }
    })
  }

  onEmailSignUp(){
    console.log("sign up with ", this.emailFormControl.value, this.passwordFormControl.value);

    this.auth.emailSignUp(this.emailFormControl.value, this.passwordFormControl.value).then(res => {
      if(res === ''){
        this.dialogRef.close('Created and Logged In New User!');
      }else{
        console.log("res", res);
        switch(res){
          case "auth/weak-password" :
            this.error = "please use a stronger password (with symbols or numbers)"
          break;
          case "auth/email-already-in-use":
            this.error = "this email is already associated with an existing account"
          break;
          default:
            this.error = res;
        }
      }
    });
  }



  // onEmailSubmit() {
    
  // }

  loginGoogle() {


    this.auth.login().then(logged_in => {
      this.dialogRef.close('Log In Via Google Success!');
    }, not_logged_in => {
      console.log(Error)
    });

  }

  openEmailLogin(){
    this.router.navigateByUrl('/email-login');
  }

  createNewEmailUser(){
    this.router.navigateByUrl('/signup');
  }

  

}
