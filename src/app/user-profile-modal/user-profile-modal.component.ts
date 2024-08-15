import { Component, OnInit } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { finalize } from 'rxjs';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireStorage } from '@angular/fire/compat/storage';

@Component({
  selector: 'app-user-profile-modal',
  templateUrl: './user-profile-modal.component.html',
  styleUrls: ['./user-profile-modal.component.scss'],
})
export class UserProfileModalComponent implements OnInit {
  userProfile = {
    uid: '',
    name: '',
    email: '',
    photoUrl: ''
  };
  isEditing: boolean = false;
  editForm!: FormGroup;
  tempPhotoUrl: string = '';

  constructor(private modalCtrl: ModalController, private fb: FormBuilder, private storage: AngularFireStorage, private firestore: AngularFirestore, private alertController: AlertController) {
    this.editForm = this.fb.group({
      name: [''],
      email: ['']
    });
  }

  async ngOnInit() {
    try {
      const { value } = await Preferences.get({ key: 'user' });
      if (value) {
        this.userProfile = JSON.parse(value);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  dismissModal() {
    this.modalCtrl.dismiss();
  }

  async editProfile() {
    try {
      this.tempPhotoUrl = this.userProfile.photoUrl;
      this.editForm.patchValue({
        name: this.userProfile.name,
        email: this.userProfile.email
      });
      this.isEditing = true;
    } catch (e) {

    }
  }

  async saveChanges() {
    try {
      console.log(this.tempPhotoUrl !== this.userProfile.photoUrl)
      const userId = this.userProfile.uid

      let photoUrl = this.userProfile.photoUrl;

      if (this.tempPhotoUrl !== this.userProfile.photoUrl) {
        photoUrl = await this.uploadImage(this.tempPhotoUrl);
      }

      await this.firestore.collection('users').doc(userId).update({
        name: this.editForm.get('name')?.value,
        email: this.editForm.get('email')?.value,
        photoUrl: photoUrl
      });

      this.userProfile.name = this.editForm.get('name')?.value;
      this.userProfile.email = this.editForm.get('email')?.value;
      this.userProfile.photoUrl = photoUrl;
      this.tempPhotoUrl = photoUrl;

      await Preferences.set({
        key: 'user',
        value: JSON.stringify(this.userProfile)
      });


      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'Usuario editado con éxito.',
        buttons: [{
          text: 'OK',
          handler: () => {
            this.isEditing = false;
          }
        }]
      });
      await alert.present();
    } catch (e) {
      console.error('Error saving changes:', e);
      this.isEditing = false;
    }
  }

  async cancelChange() {
    this.isEditing = false;
  }

  async takePicture() {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      this.tempPhotoUrl = this.base64ToDataUrl(image.base64String ?? '', image.format);
    } catch (error) {
      console.error('Error capturing image:', error);
    }
  }

  base64ToDataUrl(base64String: string, contentType: string = 'image/jpeg'): string {
    return `data:${contentType};base64,${base64String}`;
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
