// api/auth/Login.ts - Refactored without Zod
import type { VercelRequest, VercelResponse } from '@vercel/node';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { createHandler } from '../../services/utils/HandlerFactory';
import { Validators } from '../../services/validators';
import { ResponseUtils } from '../../services/utils/ResponseUtils';
import { findUserByEmail } from '../../services/utils/Supabase';

function signToken(user: { user_id: number; email: string }) {
  return jwt.sign(
    {
      sub: user.user_id.toString(),
      email: user.email,
      userId: user.user_id
    },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "24h" }
  );
}

const loginUser = async (req: VercelRequest, res: VercelResponse) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await findUserByEmail(email);
  if (!user) {
    ResponseUtils.send(res, ResponseUtils.unauthorized('Invalid email or password'));
    return;
  }

  // Verify password
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    ResponseUtils.send(res, ResponseUtils.unauthorized('Invalid email or password'));
    return;
  }

  // Generate JWT token
  const token = signToken(user);

  // Prepare user response (without password)
  const profile = user.profile;
  const userResponse = {
    userId: user.user_id,
    email: user.email,
    username: user.username,
    firstName: profile?.first_name,
    lastName: profile?.last_name,
    organisation: profile?.organisation,
    avatarUrl: profile?.avatar_url,
    displayName: profile
      ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim()
      : user.username || user.email
  };

  ResponseUtils.send(res, ResponseUtils.success({
    user: userResponse,
    token
  }, 'Login successful'));
};

export default createHandler(loginUser, {
  allowedMethods: ['POST'],
  validator: Validators.userLogin
});