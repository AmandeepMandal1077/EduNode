import type { HydratedDocumentFromSchema } from "mongoose";
import mongoose, {
  type Document,
  type Types,
  type HydratedDocument,
  type HydratedDocFromModel,
} from "mongoose";

export enum PaymentStatus {
  PENDING = "pending",
  REFUNDED = "refunded",
  COMPLETED = "completed",
  FAILED = "failed",
}

export interface ICoursePurchase {
  course: Types.ObjectId;
  user: Types.ObjectId;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: string;
  paymentId: string;
  refundId?: string;
  refundAmount?: number;
  refundReason?: string;
  metadata?: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICoursePurchaseMethods {
  isRefundable(): boolean;
  processRefund(amount: number, reason: string): Promise<void>;
}

export interface ICoursePurchaseVirtuals {}

export type TCoursePurchaseModel = mongoose.Model<
  ICoursePurchase,
  {},
  ICoursePurchaseMethods,
  ICoursePurchaseVirtuals
>;

export type TCoursePurchaseDoc = HydratedDocument<
  ICoursePurchase,
  ICoursePurchaseMethods & ICoursePurchaseVirtuals
>;

const coursePurchaseSchema = new mongoose.Schema<
  ICoursePurchase,
  TCoursePurchaseModel,
  ICoursePurchaseMethods,
  {},
  ICoursePurchaseVirtuals
>(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: [true, "course reference is required"],
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "user reference is required"],
    },
    amount: {
      type: Number,
      required: [true, "course purchase amount is required"],
      min: [0, "amount must be non-negative"],
    },
    currency: {
      type: String,
      required: [true, "currency of amount required"],
      uppercase: true,
      default: "RUPEES",
    },
    status: {
      type: String,
      enum: {
        values: Object.values(PaymentStatus),
        message: "please select a valid transaction status",
      },
      default: PaymentStatus.PENDING,
    },
    paymentMethod: {
      type: String,
      required: [true, "payment method is required"],
    },
    paymentId: {
      type: String,
      required: [true, "payment id is required"],
    },
    refundId: {
      type: String,
    },
    refundAmount: {
      type: Number,
      min: [0, "amount must be non-negative"],
    },
    refundReason: {
      type: String,
    },
    metadata: {
      type: Map,
      of: String,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

coursePurchaseSchema.index({ user: 1, course: 1 });
coursePurchaseSchema.index({ createdAt: -1 });
coursePurchaseSchema.index({ status: 1 });

coursePurchaseSchema.methods.isRefundable = function (
  this: TCoursePurchaseDoc,
) {
  if (this.status !== "completed") return false;

  return this.createdAt > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
};

coursePurchaseSchema.methods.processRefund = async function (
  this: TCoursePurchaseDoc,
  amount: number,
  reason: string,
) {
  this.status = PaymentStatus.REFUNDED;
  this.refundAmount = amount || this.amount;
  this.refundReason = reason;
  await this.save();
};

export const CoursePurchase = mongoose.model<
  ICoursePurchase,
  TCoursePurchaseModel
>("CoursePurchase", coursePurchaseSchema);
