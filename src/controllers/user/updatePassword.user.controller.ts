import { Request, Response } from 'express';
import UserModel from '../../model/user.model';
import { ReqUserUpdatePassword } from '../../schema/user.schema';
import bcrypt from 'bcrypt';

// Update Password
export const handleUpdatePassword = async (
  req: Request<{}, {}, ReqUserUpdatePassword>,
  res: Response
) => {
  const { email, password, updatePassword } = req.body;

  // check if user exists
  const foundUser = await UserModel.findOne({ email });
  if (!foundUser)
    return res
      .status(401)
      .send({ message: 'email/number or password is incorrect' }); // Unauthorized

  // evaluate password
  const match = await bcrypt.compare(password, foundUser.password);

  if (match) {
    // hash password
    const hashedPassword = await bcrypt.hash(updatePassword, 10);
    try {
      // update password in db
      await UserModel.findOneAndUpdate(
        { email: foundUser.email },
        { password: hashedPassword }
      );

      res.status(200).send({
        message: 'password changed successfully',
      });
    } catch (err: any) {
      console.log(err);
      res.sendStatus(500);
    }
  } else {
    res.status(401).send({ message: 'email/number or password is incorrect' });
  }
};

export default handleUpdatePassword;
