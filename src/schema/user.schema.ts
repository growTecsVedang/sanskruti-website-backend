import { z } from 'zod';

// schemas
export const userEmailPwd = z.object({
  email: z
    .string({
      required_error: 'email is not defined',
    })
    .email(),
  password: z.string({
    required_error: 'password is not defined',
  }),
});

export const userUpdatePassword = userEmailPwd.merge(
  z.object({
    updatePassword: z.string({
      required_error: 'update password is not defined',
    }),
  })
);

export const userDetails = z.object({
  email: z
    .string({
      required_error: 'email is not defined',
    })
    .email(),
  name: z.string({
    required_error: 'name is not defined',
  }),
  dob: z
    .string({
      required_error: 'dob is not defined',
    })
    .refine((data) => !isNaN(Date.parse(new Date(data).toDateString())), {
      message: 'invalid date',
    }),
  mobileNo: z.number({
    required_error: 'mobile number is not defined',
  }),
  address: z.string({
    required_error: 'address is not defined',
  }),
});

export const userObject = userEmailPwd.merge(userDetails);

// types
export type ReqEmailPwd = z.infer<typeof userEmailPwd>;
export type ReqUserUpdatePassword = z.infer<typeof userUpdatePassword>;
export type ReqUserDetails = z.infer<typeof userDetails>;
export type ReqUserObject = z.infer<typeof userObject>;
