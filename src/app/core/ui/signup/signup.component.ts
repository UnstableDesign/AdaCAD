import { Component, OnInit, inject } from '@angular/core';
import { AuthService } from '../../provider/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss'],
    imports: [FormsModule]
})
export class SignupComponent implements OnInit {
authService = inject(AuthService);


password: string = ""
email: string = ""

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
