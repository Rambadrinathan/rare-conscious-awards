import { z } from "zod";
import { AWARD_CATEGORIES, TOUCHSTONES } from "./touchstones";

const awardIds = AWARD_CATEGORIES.map((a) => a.id) as [string, ...string[]];
const touchstoneKeys = TOUCHSTONES.map((t) => t.key) as [string, ...string[]];

export const nominationSchema = z
  .object({
    hotel_name: z.string().min(2, "Please select or enter your hotel name"),
    hotel_not_listed: z.boolean().default(false),
    contact_name: z.string().min(2, "Your name is required"),
    contact_email: z.string().email("A valid email is required"),
    contact_phone: z.string().optional(),
    award_category: z.enum(awardIds),
    nominee_name: z.string().optional(),
    nominee_role: z.string().optional(),
    signature_story: z.string().optional(),
    sustainability_lead: z.string().optional(),
    evidence_url: z
      .string()
      .url("Please enter a full URL, or leave blank")
      .optional()
      .or(z.literal("")),
    consent: z.boolean().refine((v) => v === true, {
      message: "Please confirm that this submission is accurate",
    }),
    website_honeypot: z.string().max(0).optional(),
    answers: z
      .array(
        z.object({
          touchstone_key: z.enum(touchstoneKeys),
          not_applicable: z.boolean(),
          answer_text: z.string(),
        })
      )
      .length(TOUCHSTONES.length),
  })
  .superRefine((data, ctx) => {
    const award = AWARD_CATEGORIES.find((a) => a.id === data.award_category);
    if (award?.needsNominee) {
      if (!data.nominee_name?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["nominee_name"],
          message: "Nominee name is required for the Sustainability Lightkeeper award",
        });
      }
    }

    // Cardinals must have real answers; ordinals may be N/A
    for (const ts of TOUCHSTONES) {
      const ans = data.answers.find((a) => a.touchstone_key === ts.key);
      if (!ans) {
        ctx.addIssue({
          code: "custom",
          path: ["answers"],
          message: `Missing answer for ${ts.name}`,
        });
        continue;
      }
      if (ans.not_applicable) {
        if (!ts.allowNa) {
          ctx.addIssue({
            code: "custom",
            path: ["answers"],
            message: `${ts.name} cannot be marked not applicable`,
          });
        }
        continue;
      }
      if (!ans.answer_text.trim() || ans.answer_text.trim().length < 20) {
        ctx.addIssue({
          code: "custom",
          path: ["answers"],
          message: `Please write a short answer for ${ts.name} (a few sentences)`,
        });
      }
    }
  });

export type NominationFormData = z.infer<typeof nominationSchema>;
