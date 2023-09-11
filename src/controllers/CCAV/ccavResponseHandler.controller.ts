import { ObjectId } from "bson";
import { Request, Response } from "express";
import { decrypt } from "./utils/ccav.utils";
import { env } from "../../config/env";
import crypto from "crypto";
import z from "zod";
import PaymentModel from "../../model/payment.model";
import logger from "../../utils/logger.utils";
import orderModel from "../../model/order.model";
import cartModel from "../../model/cart.model";
import ProductModel from "../../model/product.model";
import { getPayZappCredentials } from "../config/payzapp.config.controller";

const resultSchema = z.object({
  order_id: z.string(),
  tracking_id: z.string(),
  bank_ref_no: z.string().nullish(),
  order_status: z.enum(["Success", "Failure", "Aborted", "Invalid", "Timeout"]),

  payment_mode: z.string().nullish(),
  card_name: z.string().nullish(),

  currency: z.string(),
  amount: z.string().refine((number) => !Number.isNaN(Number(number))),
  trans_date: z.string().nullish(),

  merchant_param1: z.string().nullish(),
});

const getObject = async (query: string) => {
  const params = new URLSearchParams(query);
  const result: any = {};

  params.forEach((value, key) => {
    result[key] = value;
  });

  try {
    const testResult = resultSchema.parse(result);
    return testResult;
  } catch (err) {
    return undefined;
  }
};

const handleCCAVResponse = async (
  req: Request<
    {},
    {},
    { encResp: string; orderNo: string; crossSellUrl: string }
  >,
  res: Response
) => {
  const { encResp, orderNo, crossSellUrl } = req.body;

  const { working_key } = await getPayZappCredentials();
  //Generate Md5 hash for the key and then convert in base64 string
  var md5 = crypto.createHash("md5").update(working_key).digest();
  var keyBase64 = Buffer.from(md5).toString("base64");

  //Initializing Vector and then convert in base64 string
  var ivBase64 = Buffer.from([
    0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09, 0x0a, 0x0b,
    0x0c, 0x0d, 0x0e, 0x0f,
  ]).toString("base64");

  const result = await getObject(decrypt(encResp, keyBase64, ivBase64));
  if (
    !result ||
    !result.bank_ref_no ||
    !result.card_name ||
    !result.payment_mode ||
    !result.trans_date
  ) {
    logger.error("ccva enc responce err result: " + result);
    return res
      .status(500)
      .redirect(
        `https://sanskrutinx.in/user/order/status?orderId=${orderNo}&tracking_id=${result?.tracking_id}`
      );
  }
  try {
    const payment = await PaymentModel.findOne({ orderId: result.order_id });
    if (!payment) {
      logger.error(
        "ccva enc responce payment not found order_id:" + result.order_id
      );
      return res
        .status(500)
        .redirect(
          `https://sanskrutinx.in/user/order/status?orderId=${orderNo}&tracking_id=${result?.tracking_id}`
        );
    }

    if (result.merchant_param1 !== payment.paymentInfo.secret)
      return res
        .status(500)
        .redirect(
          `https://sanskrutinx.in/user/order/status?orderId=${orderNo}&tracking_id=${result?.tracking_id}`
        );

    payment.paymentInfo = {
      amount: Number(result.amount),
      bank_ref_no: result.bank_ref_no,
      card_name: result.card_name,
      currency: result.currency,
      order_status: result.order_status,
      payment_mode: result.payment_mode,
      tracking_id: result.tracking_id,
      trans_date: result.trans_date,
      secret: "",
    };

    await payment.save();
    if (result.order_status == "Success") {
      return res
        .status(200)
        .redirect(
          `https://sanskrutinx.in/user/order/status?orderId=${orderNo}&tracking_id=${result?.tracking_id}`
        );
    } else {
      const orders = await orderModel.find({ orderId: orderNo });

      const cart = await cartModel.findOne({ userId: orders[0].userId });

      await Promise.all(
        orders.map(async (order) => {
          const product = await ProductModel.findOne({ _id: order.product.id });
          const variant = Object.values(
            order.product.varient.variations
          ).filter((item) => item);
          cart?.product.push({
            productId: product?._id,
            quantity: order.product.quantity,
            variant,
          });
        })
      );
      await cart?.save();
      await orderModel.deleteMany({ orderId: orderNo });

      return res
        .status(200)
        .redirect(
          `https://sanskrutinx.in/user/order/status?orderId=${orderNo}&tracking_id=${result?.tracking_id}`
        );
    }
  } catch (err) {
    logger.error("ccav response error " + err);
    return res
      .status(500)
      .redirect(
        `https://sanskrutinx.in/user/order/status?orderId=${orderNo}&tracking_id=${result?.tracking_id}`
      );
  }
};

export default handleCCAVResponse;
