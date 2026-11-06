/**
 * All app text, in both languages. Screens show them side by side, as in the INDEGE designs.
 * Kinyarwanda marked DRAFT was not in the designs and needs checking by a fluent reader.
 */
export const strings = {
  // Login (Kinyarwanda from the designs)
  welcomeBack: { en: "Welcome back", rw: "Murakaza neza" },
  loginIntro: { en: "Log in with your phone number", rw: "Injira ukoresheje nimero ya telefone" }, // DRAFT
  phone: { en: "Phone number", rw: "Nimero ya telefone" },
  password: { en: "Password", rw: "Ijambobanga" },
  forgotPassword: { en: "Forgot password?", rw: "Wibagiwe?" },
  logIn: { en: "Log in", rw: "Injira" },
  or: { en: "OR", rw: "CYANGWA" },
  noAccount: { en: "Don't have an account?", rw: "Nta konti ufite?" },
  signUpAction: { en: "Create one for free", rw: "Iyandikishe ku buntu" }, // DRAFT
  loginRouting: { en: "One login for Umukiriya (Customer) and Umukozi (Worker) accounts.", rw: "Kwinjira kumwe ku bakiriya n'abakozi." }, // DRAFT
  phoneHint: { en: "MTN and Airtel Rwanda numbers", rw: "Nimero za MTN na Airtel" }, // DRAFT
  trustLine: { en: "Free to join. Every phone number is confirmed by SMS.", rw: "Kwiyandikisha ni ubuntu. Nimero yose yemezwa na SMS." }, // DRAFT
  showPassword: { en: "Show password", rw: "Erekana ijambobanga" }, // DRAFT
  hidePassword: { en: "Hide password", rw: "Hisha ijambobanga" }, // DRAFT

  // Hero panel
  heroTitle: { en: "Daily work, made simple.", rw: "Akazi ka buri munsi, mu buryo bworoshye." }, // DRAFT
  heroText: { en: "INDEGE connects people who need help with workers who are ready to work.", rw: "INDEGE ihuza abakeneye ubufasha n'abakozi biteguye gukora." }, // DRAFT

  // Register (all DRAFT apart from role names)
  createAccount: { en: "Create your account", rw: "Fungura konti yawe" },
  registerIntro: { en: "We'll send a code to confirm your number", rw: "Turakoherereza kode yo kwemeza nimero yawe" },
  fullName: { en: "Full name", rw: "Amazina yombi" },
  newPasswordHint: { en: "At least 8 characters", rw: "Nibura inyuguti 8" },
  chooseRole: { en: "How will you use INDEGE?", rw: "Uzakoresha INDEGE ute?" },
  roleCustomer: { en: "Customer", rw: "Umukiriya" },
  roleCustomerText: { en: "I need workers", rw: "Nkeneye abakozi" },
  roleWorker: { en: "Worker", rw: "Umukozi" },
  roleWorkerText: { en: "I want work", rw: "Nshaka akazi" },
  roleBoth: { en: "Both", rw: "Byombi" },
  roleBothText: { en: "I do both", rw: "Nkora byombi" },
  terms: { en: "Terms", rw: "Amategeko" },
  privacy: { en: "Privacy Policy", rw: "Politiki y'ibanga" },
  continue: { en: "Continue", rw: "Komeza" },
  haveAccount: { en: "Already have an account?", rw: "Usanzwe ufite konti?" },

  // Verify (all DRAFT)
  verifyTitle: { en: "Confirm your number", rw: "Emeza nimero yawe" },
  codeSentTo: { en: "Enter the 6-digit code sent to", rw: "Andika kode y'imibare 6 yoherejwe kuri" },
  code: { en: "Code", rw: "Kode" },
  verify: { en: "Confirm", rw: "Emeza" },
  noCode: { en: "Didn't get a code?", rw: "Ntiwabonye kode?" },
  resend: { en: "Send again", rw: "Ongera wohereze" },
  resendIn: { en: "Send again in", rw: "Ongera wohereze mu" },
  codeResent: { en: "We sent a new code.", rw: "Twohereje indi kode." },
  changeNumber: { en: "Use a different number", rw: "Koresha indi nimero" },

  // Password reset (all DRAFT)
  forgotTitle: { en: "Reset your password", rw: "Hindura ijambobanga" },
  forgotIntro: { en: "Enter your number and we'll send you a code", rw: "Andika nimero yawe tukoherereze kode" },
  sendCode: { en: "Send code", rw: "Ohereza kode" },
  resetTitle: { en: "Choose a new password", rw: "Hitamo ijambobanga rishya" },
  newPassword: { en: "New password", rw: "Ijambobanga rishya" },
  savePassword: { en: "Save password", rw: "Bika ijambobanga" },
  passwordChanged: { en: "Password changed. Please log in.", rw: "Ijambobanga ryahinduwe. Ongera winjire." },
  backToLogin: { en: "Back to log in", rw: "Subira ahinjirirwa" },

  // Dashboard placeholder (all DRAFT)
  customerDashboard: { en: "Customer dashboard", rw: "Ahabugenewe abakiriya" },
  workerDashboard: { en: "Worker dashboard", rw: "Ahabugenewe abakozi" },
  dashboardSoon: { en: "Your dashboard is coming soon.", rw: "Ahabugenewe hazaza vuba." },
  switchToCustomer: { en: "Switch to customer", rw: "Jya ku mukiriya" },
  switchToWorker: { en: "Switch to worker", rw: "Jya ku mukozi" },
  becomeCustomer: { en: "Also hire workers", rw: "Nanjye nshaka abakozi" },
  becomeWorker: { en: "Also find work", rw: "Nanjye nshaka akazi" },
  logOut: { en: "Log out", rw: "Sohoka" },

  // Legal placeholder (DRAFT)
  legalSoon: { en: "This page will be published before launch.", rw: "Iyi paji izatangazwa mbere yo gutangira." },

  // Form validation (DRAFT)
  errPhone: { en: "Enter a valid MTN or Airtel number", rw: "Andika nimero nyayo ya MTN cyangwa Airtel" },
  errPasswordRequired: { en: "Enter your password", rw: "Andika ijambobanga" },
  errPasswordShort: { en: "Use at least 8 characters", rw: "Koresha nibura inyuguti 8" },
  errPasswordLong: { en: "Use at most 128 characters", rw: "Koresha inyuguti zitarenze 128" },
  errName: { en: "Enter your full name", rw: "Andika amazina yawe yombi" },
  errRole: { en: "Choose one", rw: "Hitamo kimwe" },
  errTerms: { en: "You need to accept to continue", rw: "Ugomba kwemera kugira ngo ukomeze" },
  errCode: { en: "Enter the 6-digit code", rw: "Andika kode y'imibare 6" },

  // Server errors, keyed by the API's `code` (DRAFT)
  INVALID_CREDENTIALS: { en: "Wrong phone number or password.", rw: "Nimero cyangwa ijambobanga sibyo." },
  LOGIN_LOCKED: { en: "Too many failed attempts. Try again later or reset your password.", rw: "Wagerageje kenshi. Ongera ugerageze nyuma cyangwa uhindure ijambobanga." },
  ACCOUNT_SUSPENDED: { en: "This account has been suspended. Please contact support.", rw: "Iyi konti yarahagaritswe. Vugana n'ubufasha." },
  INVALID_CODE: { en: "That code is wrong or has expired.", rw: "Iyo kode si yo cyangwa yararangiye." },
  OTP_COOLDOWN: { en: "Please wait a moment before asking for another code.", rw: "Tegereza gato mbere yo gusaba indi kode." },
  OTP_LIMIT: { en: "Too many codes requested for this number. Try again later.", rw: "Wasabye kode nyinshi. Ongera ugerageze nyuma." },
  TOO_MANY_REQUESTS: { en: "Too many attempts. Please wait and try again.", rw: "Wagerageje kenshi. Tegereza hanyuma wongere." },
  networkError: { en: "We can't reach INDEGE. Check your connection and try again.", rw: "Ntitubashije kugera kuri INDEGE. Reba interineti wongere ugerageze." },
  genericError: { en: "Something went wrong. Please try again.", rw: "Habaye ikibazo. Ongera ugerageze." },
} as const;

export type StringKey = keyof typeof strings;
