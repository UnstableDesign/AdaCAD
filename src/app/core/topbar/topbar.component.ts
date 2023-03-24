import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from "@angular/material/dialog";
import { LoginComponent } from '../login/login.component';
import { AboutModal } from '../modal/about/about.modal';
import { AuthService } from '../provider/auth.service';

@Component({
  selector: 'app-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss']
})



export class TopbarComponent implements OnInit {
  

   @Output() onCollapseSidebar: any = new EventEmitter();
  

  @Input() drawer;
  @Input() collapsed;



  constructor(private dialog: MatDialog, public auth: AuthService) { }

  ngOnInit(){
  }

  ngAfterViewInit() {

  }




  openAboutDialog() {
    const dialogRef = this.dialog.open(AboutModal);

  }
  openLoginDialog() {
      const dialogRef = this.dialog.open(LoginComponent, {
        width: '600px',
      });
  }

  //need to handle this and load the file somehow
  // openNewFileDialog() {


  //   const dialogRef = this.dialog.open(InitModal, {
  //     data: {loomtypes: this.loomtypes, density_units: this.density_units, source: this.source}
  //   });

  //   dialogRef.afterClosed().subscribe(loadResponse => {
  //     if(loadResponse !== undefined) this.onLoadNewFile.emit(loadResponse);

  //  });



  // }

  collapse(){
    this.collapsed = !this.collapsed;
    this.onCollapseSidebar.emit();

  }

  logout(){
    this.auth.logout();
  }

  // clear(){
  // 	this.onClearScreen.emit();
  // }

}
