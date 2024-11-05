interface VerificationMailOptions {
  to: string;
  from: string;
  subject: string;
  content: string;
}

const mail = {
  sendVerificationMail(options: VerificationMailOptions) {},
};

export default mail;
