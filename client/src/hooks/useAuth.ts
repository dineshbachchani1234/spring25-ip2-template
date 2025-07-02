import { useNavigate } from 'react-router-dom';
import { ChangeEvent, useState } from 'react';
import useLoginContext from './useLoginContext';
import { createUser, loginUser } from '../services/userService';
import { User } from '../types';

/**
 * Custom hook to manage authentication logic, including handling input changes,
 * form submission, password visibility toggling, and error validation for both
 * login and signup processes.
 *
 * @param authType - Specifies the authentication type ('login' or 'signup').
 * @returns {Object} An object containing:
 *   - username: The current value of the username input.
 *   - password: The current value of the password input.
 *   - passwordConfirmation: The current value of the password confirmation input (for signup).
 *   - showPassword: Boolean indicating whether the password is visible.
 *   - err: The current error message, if any.
 *   - handleInputChange: Function to handle changes in input fields.
 *   - handleSubmit: Function to handle form submission.
 *   - togglePasswordVisibility: Function to toggle password visibility.
 */
const useAuth = (authType: 'login' | 'signup') => {
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [passwordConfirmation, setPasswordConfirmation] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string>('');
  const { setUser } = useLoginContext();
  const navigate = useNavigate();

  /**
   * Toggles the visibility of the password input field.
   */
  const togglePasswordVisibility = () => {
    setShowPassword(prev => !prev);
    // TODO - Task 1: Toggle password visibility
  };

  /**
   * Handles changes in input fields and updates the corresponding state.
   *
   * @param e - The input change event.
   * @param field - The field being updated ('username', 'password', or 'confirmPassword').
   */
  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: 'username' | 'password' | 'confirmPassword',
  ) => {
    const { value } = e.target;
    if (field === 'username') setUsername(value);
    else if (field === 'password') setPassword(value);
    else if (field === 'confirmPassword') setPasswordConfirmation(value);
    // TODO - Task 1: Handle input changes for the fields
  };

  /**
   * Validates the input fields for the form.
   * Ensures required fields are filled and passwords match (for signup).
   *
   * @returns {boolean} True if inputs are valid, false otherwise.
   */
  const validateInputs = (): boolean => {
    if (!username.trim() || !password) {
      setErr('Username and password are required.');
      return false;
    }
    if (authType === 'signup') {
      if (!passwordConfirmation) {
        setErr('Please confirm your password.');
        return false;
      }
      if (password !== passwordConfirmation) {
        setErr('Passwords do not match.');
        return false;
      }
    }
    setErr('');
    return true;
    // TODO - Task 1: Validate inputs for login and signup forms
    // Display any errors to the user
  };

  /**
   * Handles the submission of the form.
   * Validates input, performs login/signup, and navigates to the home page on success.
   *
   * @param event - The form submission event.
   */
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateInputs()) {
      return;
    }

    try {
      let user: User;

      if (authType === 'signup') {
        user = await createUser({ username, password });
      } else {
        user = await loginUser({ username, password });
      }

      setUser(user);
      navigate('/home');
    } catch (error: unknown) {
      let errorMessage = 'An error occurred. Please try again.';

      if (error && typeof error === 'object') {
        if ('response' in error && error.response && typeof error.response === 'object') {
          const response = error.response as { data?: { error?: string } };
          if (response.data?.error) {
            errorMessage = response.data.error;
          }
        } else if ('message' in error && typeof (error as Error).message === 'string') {
          errorMessage = (error as Error).message;
        }
      }

      setErr(errorMessage);
    }
  };

  return {
    username,
    password,
    passwordConfirmation,
    showPassword,
    err,
    handleInputChange,
    handleSubmit,
    togglePasswordVisibility,
  };
};

export default useAuth;
