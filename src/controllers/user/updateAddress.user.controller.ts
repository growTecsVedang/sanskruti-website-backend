import { Request, Response } from "express";
import UserModel from "../../model/user.model";
import { ReqAddress } from "../../schema/user.schema";
import { TokenPayload } from "../../utils/jwt.utils";

export const updateAddress = async (
  req: Request<{}, {}, TokenPayload & ReqAddress>,
  res: Response
) => {
  const { userUniqueIdentity, newAddress } = req.body;

  var user = await UserModel.findById(userUniqueIdentity);
  if (!user) {
    return res.status(401).json({
      message: "user not found",
      type: "error",
      isAuthenticated: false,
    }); // U
  }

  const newAddressArray = user.address.map((address) =>
    address.id === newAddress.id ? newAddress : address
  );

  const updateAddress = await UserModel.findOneAndUpdate(
    { email: user.email },
    {
      $set: {
        address: newAddressArray,
      },
    },
    {
      new: true,
      runValidators: true,
      useFindAndModify: false,
    }
  );

  res.status(200).json({
    success: true,
    type: "success",
    message: "Address updated successfully",
    address: updateAddress?.address,
  });
};
