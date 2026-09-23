import {z} from "zod";
const label = z.string().trim().min(1).max(160);
const visualText=z.string().trim().min(1).max(1200);
const item = z.object({ label, detail: visualText });

const datum = z.object({label, value:z.number().finite()});
export const visualSchema = z.discriminatedUnion("kind", [
  z.object({kind:z.literal("bar_chart"),title:label,unit:label,yMax:z.number().positive(),step:z.number().positive(),data:z.array(datum).min(1).max(8)}),
  z.object({kind:z.literal("line_chart"),title:label,unit:label,yMax:z.number().positive(),step:z.number().positive(),data:z.array(datum).min(2).max(10)}),
  z.object({kind:z.literal("data_table"),title:label,columns:z.array(label).min(2).max(6),rows:z.array(z.array(z.string().max(300)).min(2).max(6)).min(1).max(10)}),
  z.object({kind:z.literal("number_line"),title:label,min:z.number().finite(),max:z.number().finite(),step:z.number().positive(),points:z.array(datum).min(1).max(6)}),
  z.object({ kind: z.literal("flow"), title: label, items: z.array(item).min(2).max(4) }),
  z.object({ kind: z.literal("compare"), title: label, left: label, right: label,
    rows: z.array(z.object({ aspect: label, left: visualText, right: visualText })).min(2).max(4) }),
  z.object({ kind: z.literal("map"), title: label, center: label, items: z.array(item).min(2).max(4) }),
  z.object({ kind: z.literal("layers"), title: label, items: z.array(item).min(2).max(4) }),
]);


export type LessonVisual=z.infer<typeof visualSchema>;
