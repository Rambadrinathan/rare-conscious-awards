import { z } from "zod";
import { AWARD_CATEGORIES, TOUCHSTONES } from "./touchstones";

const awardIds = AWARD_CATEGORIES.map((a) => a.id) as [string, ...string[]];
const touchstoneKeys = TOUCHSTONES.map((t) => t.key) as [string, ...string[]];

const supportingFileSchema = z.object({
  name: z.string().min(1).max(200),
  mime: z.string().min(3).max(120),
  size: z.number().int().positive().max(1_200_000),
  data_base64: z.string().min(1),
  kind: z.enum(["image", "document"]),
});

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
    lightkeeper_why: z.string().optional(),
    lightkeeper_accomplishments: z.string().optional(),
    lightkeeper_achievements: z.string().optional(),
    lightkeeper_pushing_for: z.string().optional(),
    signature_story: z.string().optional(),
    sustainability_lead: z.string().optional(),
    evidence_url: z
      .string()
      .url("Please enter a full URL, or leave blank")
      .optional()
      .or(z.literal("")),
    supporting_files: z.array(supportingFileSchema).max(8).optional(),
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
          // Optional per-touchstone evidence
          supporting_files: z.array(supportingFileSchema).max(5).optional(),
          evidence_url: z
            .string()
            .url("Please enter a full URL, or leave blank")
            .optional()
            .or(z.literal("")),
        })
      )
      .default([]),
  })
  .superRefine((data, ctx) => {
    const award = AWARD_CATEGORIES.find((a) => a.id === data.award_category);
    const files = data.supporting_files || [];
    const images = files.filter((f) => f.kind === "image");
    const docs = files.filter((f) => f.kind === "document");
    if (images.length > 5) {
      ctx.addIssue({
        code: "custom",
        path: ["supporting_files"],
        message: "Up to 5 supporting images allowed",
      });
    }
    if (docs.length > 3) {
      ctx.addIssue({
        code: "custom",
        path: ["supporting_files"],
        message: "Up to 3 supporting documents allowed",
      });
    }

    if (award?.formStyle === "lightkeeper") {
      if (!data.nominee_name?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["nominee_name"],
          message: "Nominee name is required for the Sustainability Lightkeeper award",
        });
      }
      const requiredLk: Array<[string | undefined, string, (string | number)[]]> = [
        [data.lightkeeper_why, "Why this person is chosen (at least a few sentences)", [
          "lightkeeper_why",
        ]],
        [
          data.lightkeeper_accomplishments,
          "Describe what they have accomplished",
          ["lightkeeper_accomplishments"],
        ],
        [
          data.lightkeeper_achievements,
          "Share their key achievements",
          ["lightkeeper_achievements"],
        ],
        [
          data.lightkeeper_pushing_for,
          "What are they pushing for next?",
          ["lightkeeper_pushing_for"],
        ],
      ];
      for (const [val, msg, path] of requiredLk) {
        if (!val || val.trim().length < 20) {
          ctx.addIssue({ code: "custom", path, message: msg });
        }
      }
      return;
    }

    // Lighthouse: full pinwheel answers
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
