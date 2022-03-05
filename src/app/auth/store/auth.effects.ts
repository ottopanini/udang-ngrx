import {Actions, Effect, ofType} from '@ngrx/effects';
import {
  AUTHENTICATE_SUCCESS,
  AuthenticateFail,
  AuthenticateSuccess,
  LOGIN_START,
  LoginStart,
  SIGNUP_START,
  SignupStart
} from './auth.actions';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {AuthResponseData} from '../auth.service';
import {HttpClient} from '@angular/common/http';
import {of} from 'rxjs';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';

const handleAuthentication = (resData: AuthResponseData) => {
  return of(new AuthenticateSuccess({
    email: resData.email,
    userId: resData.localId,
    token: resData.idToken,
    expirationDate: new Date(new Date().getTime() + +resData.expiresIn * 1000)
  }));
};

const handleError = (err) => {
  let errorMessage = 'An unknown error occurred!';
  if (!err.error || !err.error.error) {
    return of(new AuthenticateFail(errorMessage));
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
  return of(new AuthenticateFail(err));
};

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
          catchError(err => handleError(err)),
          map((resData: AuthResponseData) => handleAuthentication(resData))
        );
    })
  );

  // does not dispatch an event
  @Effect({dispatch: false})
  authSuccess = this.actions$.pipe(ofType(AUTHENTICATE_SUCCESS), tap(() => {
    this.router.navigate(['/']);
  }));

  @Effect()
  authSignup = this.actions$.pipe(ofType(SIGNUP_START), switchMap((signupAction: SignupStart) => {
    return this.http.post<AuthResponseData>(
      'https://www.googleapis.com/identitytoolkit/v3/relyingparty/signupNewUser?key=' + environment.firebaseAPIKey,
      {
        email: signupAction.payload.email,
        password: signupAction.payload.password,
        returnSecureToken: true
      }
    )
    .pipe(
      catchError(err => handleError(err)),
      tap((resData: AuthResponseData) => handleAuthentication(resData))
    );
  }));

  constructor(private http: HttpClient, private actions$: Actions, private router: Router) {
  }
}
