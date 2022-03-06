import {Actions, Effect, ofType} from '@ngrx/effects';
import {
  AUTHENTICATE_SUCCESS,
  AuthenticateFail,
  AuthenticateSuccess,
  AUTO_LOGIN,
  LOGIN_START,
  LoginStart,
  LOGOUT,
  SIGNUP_START,
  SignupStart
} from './auth.actions';
import {catchError, map, switchMap, tap} from 'rxjs/operators';
import {environment} from '../../../environments/environment';
import {AuthResponseData, AuthService} from '../auth.service';
import {HttpClient} from '@angular/common/http';
import {of} from 'rxjs';
import {Injectable} from '@angular/core';
import {Router} from '@angular/router';
import {User} from '../user.model';

const handleAuthentication = (resData: AuthResponseData) => {
  const expirationDate = new Date(new Date().getTime() + +resData.expiresIn * 1000);
  const user = new User(
    resData.email,
    resData.localId,
    resData.idToken,
    expirationDate
  );
  localStorage.setItem('userData', JSON.stringify(user));

  return of(new AuthenticateSuccess({
    email: resData.email,
    userId: resData.localId,
    token: resData.idToken,
    expirationDate
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
          tap((resData: AuthResponseData) => this.auth.setLogoutTimer(+resData.expiresIn * 1000)),
          map((resData: AuthResponseData) => handleAuthentication(resData)),
          catchError(err => handleError(err))
        );
    })
  );

  // does not dispatch an event
  @Effect({dispatch: false})
  authRedirect = this.actions$.pipe(ofType(AUTHENTICATE_SUCCESS), tap(() => {
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
      tap((resData: AuthResponseData) => this.auth.setLogoutTimer(+resData.expiresIn * 1000)),
      tap((resData: AuthResponseData) => handleAuthentication(resData)),
      catchError(err => handleError(err))
    );
  }));

  @Effect()
  authLogout = this.actions$.pipe(ofType(LOGOUT), tap(() => {
    this.auth.clearLogoutTimer();
    localStorage.removeItem('userData');
    this.router.navigate(['/auth']);
  }));

  @Effect()
  autoLogin = this.actions$.pipe(ofType(AUTO_LOGIN), map(() => {
    const userData: {
      email: string;
      id: string;
      _token: string;
      _tokenExpirationDate: string;
    } = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
      return;
    }

    const loadedUser = new User(
      userData.email,
      userData.id,
      userData._token,
      new Date(userData._tokenExpirationDate)
    );

    if (loadedUser.token) {
      // new Action is dispatched from here
      const expirationDuration = new Date(userData._tokenExpirationDate).getTime() - new Date().getTime();
      this.auth.setLogoutTimer(expirationDuration);
      return new AuthenticateSuccess({
        email: loadedUser.email,
        userId: loadedUser.id,
        token: loadedUser.token,
        expirationDate: new Date(userData._tokenExpirationDate)
      });
      // this.user.next(loadedUser);
      // const expirationDuration =
      //   new Date(userData._tokenExpirationDate).getTime() -
      //   new Date().getTime();
      // this.autoLogout(expirationDuration);
    }

    return { type: 'NO_EFFECT' }; // some action must be at least be returned to work with the map
  }));

  constructor(private http: HttpClient, private actions$: Actions, private router: Router, private auth: AuthService) {
  }
}
