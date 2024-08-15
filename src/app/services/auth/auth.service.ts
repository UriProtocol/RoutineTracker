import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { finalize, Observable, of } from 'rxjs';
import { Router } from '@angular/router';
import { Preferences } from '@capacitor/preferences';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  user$: Observable<any>;

  constructor(private afAuth: AngularFireAuth, private router: Router, private firestore: AngularFirestore, private storage: AngularFireStorage) {
    this.loadUserFromPreferences();
    this.user$ = afAuth.authState;
  }

  async login(email: string, password: string) {
    try {
      const result = await this.afAuth.signInWithEmailAndPassword(email, password);
      if (result.user) {
        await this.saveUserToPreferences(result.user);
        const userDoc$ = this.firestore.collection('users').doc(result.user.uid).get();

        userDoc$.subscribe((userDoc) => {
          if (userDoc.exists) {
            const userData = userDoc.data();
            const userDataObj = typeof userData === 'object' ? userData : {};
            
            Preferences.set({
              key: 'user',
              value: JSON.stringify({ ...userDataObj, uid: result.user?.uid, email: result.user?.email }),
            }).then(() => {
              console.log('User preferences updated successfully.');
            }).catch((error) => {
              console.error('Failed to update user preferences:', error);
            });
          }
        }, (error) => {
          console.error('Error fetching user document:', error);
        });
      }
      return result;
    } catch (error) {
      console.error('Error logging in', error);
      throw error;
    }
  }

  async saveUserToPreferences(user: any) {
    const userData = {
      uid: user.uid,
      email: user.email,
      name: user.name,
      photo: user.photoUrl
    };
    await Preferences.set({
      key: 'user',
      value: JSON.stringify(userData),
    });
  }

  async loadUserFromPreferences() {
    const { value } = await Preferences.get({ key: 'user' });
    if (value) {
      this.user$ = of(JSON.parse(value));
    }
  }

  async logout() {
    return this.afAuth.signOut().then(() => {
      Preferences.remove({ key: 'user' });
      this.router.navigate(['/login']);
    });
  }

  async register(email: string, password: string, name: string, photoUrl: any): Promise<void> {
    try {
      const result = await this.afAuth.createUserWithEmailAndPassword(email, password);
      if (result.user) {
        await this.saveAdditionalUserInfo(result.user.uid, name, photoUrl);
      }
    } catch (error) {
      console.error('Error registering user', error);
      throw error;
    }
  }

  async saveAdditionalUserInfo(userId: string, name: string, photoUrl: any): Promise<void> {
    try {
      const imageUrl = await this.uploadImage(photoUrl);

      await this.firestore.collection('users').doc(userId).set({
        uid: userId,
        name: name,
        photoUrl: imageUrl
      }, { merge: true });
    } catch (error) {
      console.error('Error saving user info', error);
    }
  }

  async uploadImage(imageBlob: any): Promise<string> {
    const decodedBlob = this.base64ToBlob(imageBlob, 'image/jpeg');

    const filename = `user-image_${new Date().getTime()}.jpg`;
    const filePath = `user-images/${filename}`;

    const storageRef = this.storage.ref(filePath);
    const task = storageRef.put(decodedBlob);

    return new Promise<string>((resolve, reject) => {
      task.percentageChanges().subscribe(progress => {
        console.log(`Upload progress: ${progress}%`);
      });

      task.snapshotChanges().pipe(
        finalize(() => {
          storageRef.getDownloadURL().subscribe(url => {
            resolve(url);
          }, error => {
            reject(error);
          });
        })
      ).subscribe();
    });
  }

  base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64.split(',')[1]);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

}
