import { Request, Response } from "express";
import UserModel from "../../model/user.model";
import { ReqAddressObject } from "../../schema/user.schema";
import { TokenPayload } from "../../utils/jwt.utils";
import { getUserFromEmailOrNumber } from "../../utils/user/getUserFromEmailOrNumber";

export const addAddress = async (
  req: Request<{}, {}, TokenPayload & ReqAddressObject>,
  res: Response
) => {
  const {
    userUniqueIdentity,
    provider,
    fullName,
    contactNo,
    pincode,
    nearBy,
    landmark,
    city,
    state,
  } = req.body;

  var user = await getUserFromEmailOrNumber(userUniqueIdentity);
  if (!user) {
    return res.status(401).json({
      message: "user not found",
      type: "error",
      isAuthenticated: false,
    }); // U
  }

  let isExist: boolean = false;
  user?.address.forEach((i: any) => {
    if (
      i.fullName === fullName &&
      i.contactNo === contactNo &&
      i.pincode === pincode &&
      i.nearBy === nearBy &&
      i.landmark === landmark &&
      i.city === city &&
      i.state === state
    ) {
      isExist = true;
    }
  });

  if (isExist) {
    res.status(409).json({
      message: "address already exist",
      type: "warning",
    });
  } else {
    try {
      const newAddressObj = {
        fullName,
        contactNo,
        pincode,
        nearBy,
        landmark,
        city,
        state,
      };
      user.address.push(newAddressObj);

      const updatedUser = await user.save({ validateBeforeSave: false });
      res.status(201).json({
        type: "success",
        address: updatedUser.address,
      });
    } catch (error) {
      res.status(502).json({
        error,
      });
    }
  }
};
