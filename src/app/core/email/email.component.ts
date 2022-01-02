import { Component, OnInit } from '@angular/core';
import { AuthService } from '../provider/auth.service';

@Component({
  selector: 'app-email',
  templateUrl: './email.component.html',
  styleUrls: ['./email.component.scss']
})
export class EmailComponent implements OnInit {

  email: string = "";
  password: string = "";

  constructor(private authService: AuthService) { }

  ngOnInit() {
  }

  onSubmit(formData) {
    // if (formData.valid) {
    //   console.log(formData.value);
    //   this.authService.login(
    //     formData.value.email,
    //     formData.value.password
    //   );
    // }
  }

}
