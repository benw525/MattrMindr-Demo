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
  code: z.union([z.string().min(4).max(10, "Code is too long"), z.number()]),
  token: z.union([z.string().min(4).max(10), z.number()]).optional(),
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

const smsSchema = z.object({
  phoneNumber: z.string().min(10, "Valid phone number is required").max(20),
  body: z.string().min(1, "Message body is required").max(1600),
  caseId: coerceInt.optional().nullable(),
  contactName: z.string().max(200).optional(),
});

const caseCreateSchema = z.object({
  title: z.string().min(1, "Case title is required").max(500),
  clientName: z.string().max(300).optional().default(""),
  caseType: z.string().max(100).optional().default("Auto Accident"),
  type: z.string().max(100).optional().default("Auto Accident"),
  status: z.enum(["Active", "Pre-Litigation", "Litigation", "Settlement", "Closed", "Archived"]).optional().default("Active"),
  stage: z.string().max(100).optional().default("Intake"),
}).passthrough();

const aiAgentSchema = z.object({
  caseId: coerceInt,
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

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
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
  idParamSchema,
  paginationSchema,
};
