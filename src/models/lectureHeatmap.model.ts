import mongoose, { Types } from "mongoose";

export interface ILectureHeatmap {
    lectureId: Types.ObjectId,
    segmentIndex: number,
    secondsWatched: number
}

export type TLectureHeatmapModel = mongoose.Model<ILectureHeatmap>

export const lectureHeatmapSchema = new mongoose.Schema<ILectureHeatmap, TLectureHeatmapModel>({
    lectureId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
        required: [true, "lecture reference is required"]
    },
    segmentIndex: {
        type: Number,
        required: [true, "segment index is required"]
    },
    secondsWatched: {
        type: Number,
        required: [true, "seconds watched is required"]
    }
},
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true }
    }
);
lectureHeatmapSchema.index({ lectureId: 1, segmentIndex: 1 }, { unique: true })
export const LectureHeatmap = mongoose.model<ILectureHeatmap, TLectureHeatmapModel>("LectureHeatmap", lectureHeatmapSchema);