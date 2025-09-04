import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../provider/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss'],
    imports: [FormsModule]
})
export class SignupComponent implements OnInit {

password: string = ""
email: string = ""

  constructor(public authService: AuthService) { }

  ngOnInit() {
  }

  onSubmit(formData) {
    // if (formData.valid) {
    //   console.log(formData.value);
    //   this.authService.emailSignup(
    //     formData.value.email,
    //     formData.value.password
    //   );
    // }
  }

}
