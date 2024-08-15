import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { AlertController } from '@ionic/angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  user = {
    email: '',
    password: '',
    name: '',
    photoUrl: '',
  };

  errorMessage: string | null = null;
  editForm!: FormGroup
  isLoading = false;

  constructor(private authService: AuthService, private router: Router, private alertController: AlertController, private formBuilder: FormBuilder) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd && event.url === '/register')
    ).subscribe(() => {
      this.user.photoUrl = '';
      this.errorMessage = null;
    });
  }

  ngOnInit(): void {
    this.initForm();
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  initForm() {
    this.editForm = this.formBuilder.group({
      name: ['', Validators.required],
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  async onSubmit() {
    this.isLoading = true;
    try {
      await this.authService.register(this.user.email, this.user.password, this.user.name, this.user.photoUrl);
      console.log('Usuario registrado exitosamente');

      const alert = await this.alertController.create({
        header: '¡Éxito!',
        message: 'Usuario creado exitosamente.',
        buttons: [{
          text: 'OK',
          handler: () => {
            this.router.navigate(['/login']);
          }
        }]
      });
      await alert.present();
    } catch (error: any) {
      console.error('Error during registration', error);
      this.errorMessage = this.translateErrorMessage(error.code);
    } finally {
      this.isLoading = false;
    }
  }


  private translateErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-email':
        return 'La dirección de correo electrónico no es valida.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/email-already-in-use':
        return 'Este correo ya esta en uso.';
      default:
        return 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.';
    }
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      this.user.photoUrl = this.base64ToDataUrl(image.base64String ?? '', image.format);
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  }

  base64ToDataUrl(base64String: string, contentType: string = 'image/jpeg'): string {
    return `data:${contentType};base64,${base64String}`;
  }
}
