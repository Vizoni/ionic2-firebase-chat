import { Component, ChangeDetectorRef } from '@angular/core';
import { IonicPage, NavController, NavParams } from 'ionic-angular';

import { AuthService } from '../../providers/auth/auth.service';
import { User } from '../../models/user.model';
import { UserService } from './../../providers/user/user.service';

@IonicPage()
@Component({
  selector: 'page-user-profile',
  templateUrl: 'user-profile.html',
})
export class UserProfilePage {

  currentUser: User;
  canEdit: boolean = false;
  uploadProgress: number;
  private filePhoto: File;  // armazena a foto MAIS ATUAL do user (que tá no formulario)

  constructor(
    public authService: AuthService,
    public cd: ChangeDetectorRef,
    public navCtrl: NavController,
    public navParams: NavParams,
    public userService: UserService
  ) {}

  ionViewCanEnter(): Promise<boolean> {
    return this.authService.authenticated;
  }

  ionViewDidLoad() {
    this.userService.currentUser
      .subscribe((user: User) => {
        this.currentUser = user;
      })
  }

  onSubmit(event: Event): void {
    event.preventDefault(); // não dá refresh na página

    if (this.filePhoto) {
      let uploadTask = this.userService.uploadPhoto(this.filePhoto,this.currentUser.$key);

      // vai ouvir a mudança de estado dessa task (qndo completar)
      // o snapshot é uma callback pra acessar o estado atual do upload
      uploadTask.on('state_changed', (snapshot: firebase.storage.UploadTaskSnapshot) => {
        this.uploadProgress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        // divide o tanto q já foi enviado pelo total e multiplica por 100 pra obter a porcentagem
        this.cd.detectChanges();
        //detecta as mudanças que ocorreram do calculo para atualizar o template
      }, (error: Error) => {  // callback de erro
        //catch error
      }, () => { // callback qndo finalizar o upload
        this.editUser(uploadTask.snapshot.downloadURL); // passa a url completa
      } )

    } else {
      this.editUser();  // chama a função privada
    }
  }

  onPhoto(event): void { 
    this.filePhoto = event.target.files[0]; // como tá fazendo o upload de apenas 1 foto, usamos o índice 0
  }

  private editUser(photoUrl?: string): void {
    this.userService.edit({
      name: this.currentUser.name,
      username: this.currentUser.username,
      photo: photoUrl  || this.currentUser.photo || ''
      // se recebeu uma foto nova, põe a foto nova, se não, usa a antiga, se ainda não tiver, fica vazio
    }).then(() => {
      this.canEdit = false; // fecha o formulário
      this.filePhoto = undefined; // reseta o atributo
      this.uploadProgress = 0; // barra de progresso fica em 0%;
      this.cd.detectChanges();
    });
  }

}
