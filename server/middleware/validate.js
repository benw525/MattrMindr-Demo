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

const loginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});

const mfaVerifySchema = z.object({
  code: z.union([z.string().min(4, "Code is required"), z.number()]),
  token: z.union([z.string().min(4, "Code is required"), z.number()]).optional(),
});

const forgotPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
});

const resetPasswordSchema = z.object({
  email: z.string().email("Valid email is required"),
  code: z.string().min(1, "Reset code is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

const createUserSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
});

const portalLoginSchema = z.object({
  email: z.string().email("Valid email is required"),
  password: z.string().min(1, "Password is required"),
});

const smsSchema = z.object({
  to: z.string().min(10, "Valid phone number is required"),
  body: z.string().min(1, "Message body is required"),
  caseId: z.union([z.string(), z.number()]).optional(),
});

const caseCreateSchema = z.object({
  title: z.string().min(1, "Case title is required"),
  clientName: z.string().optional().default(""),
  caseType: z.string().optional().default("Auto Accident"),
  status: z.string().optional().default("Active"),
}).passthrough();

const aiAgentRunSchema = z.object({
  caseId: z.union([z.string(), z.number()]),
}).passthrough();

const idParamSchema = z.object({
  id: z.string().regex(/^\d+$/, "ID must be a number"),
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
  aiAgentRunSchema,
  idParamSchema,
};
