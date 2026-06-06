import mongoose, { Types } from "mongoose";

interface IComment {
  lectureId: Types.ObjectId;
  userId: Types.ObjectId;
  content: string;
  likes: number;
  dislikes: number;
  parentCommentId?: Types.ObjectId;
  replyCount?: number;
  isDeleted?: boolean;
  deletedAt?: Date;
}

interface ICommentMethods {
  likeComment(userId: string): Promise<TCommentDoc>;
  dislikeComment(userId: string): Promise<TCommentDoc>;
  deleteComment(): Promise<TCommentDoc>;
}
interface ICommentVirtuals {}

type TCommentModel = mongoose.Model<
  IComment,
  {},
  ICommentMethods,
  ICommentVirtuals
>;

type TCommentDoc = mongoose.HydratedDocument<
  IComment,
  ICommentMethods,
  {},
  ICommentVirtuals
>;

const commentLikeSchema = new mongoose.Schema({
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    required: [true, "Comment reference is required"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
  },
});
commentLikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });
const CommentLike = mongoose.model("CommentLike", commentLikeSchema);

const commentDislikeSchema = new mongoose.Schema({
  commentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Comment",
    required: [true, "Comment reference is required"],
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
  },
});
commentDislikeSchema.index({ commentId: 1, userId: 1 }, { unique: true });
const CommentDislike = mongoose.model("CommentDislike", commentDislikeSchema);

const commentSchema = new mongoose.Schema<
  IComment,
  TCommentModel,
  ICommentMethods,
  {},
  ICommentVirtuals
>(
  {
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: [true, "Lecture reference is required"],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
    },

    content: {
      type: String,
      required: [true, "Comment content is required"],
    },

    likes: {
      type: Number,
      default: 0,
    },

    dislikes: {
      type: Number,
      default: 0,
    },

    parentCommentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
    },

    replyCount: {
      type: Number,
      default: 0,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.methods.likeComment = async function (
  this: TCommentDoc,
  userId: string,
) {
  const alreadyLikedComment = await CommentLike.findOne({
    commentId: this._id,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (alreadyLikedComment) {
    await alreadyLikedComment.deleteOne();
    this.likes--;
  } else {
    const alreadyDislikedComment = await CommentDislike.findOne({
      commentId: this._id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (alreadyDislikedComment) {
      await alreadyDislikedComment.deleteOne();
      this.dislikes--;
    }
    await CommentLike.create({
      commentId: this._id,
      userId: new mongoose.Types.ObjectId(userId),
    });
    this.likes++;
  }

  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.dislikeComment = async function (
  this: TCommentDoc,
  userId: string,
) {
  const alreadyDislikedComment = await CommentDislike.findOne({
    commentId: this._id,
    userId: new mongoose.Types.ObjectId(userId),
  });

  if (alreadyDislikedComment) {
    await alreadyDislikedComment.deleteOne();
    this.dislikes--;
  } else {
    const alreadyLikedComment = await CommentLike.findOne({
      commentId: this._id,
      userId: new mongoose.Types.ObjectId(userId),
    });

    if (alreadyLikedComment) {
      await alreadyLikedComment.deleteOne();
      this.likes--;
    }
    await CommentDislike.create({
      commentId: this._id,
      userId: new mongoose.Types.ObjectId(userId),
    });
    this.dislikes++;
  }

  return this.save({ validateBeforeSave: false });
};

commentSchema.methods.deleteComment = async function (this: TCommentDoc) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save({ validateBeforeSave: false });
};

export const Comment = mongoose.model("Comment", commentSchema);
