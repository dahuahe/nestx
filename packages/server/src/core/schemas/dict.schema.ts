import { Schema, SchemaTypes as t } from 'mongoose';
export const DictSchema = new Schema({
    category: { type: t.String },
    name: { type: t.String },
    translate: { type: t.String },
    expand: { type: t.Mixed },
}, {
        timestamps: true,
        usePushEach: true
    });


DictSchema.set('toJSON', {
    transform: function (_doc: any, ret: any, _options: any) {
        ret.id = ret._id;
    }
}); 