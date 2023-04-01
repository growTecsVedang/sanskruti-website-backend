import { TokenPayload } from '../../utils/jwt.utils';
import { Response } from 'express';
import { VerifyRequest } from '../../middleware/verifyJwt';
import UserModel from '../../model/user.model';

// Protected Routes Controller
// Get User Details
export const handleGetUser = async (
  req: VerifyRequest<null, TokenPayload, null>,
  res: Response
) => {
  const email = req.body.email;

  // email doesn't exist in jwt token
  if (!email) return res.status(404).send('user not found');

  const user = await UserModel.findOne({ email: email });

  // username doesn't exist in db
  if (!user) return res.status(404).send('user not found');

  const userTrimmend = {
    name: user.name,
    email: user.email,
    dob: user.dob,
    mobileNo: user.mobileNo,
    address: user.address,
  };

  res.status(200).send(userTrimmend);
};

export default handleGetUser;
