/**
 * @file AuthContext.jsx
 * @description useAuth hook adapter wrapping Redux auth slice for straightforward component usage.
 */
import { useSelector, useDispatch } from "react-redux";
import { selectCurrentUser, selectIsAuthenticated, logoutUser } from "../redux/slices/authSlice";

export const useAuth = () => {
  const dispatch = useDispatch();
  const user = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const logout = () => dispatch(logoutUser());

  return {
    user,
    isAuthenticated,
    logout,
  };
};

export default useAuth;
