import nodemailer from 'nodemailer';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return transporter;
}

export async function sendSpaceInviteEmail(email, spaceName, inviterName, role) {
  const transport = getTransporter();

  if (!transport) {
    console.log('=== SPACE INVITATION ===');
    console.log(`To: ${email}`);
    console.log(`Space: ${spaceName}`);
    console.log(`Invited by: ${inviterName}`);
    console.log(`Role: ${role}`);
    console.log('========================');
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@cpleaderboard.com',
    to: email,
    subject: `You're invited to join "${spaceName}" - CP Leaderboard`,
    html: `
      <h2>Space Invitation</h2>
      <p><strong>${inviterName}</strong> invited you to join <strong>${spaceName}</strong> as a <strong>${role}</strong>.</p>
      <p>Log in to CP Leaderboard to accept or decline the invitation.</p>
    `
  });
}

export async function sendPasswordResetEmail(email, resetUrl) {
  const transport = getTransporter();

  if (!transport) {
    // Development fallback: log to console
    console.log('=== PASSWORD RESET ===');
    console.log(`To: ${email}`);
    console.log(`Reset URL: ${resetUrl}`);
    console.log('=====================');
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@cpleaderboard.com',
    to: email,
    subject: 'Password Reset - CP Leaderboard',
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset for your CP Leaderboard account.</p>
      <p><a href="${resetUrl}">Click here to reset your password</a></p>
      <p>This link expires in 1 hour.</p>
      <p>If you did not request this, you can safely ignore this email.</p>
    `
  });
}
