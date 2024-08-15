import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { IonicModule, IonModal } from '@ionic/angular';
import { OverlayEventDetail } from "@ionic/core/components"
import { Note, NoteService } from '../services/note/note.service';
import { Subscription } from 'rxjs';
import { PopoverContentComponent } from '../popover-content/popover-content.component';
import { PopoverController } from '@ionic/angular';
import { Preferences } from '@capacitor/preferences';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonRefresher } from '@ionic/angular';
@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class HomePage implements OnInit, OnDestroy {
  @ViewChild(IonModal) modal!: IonModal;
  noteSub!: Subscription;
  model: any = {};
  notes: Note[] = [];
  isOpen: boolean = false;
  isEditing: boolean = false;
  userProfile: any = {};
  userId: string = '';
  isLoading: boolean = false;

  constructor(private note: NoteService, private popoverCtrl: PopoverController, private changeDetector: ChangeDetectorRef, private router: Router) {
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd && event.url === '/home')
    ).subscribe(() => {
      this.loadUserNotes();
    });
  }

  async ngOnInit() {
    try {
      const { value } = await Preferences.get({ key: 'user' });
      if (value) {
        this.userProfile = JSON.parse(value);
        this.userId = this.userProfile.uid;
        this.loadUserNotes();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async loadUserNotes() {
    this.isLoading = true;
    try {
      const notes = await this.note.getNotes(this.userId);
      this.notes = notes;
      this.noteSub = this.note.notes.subscribe(notes => {
        this.notes = notes;
        this.isLoading = false;
        this.changeDetector.detectChanges();
      });
    } catch (error) {
      console.error('Error loading notes:', error);
      this.isLoading = false;
    }
  }


  onWillDismiss(event: Event) {
    const ev = event as CustomEvent<OverlayEventDetail<string>>;
    this.model = {};
    this.isOpen = false;
    this.isEditing = false;
  }

  cancel() {
    this.modal.dismiss(null, 'cancel');
  }

  async save(form: NgForm) {
    try {
      if (!form.valid) {
        return;
      }
      console.log(form.value);
      if (this.model?.id) await this.note.updateNote(this.model.id, this.userId, form.value);
      else await this.note.addNote(this.userId, form.value);
      this.modal.dismiss();
    } catch (e) {
      console.log(e);
    }

  }

  async deleteNote(note: Note) {
    try {
      await this.note.deleteNote(note?.id!, this.userId);
    } catch (e) {
      console.log(e)
    }
  }

  async editNote(note: Note) {
    try {
      this.isOpen = true;
      this.isEditing = true;
      this.model = { ...note };
    } catch (e) {
      console.log(e)
    }
  }

  async presentPopover(ev: any) {
    const popover = await this.popoverCtrl.create({
      component: PopoverContentComponent,
      event: ev,
      translucent: true
    });
    return await popover.present();
  }

  async doRefresh(event: any) {
    try {
      await this.loadUserNotes(); 
      event.target.complete(); 
    } catch (error) {
      console.error('Error refreshing notes:', error);
      event.target.complete();
    }
  }
  


  ngOnDestroy(): void {
    if (this.noteSub) this.noteSub.unsubscribe();
  }
}
