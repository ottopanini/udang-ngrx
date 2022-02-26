import {Actions, Effect, ofType} from '@ngrx/effects';
import {Login, LOGIN_START, LoginStart} from './auth.actions';
import {catchError, map, switchMap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {AuthResponseData} from '../auth.service';
import {HttpClient} from '@angular/common/http';
import {of} from 'rxjs';
import {Injectable} from '@angular/core';

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
          catchError(err => of()),
          map((resData: AuthResponseData) => of(new Login({
            email: resData.email,
            userId: resData.localId,
            token: resData.idToken,
            expirationDate: new Date(new Date().getTime() + +resData.expiresIn * 1000)
          })))
        );
    })
  );

  constructor(private http: HttpClient, private actions$: Actions) {
  }
}
