import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { PopoverContentComponent } from './popover-content/popover-content.component';
import { UserProfileModalComponent } from './user-profile-modal/user-profile-modal.component';
import { LoginComponent } from './login/login.component';
import { AngularFireModule } from '@angular/fire/compat';
import { environment } from 'src/environments/environment';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { RegisterComponent } from './register/register.component';

@NgModule({
  declarations: [AppComponent, PopoverContentComponent, UserProfileModalComponent, LoginComponent, RegisterComponent],
  imports: [BrowserModule, IonicModule.forRoot(), AppRoutingModule, AngularFireModule.initializeApp(environment.firebase), FormsModule, ReactiveFormsModule, AngularFirestoreModule.enablePersistence()],
  providers: [{ provide: RouteReuseStrategy, useClass: IonicRouteStrategy }, provideFirebaseApp(() => initializeApp(environment.firebase)), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())],
  bootstrap: [AppComponent],
})
export class AppModule {}
