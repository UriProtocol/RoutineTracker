import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private router: Router) { }

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Promise<boolean | UrlTree> {
    const isAuthenticated = await Preferences.get({ key: 'user' });

    if (isAuthenticated.value && state.url === "/login") {
      this.router.navigateByUrl('/home');
      return false;
    } else if (!isAuthenticated.value && state.url === "/login") {
      return true;
    } else if (isAuthenticated.value) {
      return true;
    } else {
      this.router.navigateByUrl('/login');
      return false;
    }
  }
}
