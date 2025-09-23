import crypto from 'crypto';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

import { ApiResponse } from './entities/ApiResponse';
import { PasswordResetTokenData } from './entities/auth/PasswordResetTokenData';  // Fixed import
import ValidationUtils from './validators/ValidationUtils';
import {
    findUserByEmail,
    storePasswordResetToken,
    findValidResetToken,
    updateUserPassword,
    deleteResetToken
} from './utils/Supabase';  // Fixed casing - use 'Supabase' not 'supabase'

export class PasswordResetService {
    private static transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD
        }
    });
    
    static async requestPasswordReset(email: string): Promise<ApiResponse> {
        try {
            // Add debug logging
            console.log('Environment debug:', {
                GMAIL_USER: process.env.GMAIL_USER,
                hasGMAIL_APP_PASSWORD: !!process.env.GMAIL_APP_PASSWORD
            });

            const emailValidation = ValidationUtils.validateEmail(email);
            if (!emailValidation.isValid) {
                return {
                    success: false,
                    message: emailValidation.message,
                    statusCode: 400
                };
            }

            const user = await findUserByEmail(email);
            if (!user) {
                return {
                    success: true,
                    message: 'If this email exists, you will receive a reset code',
                    statusCode: 200
                };
            }
            
            const resetToken = crypto.randomBytes(4).toString('hex').toUpperCase();
            const tokenExpiry = new Date(Date.now() + 15 * 60 * 1000);
            
            const tokenData: PasswordResetTokenData = {
                userId: user.user_id.toString(),
                email: email,
                token: resetToken,
                expiresAt: tokenExpiry
            };
            
            await storePasswordResetToken(tokenData);
            const emailResult = await this.sendResetEmail(user, email, resetToken);
            
            if (emailResult.success) {
                console.log('Password reset email sent successfully');
            } else {
                console.error('Failed to send password reset email:', emailResult.error);
            }
            
            return {
                success: true,
                message: 'If this email exists, you will receive a reset code',
                statusCode: 200
            };
        } catch (error) {
            console.error('Password reset request error:', error);
            return {
                success: false,
                message: 'Failed to process reset request',
                error: error instanceof Error ? error.message : 'Unknown error',
                statusCode: 500
            };
        }
    }
    
    static async verifyTokenAndResetPassword(
        email: string, 
        token: string, 
        newPassword: string
    ): Promise<ApiResponse> {
        try {
            const emailValidation = ValidationUtils.validateEmail(email);
            if (!emailValidation.isValid) {
                return {
                    success: false,
                    message: emailValidation.message,
                    statusCode: 400
                };
            }

            if (!token || !newPassword) {
                return {
                    success: false,
                    message: 'Token and new password are required',
                    statusCode: 400
                };
            }

            const resetRecord = await findValidResetToken(email, token.toUpperCase());
            if (!resetRecord) {
                return {
                    success: false,
                    message: 'Invalid or expired reset code',
                    statusCode: 400
                };
            }
            
            const passwordValidation = ValidationUtils.validatePassword(newPassword);
            if (!passwordValidation.isValid) {
                return {
                    success: false,
                    message: passwordValidation.message,
                    statusCode: 400
                };
            }
            
            const hashedPassword = await ValidationUtils.hashPassword(newPassword);
            await updateUserPassword(resetRecord.user_id, hashedPassword);
            await deleteResetToken(resetRecord.id);
            
            return {
                success: true,
                message: 'Password reset successful',
                statusCode: 200
            };
        } catch (error) {
            console.error('Password reset verification error:', error);
            return {
                success: false,
                message: 'Failed to reset password',
                error: error instanceof Error ? error.message : 'Unknown error',
                statusCode: 500
            };
        }
    }
    
    // Fixed: ApiResponse<T> is now properly generic
    private static async sendResetEmail(
        user: any, 
        email: string, 
        resetToken: string
    ): Promise<ApiResponse<{ messageId: string }>> {
        try {
            console.log('Sending email via Gmail SMTP...');
            console.log('GMAIL_USER:', process.env.GMAIL_USER);
            console.log('Has GMAIL_APP_PASSWORD:', !!process.env.GMAIL_APP_PASSWORD);

            const senderEmail = process.env.GMAIL_USER;
            const senderName = process.env.GMAIL_SENDER_NAME || 'Quality for Outcomes';

            if (!senderEmail) {
                throw new Error('GMAIL_USER environment variable is not set');
            }

            const displayName = user.profile
                ? `${user.profile.first_name || ''} ${user.profile.last_name || ''}`.trim()
                : user.username || 'User';

            const mailOptions = {
                from: `"${senderName}" <${senderEmail}>`,
                to: email,
                subject: 'Password Reset Code',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>Password Reset Request</h2>
                        ${displayName !== 'User' ? `<p>Hello ${displayName},</p>` : '<p>Hello,</p>'}
                        <p>You requested a password reset. Use this code to reset your password:</p>
                        <div style="background-color: #f5f5f5; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 4px; margin: 20px 0; border-radius: 8px;">
                            ${resetToken}
                        </div>
                        <p>This code will expire in 15 minutes.</p>
                        <p>If you didn't request this, please ignore this email.</p>
                        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
                        <p style="color: #666; font-size: 12px;">
                            This email was sent by ${senderName}. If you have any questions, please contact our support team.
                        </p>
                    </div>
                `
            };
            
            const emailResult = await this.transporter.sendMail(mailOptions);
            console.log('Email sent successfully:', emailResult.messageId);
            
            return {
                success: true,
                message: 'Email sent successfully',
                data: { messageId: emailResult.messageId },
                statusCode: 200
            };
        } catch (error: any) {
            console.error('EMAIL SEND ERROR:', {
                message: error.message,
                code: error.code,
                responseCode: error.responseCode,
                response: error.response
            });
            
            return {
                success: false,
                message: 'Failed to send email',
                error: error.message,
                statusCode: 500
            };
        }
    }
}