import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AuthService } from '../provider/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  method: string = "";
  password: string = "";
  email: string = "";

  constructor(private router: Router, private authService: AuthService, private dialogRef: MatDialogRef<LoginComponent>,
    @Inject(MAT_DIALOG_DATA) private data: any) { }

  ngOnInit() {
  }

  selectEmailLogin(){
    this.method = "email";
  }

  onEmailSubmit(formData) {
    // if (formData.valid) {
    //   console.log(formData.value);
    //   this.authService.login(
    //     formData.value.email,
    //     formData.value.password
    //   );
    // }
  }

  loginGoogle() {
    // this.authService.googleLogin().then(logged_in=> {
    //   console.log("auth finished running")
    //   this.dialogRef.close('Log In Via Google Success!');
    // });
  }

  openEmailLogin(){
    this.router.navigateByUrl('/email-login');
  }

  createNewEmailUser(){
    this.router.navigateByUrl('/signup');
  }

  

}
