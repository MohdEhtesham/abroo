import * as yup from 'yup';

export const phoneRegex = /^[6-9]\d{9}$/;
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const loginSchema = yup.object({
  identifier: yup
    .string()
    .required('Phone or email is required')
    .test('valid', 'Enter a valid phone or email', value => {
      if (!value) return false;
      return phoneRegex.test(value) || emailRegex.test(value);
    }),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
});

export const signupSchema = yup.object({
  fullName: yup.string().min(2, 'Too short').required('Name is required'),
  email: yup.string().matches(emailRegex, 'Invalid email').required('Email is required'),
  phone: yup
    .string()
    .matches(phoneRegex, 'Invalid Indian mobile number')
    .required('Phone is required'),
  password: yup.string().min(6, 'Min 6 characters').required('Password is required'),
});

export const otpSchema = yup.object({
  otp: yup.string().length(4, 'Enter 4 digit OTP').required('OTP is required'),
});

export const forgotSchema = yup.object({
  identifier: yup.string().required('Required'),
});

export const inquirySchema = yup.object({
  fullName: yup.string().required('Name is required'),
  phone: yup
    .string()
    .matches(phoneRegex, 'Invalid Indian mobile number')
    .required('Phone is required'),
  email: yup.string().matches(emailRegex, 'Invalid email').required('Email is required'),
  message: yup.string().max(500, 'Max 500 characters').default(''),
});

export type InquiryFormData = yup.InferType<typeof inquirySchema>;
export type LoginFormData = yup.InferType<typeof loginSchema>;
export type SignupFormData = yup.InferType<typeof signupSchema>;
