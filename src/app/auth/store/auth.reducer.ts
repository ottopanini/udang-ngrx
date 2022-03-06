import {User} from '../user.model';
import {
  AuthActions,
  AUTHENTICATE_FAIL,
  AUTHENTICATE_SUCCESS,
  CLEAR_ERROR,
  LOGIN_START,
  LOGOUT,
  SIGNUP_START
} from './auth.actions';

export interface State {
  user: User;
  authError: string;
  loading: boolean;
}

const initialState: State = {
  user: null,
  authError: null,
  loading: false
};

export function authReducer(state = initialState, action: AuthActions) {
  switch (action.type) {
    case AUTHENTICATE_SUCCESS:
      const user = new User(
        action.payload.email,
        action.payload.userId,
        action.payload.token,
        action.payload.expirationDate
      );

      return {
        ...state,
        authError: null,
        loading: false,
        user
      };
    case LOGIN_START:
    case SIGNUP_START:
      return {
        ...state,
        loading: true,
        authError: null
      };
    case AUTHENTICATE_FAIL:
      return {
        ...state,
        loading: false,
        authError: action.payload
      };
    case LOGOUT:
      return {
        ...state,
        authError: null,
        user: null
      };
    case CLEAR_ERROR:
      return {
        ...state,
        authError: null
      };
    default:
      return state;
  }
}
