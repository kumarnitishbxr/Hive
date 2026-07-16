import nodemailer from 'nodemailer';

const smtpHost = process.env.SMTP_HOST || 'smtp.ethereal.email';
const smtpPort = Number(process.env.SMTP_PORT) || 587;
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const smtpFrom = process.env.SMTP_FROM || 'StartupOps <no-reply@startupops.app>';
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

type MailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

type InvitationEmailPayload = {
  email: string;
  fullName: string;
  role: string;
  startupName: string;
  temporaryPassword: string;
  invitationToken: string;
  expiresAt: Date;
};

type StatusEmailPayload = {
  email: string;
  fullName: string;
  startupName: string;
  subject: string;
  heading: string;
  message: string;
};

type PasswordResetPayload = {
  email: string;
  fullName: string;
  startupName: string;
  temporaryPassword: string;
};

const createTransporter = () => {
  if (!smtpUser || !smtpPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
};

const shell = (heading: string, body: string) => `
  <div style="font-family:Arial,sans-serif;background:#f5f7fb;padding:32px 16px;">
    <div style="max-width:640px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px;background:linear-gradient(135deg,#2563eb,#0f766e);color:#ffffff;">
        <h1 style="margin:0;font-size:24px;">${heading}</h1>
      </div>
      <div style="padding:28px;color:#0f172a;line-height:1.6;">
        ${body}
      </div>
    </div>
  </div>
`;

const dispatchMail = async ({ to, subject, html, text }: MailPayload) => {
  const transporter = createTransporter();

  if (!transporter) {
    console.log('[Mail Service] SMTP not configured. Logging mail payload.');
    console.log({ to, subject, text });
    return;
  }

  await transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
    text
  });
};

export const sendInvitationEmail = async ({
  email,
  fullName,
  role,
  startupName,
  temporaryPassword,
  invitationToken,
  expiresAt
}: InvitationEmailPayload) => {
  const acceptUrl = `${clientUrl}?inviteToken=${invitationToken}`;
  const expiryLabel = expiresAt.toLocaleString();
  const subject = `You're invited to ${startupName} on StartupOps`;
  const text = [
    `Hello ${fullName},`,
    `You have been invited to join ${startupName} as ${role}.`,
    `Email: ${email}`,
    `Temporary Password: ${temporaryPassword}`,
    `Accept Invitation: ${acceptUrl}`,
    `Invitation expires at: ${expiryLabel}`
  ].join('\n');

  const html = shell(
    'You are invited to StartupOps',
    `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>You have been invited to join <strong>${startupName}</strong> as <strong>${role}</strong>.</p>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Email</strong>: ${email}</p>
        <p style="margin:0 0 8px;"><strong>Temporary Password</strong>: <span style="font-family:monospace;">${temporaryPassword}</span></p>
        <p style="margin:0;"><strong>Expires</strong>: ${expiryLabel}</p>
      </div>
      <p style="margin:24px 0;">
        <a href="${acceptUrl}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;">
          Accept Invitation
        </a>
      </p>
      <p>On first login, you will be required to change your temporary password.</p>
    `
  );

  await dispatchMail({ to: email, subject, html, text });
};

export const sendMemberStatusEmail = async ({
  email,
  fullName,
  startupName,
  subject,
  heading,
  message
}: StatusEmailPayload) => {
  const text = `Hello ${fullName},\n\n${message}\n\nWorkspace: ${startupName}`;
  const html = shell(
    heading,
    `<p>Hello <strong>${fullName}</strong>,</p><p>${message}</p><p><strong>Workspace</strong>: ${startupName}</p>`
  );

  await dispatchMail({ to: email, subject, html, text });
};

export const sendPasswordResetEmail = async ({
  email,
  fullName,
  startupName,
  temporaryPassword
}: PasswordResetPayload) => {
  const subject = `Your temporary password for ${startupName}`;
  const text = [
    `Hello ${fullName},`,
    `A workspace administrator reset your password for ${startupName}.`,
    `Temporary Password: ${temporaryPassword}`,
    `Please log in and change it immediately.`
  ].join('\n');
  const html = shell(
    'Password reset',
    `
      <p>Hello <strong>${fullName}</strong>,</p>
      <p>A workspace administrator reset your password for <strong>${startupName}</strong>.</p>
      <div style="background:#f8fafc;border:1px dashed #94a3b8;border-radius:12px;padding:16px;margin:20px 0;">
        <p style="margin:0;"><strong>Temporary Password</strong>: <span style="font-family:monospace;">${temporaryPassword}</span></p>
      </div>
      <p>Please log in and change it immediately.</p>
    `
  );

  await dispatchMail({ to: email, subject, html, text });
};
