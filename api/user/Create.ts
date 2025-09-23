// api/user/Create.ts - Remove Zod, use new system
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHandler } from '../../services/utils/HandlerFactory';
import { Validators } from '../../services/validators';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import { createUser, checkEmailExists, checkUsernameExists } from '../../services/UserService';


const registerUser = async (req: VercelRequest, res: VercelResponse) => {
  const { email, password, username, firstName, lastName, organisation } = req.body;

  // Check if email already exists
  const emailExists = await checkEmailExists(email);
  if (emailExists) {
    ResponseUtils.send(res, ResponseUtils.conflict('Email already registered'));
    return; // Just return, don't return the response
  }

  // Check if username already exists (if provided)
  if (username) {
    const usernameExists = await checkUsernameExists(username);
    if (usernameExists) {
      ResponseUtils.send(res, ResponseUtils.conflict('Username already taken'));
      return; // Just return, don't return the response
    }
  }

  // Create user and profile
  const newUser = await createUser({
    email,
    password,
    username,
    firstName,
    lastName,
    organisation
  });

  ResponseUtils.send(res, ResponseUtils.created(newUser, 'User registered successfully'));
  return; // Just return, don't return the response
};

export default createHandler(registerUser, {
  allowedMethods: ['POST'],
  validator: Validators.userRegistration  // This replaces Zod validation
});