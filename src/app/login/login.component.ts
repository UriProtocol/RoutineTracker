import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent implements OnInit {

  constructor(private authService: AuthService, private formBuilder: FormBuilder, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd && event.url === '/login')
    ).subscribe(() => {
      this.errorMessage = null;
    });
  }

  errorMessage: string | null = null;

  email!: string;
  password!: string;
  editForm!: FormGroup
  isLoading = false;

  ngOnInit(): void {
    this.initForm();
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  initForm() {
    this.editForm = this.formBuilder.group({
      email: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  private translateErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
        return 'Correo electronico o contraseña incorrectas. Inténtalo de nuevo.';
      case 'auth/invalid-email':
        return 'La dirección de correo electrónico no es valida.';
      default:
        return 'Ocurrió un error durante el registro. Por favor, inténtalo de nuevo.';
    }
  }

  async login() {
    if (!this.editForm.valid) {
      console.log('El formulario es inválido');
      return;
    }

    this.isLoading = true;
    
    try {
      const { email, password } = this.editForm.value;
      await this.authService.login(email, password);
      this.router.navigate(['/home']);
    } catch (error:any) {
      this.errorMessage = this.translateErrorMessage(error.code);
    } finally {
      this.isLoading = false;
    }
  }


}
