import {User} from '../user.model';
import {AuthActions, AUTHENTICATE_FAIL, AUTHENTICATE_SUCCESS, LOGIN_START, LOGOUT} from './auth.actions';

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
    default:
      return state;
  }
}
