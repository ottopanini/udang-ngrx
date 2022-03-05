import {Actions, Effect, ofType} from '@ngrx/effects';
import {Login, LOGIN, LOGIN_START, LoginFail, LoginStart} from './auth.actions';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {AuthResponseData} from '../auth.service';
import {HttpClient} from '@angular/common/http';
import {of} from 'rxjs';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';

@Injectable()
export class AuthEffects {
  @Effect()
  authLogin = this.actions$.pipe(
    ofType(LOGIN_START),
    switchMap((authData: LoginStart) => {
      return this.http
        .post<AuthResponseData>(
          'https://www.googleapis.com/identitytoolkit/v3/relyingparty/verifyPassword?key=' + environment.firebaseAPIKey,
          {
            email: authData.payload.email,
            password: authData.payload.password,
            returnSecureToken: true
          }
        ).pipe(
          catchError(err => {
            let errorMessage = 'An unknown error occurred!';
            if (!err.error || !err.error.error) {
              return of(new LoginFail(errorMessage));
            }
            switch (err.error.error.message) {
              case 'EMAIL_EXISTS':
                errorMessage = 'This email exists already';
                break;
              case 'EMAIL_NOT_FOUND':
                errorMessage = 'This email does not exist.';
                break;
              case 'INVALID_PASSWORD':
                errorMessage = 'This password is not correct.';
                break;
            }
            return of(new LoginFail(err));
          }),
          map((resData: AuthResponseData) => of(new Login({
            email: resData.email,
            userId: resData.localId,
            token: resData.idToken,
            expirationDate: new Date(new Date().getTime() + +resData.expiresIn * 1000)
          })))
        );
    })
  );

  // does not dispatch an event
  @Effect({dispatch: false})
  authSuccess = this.actions$.pipe(ofType(LOGIN), tap(() => {
    this.router.navigate(['/']);
  }));

  constructor(private http: HttpClient, private actions$: Actions, private router: Router) {
  }
}
