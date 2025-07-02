import React from 'react';
import './index.css';
import { Link } from 'react-router-dom';
import useAuth from '../../../hooks/useAuth';

/**
 * Renders a signup form with username, password, and password confirmation inputs,
 * password visibility toggle, error handling, and a link to the login page.
 */
const Signup = () => {
  const {
    username,
    password,
    passwordConfirmation,
    showPassword,
    err,
    handleSubmit,
    handleInputChange,
    togglePasswordVisibility,
  } = useAuth('signup');

  return (
    <div className='container'>
      <h2>Sign up for FakeStackOverflow!</h2>
      {}
      <form onSubmit={handleSubmit}>
        <h4>Please enter your username.</h4>
        {/* TODO: Task 1 - Add an input field for the username input.
        The input field should correctly update the displayed value when text
        is entered. Use the 'input-text' class for styling.
        */}
        <input
          type='text'
          className='input-text'
          value={username}
          onChange={e => handleInputChange(e, 'username')}
          placeholder='Username'
          autoComplete='username'
          required
        />
        <h4>Please enter your password.</h4>
        {/* TODO: Task 1 - Add an input field for the password input.
        The input field should correctly update the value when text
        is entered. Make sure that the password visibility is correctly toggled.
        Use the 'input-text' class for styling.
        */}
        <input
          type={showPassword ? 'text' : 'password'}
          className='input-text'
          value={password}
          onChange={e => handleInputChange(e, 'password')}
          placeholder='Password'
          autoComplete='new-password'
          required
        />
        <h4>Please confirm your password.</h4>
        {}
        <input
          type={showPassword ? 'text' : 'password'}
          className='input-text'
          value={passwordConfirmation}
          onChange={e => handleInputChange(e, 'confirmPassword')}
          placeholder='Confirm Password'
          autoComplete='new-password'
          required
        />
        {/* TODO: Task 1 - Add an input field for the password confirmation input.
        The input field should correctly update the value when text
        is entered. Make sure that the password visibility is correctly toggled.
        Use the 'input-text' class for styling.
        */}
        <div className='show-password'>
          {/* TODO: Task 1 - Add a checkbox input field for the visibility toggle.
        The field should correctly update the password visibility when checked/unchecked.
        Use the id 'showPasswordToggle'. No styling class is required here.
        */}
          <input
            id='showPasswordToggle'
            type='checkbox'
            checked={showPassword}
            onChange={togglePasswordVisibility}
          />
          <label htmlFor='showPasswordToggle'>Show Password</label>
        </div>
        <button type='submit' className='login-button'>
          Submit
        </button>
      </form>
      {err && <p className='error-message'>{err}</p>}
      <Link to='/' className='login-link'>
        Have an account? Login here.
      </Link>
    </div>
  );
};

export default Signup;
