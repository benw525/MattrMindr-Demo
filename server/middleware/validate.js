const { z } = require("zod");

function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      return res.status(400).json({ error: errors[0], errors });
    }
    req.validatedBody = result.data;
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      return res.status(400).json({ error: errors[0], errors });
    }
    req.validatedQuery = result.data;
    next();
  };
}

function validateParams(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = result.error.issues.map((i) => i.message);
      return res.status(400).json({ error: errors[0], errors });
    }
    req.validatedParams = result.data;
    next();
  };
}

const coerceInt = z.union([
  z.number().int(),
  z.string().regex(/^\d+$/).transform(Number),
]);

const loginSchema = z.object({
  email: z.string().email("Valid email is required").max(255),
  password: z.string().min(1, "Password is required").max(500),
  rememberMe: z.boolean().optional(),
});

const mfaVerifySchema = z.object({
  code: z.union([z.string().min(4).max(10, "Code is too long"), z.number()]).optional(),
  token: z.union([z.string().min(4).max(10), z.number()]).optional(),
}).refine((data) => data.code || data.token, {
  message: "Either code or token is required",
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required").max(255),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Valid email is required").max(255),
  code: z.string().min(1, "Reset code is required").max(100),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(500),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().max(500).optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters").max(500),
});

const createUserSchema = z.object({
  email: z.string().email("Valid email is required").max(255),
  name: z.string().min(1, "Name is required").max(200),
  role: z.string().min(1, "Role is required").max(50),
});

const portalLoginSchema = z.object({
  email: z.string().email("Valid email is required").max(255),
  password: z.string().min(1, "Password is required").max(500),
});

const e164Phone = z.string().min(10, "Valid phone number is required").max(20).regex(/^\+?1?\d{10,15}$/, "Phone number must be in E.164 format (e.g. +12125551234)");

const smsSchema = z.object({
  phoneNumber: e164Phone,
  body: z.string().min(1, "Message body is required").max(1600),
  caseId: coerceInt.optional().nullable(),
  contactName: z.string().max(200).optional(),
});

const CASE_TYPES = ["Auto Accident", "Truck Accident", "Motorcycle Accident", "Pedestrian Accident", "Bicycle Accident", "Slip and Fall", "Trip and Fall", "Premises Liability", "Product Liability", "Medical Malpractice", "Dog Bite", "Wrongful Death", "Workers Compensation", "Nursing Home Abuse", "Other"];
const CASE_STATUSES = ["Active", "Pre-Litigation", "Litigation", "Settlement", "Closed", "Archived"];
const CASE_STAGES = ["Intake", "Investigation", "Treatment", "Pre-Litigation", "Litigation", "Discovery", "Mediation", "Trial", "Settlement", "Post-Settlement", "Closed"];

const caseCreateSchema = z.object({
  title: z.string().min(1, "Case title is required").max(500),
  clientName: z.string().max(300).optional().default(""),
  caseType: z.string().max(100).optional().default("Auto Accident"),
  type: z.string().max(100).optional().default("Auto Accident"),
  status: z.enum(CASE_STATUSES).optional().default("Active"),
  stage: z.enum(CASE_STAGES).optional().default("Intake"),
  accidentDate: z.string().max(30).optional().nullable(),
  statuteOfLimitationsDate: z.string().max(30).optional().nullable(),
  clientEmail: z.string().email().max(255).optional().nullable().or(z.literal("")),
  clientPhone: z.string().max(20).optional().nullable().or(z.literal("")),
  clientSsn: z.string().max(20).optional().nullable().or(z.literal("")),
  county: z.string().max(200).optional().nullable().or(z.literal("")),
  court: z.string().max(200).optional().nullable().or(z.literal("")),
  stateJurisdiction: z.string().max(100).optional().nullable().or(z.literal("")),
}).passthrough();

const aiAgentSchema = z.object({
  caseId: coerceInt,
  incidentDescription: z.string().max(10000).optional(),
  incidentLocation: z.string().max(500).optional(),
  injuryType: z.string().max(200).optional(),
  liabilityAssessment: z.string().max(5000).optional(),
  comparativeFaultPct: z.union([z.number().min(0).max(100), z.string().max(10)]).optional(),
  stateJurisdiction: z.string().max(100).optional(),
  caseType: z.string().max(100).optional(),
  documentType: z.string().max(200).optional(),
  customInstructions: z.string().max(10000).optional(),
  stage: z.string().max(100).optional(),
}).passthrough();

const docFolderSchema = z.object({
  name: z.string().min(1, "Folder name is required").max(200),
  caseId: coerceInt,
  parentId: coerceInt.optional().nullable(),
});

const docUpdateSchema = z.object({
  name: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  folderId: coerceInt.optional().nullable(),
}).passthrough();

const docMoveSchema = z.object({
  folderId: coerceInt.optional().nullable(),
});

const batchMoveSchema = z.object({
  documentIds: z.array(coerceInt).min(1, "At least one document ID is required"),
  folderId: coerceInt.optional().nullable(),
});

const batchDeleteSchema = z.object({
  documentIds: z.array(coerceInt).min(1, "At least one document ID is required"),
});

const classifyFilingSchema = z.object({
  filingId: coerceInt,
});

const docSummarySchema = z.object({
  text: z.string().min(1, "Document text is required").max(100000),
  docType: z.string().max(200).optional(),
  caseTitle: z.string().max(500).optional(),
  clientName: z.string().max(300).optional(),
});

const advocateSchema = z.object({
  caseId: coerceInt.optional().nullable(),
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string().min(1).max(50000),
  })).min(1, "At least one message is required"),
  screenContext: z.string().max(50000).optional(),
});

const smsConfigCreateSchema = z.object({
  caseId: coerceInt,
  phoneNumbers: z.array(z.string().max(20)).min(1, "At least one phone number required"),
  contactName: z.string().max(200).optional(),
  contactType: z.string().max(100).optional(),
  notifyHearings: z.boolean().optional(),
  notifyDeadlines: z.boolean().optional(),
  notifyCourtDates: z.boolean().optional(),
  notifyMeetings: z.boolean().optional(),
  reminderDays: z.number().int().min(0).max(365).optional(),
  customMessage: z.string().max(1600).optional(),
});

const smsDraftSchema = z.object({
  caseId: coerceInt,
  eventType: z.string().max(100).optional(),
  eventTitle: z.string().max(500).optional(),
  eventDate: z.string().max(30).optional(),
  contactName: z.string().max(200).optional(),
  contactType: z.string().max(100).optional(),
  customInstructions: z.string().max(5000).optional(),
});

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
});

const caseIdParamSchema = z.object({
  caseId: z.string().regex(/^\d+$/, "Case ID must be a number"),
});

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(1000)).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().int().min(1).max(200)).optional(),
});

module.exports = {
  validate,
  validateQuery,
  validateParams,
  loginSchema,
  mfaVerifySchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  createUserSchema,
  portalLoginSchema,
  smsSchema,
  caseCreateSchema,
  aiAgentSchema,
  docFolderSchema,
  docUpdateSchema,
  docMoveSchema,
  batchMoveSchema,
  batchDeleteSchema,
  classifyFilingSchema,
  docSummarySchema,
  advocateSchema,
  smsConfigCreateSchema,
  smsDraftSchema,
  idParamSchema,
  caseIdParamSchema,
  paginationSchema,
};
