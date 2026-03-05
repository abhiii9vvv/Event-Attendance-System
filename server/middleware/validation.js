/**
 * Request Validation Schemas using Joi
 */

const Joi = require('joi');
const { AppError } = require('./errorHandler');

// Attendance submission validation
const attendanceSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required().messages({
    'string.empty': 'Name is required',
    'string.min': 'Name must be at least 2 characters',
  }),
  systemId: Joi.string().trim().alphanum().min(5).max(20).required().messages({
    'string.empty': 'System ID is required',
    'string.alphanum': 'System ID must be alphanumeric',
  }),
  course: Joi.string().trim().max(50).required().messages({
    'string.empty': 'Course is required',
  }),
  year: Joi.string().trim().max(20).required().messages({
    'string.empty': 'Year is required',
  }),
  section: Joi.string().trim().max(20).required().messages({
    'string.empty': 'Section is required',
  }),
  group: Joi.string().trim().max(20).required().messages({
    'string.empty': 'Group is required',
  }),
  email: Joi.string()
    .email()
    .required()
    .custom((value) => {
      if (!/(sharda\.ac\.in|ug\.sharda\.ac\.in)$/.test(value.toLowerCase())) {
        throw new Error('Email must be a valid Sharda email');
      }
      return value;
    })
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Must be a valid email',
    }),
});

// Admin authentication
const authSchema = Joi.object({
  password: Joi.string().required().messages({
    'string.empty': 'Password is required',
  }),
});

// Validate middleware factory
const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    const messages = error.details.map((d) => d.message).join(', ');
    return next(new AppError(messages, 400));
  }

  req.body = value;
  next();
};

module.exports = {
  validate,
  attendanceSchema,
  authSchema,
};
