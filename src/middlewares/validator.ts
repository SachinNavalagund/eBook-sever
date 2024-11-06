import { RequestHandler } from "express";
import { z, ZodObject, ZodRawShape } from "zod";

export const emailValidationSchema = z.object({
  email: z
    .string({
      required_error: "Email is required",
      invalid_type_error: "Invalid email type!",
    })
    .email("Invalid email!"),
});

export const newUserSchema = z.object({
  name: z
    .string({
      required_error: "Name is required",
      invalid_type_error: "Invalid name!",
    })
    .min(3, "Name must be 3 characters long")
    .trim(),
});

export const newAuthorSchema = z.object({
  name: z
    .string({
      required_error: "Name is missing!",
      invalid_type_error: "Invalid name!",
    })
    .trim()
    .min(3, "Invalid name"),
  about: z
    .string({
      required_error: "About is missing!",
      invalid_type_error: "Invalid about!",
    })
    .trim()
    .min(100, "Please write at least 100 characters about yourself!"),
  socialLinks: z
    .array(z.string().url("Social links can only be list of  valid URLs!"))
    .optional(),
});

export const newBookSchema = z.object({
  title: z
    .string({
      required_error: "Title is missing!",
      invalid_type_error: "Invalid title!",
    })
    .trim(),
  description: z
    .string({
      required_error: "Description is missing!",
      invalid_type_error: "Invalid description!",
    })
    .trim(),
  language: z
    .string({
      required_error: "Language is missing!",
      invalid_type_error: "Invalid language!",
    })
    .trim(),
  publishedAt: z.coerce.date({
    required_error: "Publish date is missing!",
    invalid_type_error: "Invalid publish date!",
  }),
  publicationName: z
    .string({
      required_error: "Publication Name is missing!",
      invalid_type_error: "Invalid publication name!",
    })
    .trim(),
  genre: z
    .string({
      required_error: "Genre is missing!",
      invalid_type_error: "Invalid genre!",
    })
    .trim(),
  price: z
    .string({
      required_error: "Price is missing!",
      invalid_type_error: "Invalid price!",
    })
    .transform((value, ctx) => {
      try {
        return JSON.parse(value);
      } catch (error) {
        ctx.addIssue({ code: "custom", message: "Invalid Price Data" });
        return z.NEVER;
      }
    })
    .pipe(
      z.object({
        mrp: z
          .number({
            required_error: "MRP is missing!",
            invalid_type_error: "Invalid mrp price!",
          })
          .nonnegative("Invalid mrp!"),
        sale: z
          .number({
            required_error: "Sale Price is missing!",
            invalid_type_error: "Invalid sale price!",
          })
          .nonnegative("Invalid sale!"),
      })
    )
    .refine(
      (price) => price.sale < price.mrp,
      "Sale price should be less than mrp!"
    ),
  fileInfo: z
    .string({
      required_error: "File info is required",
      invalid_type_error: "Invalid file info!",
    })
    .transform((value, ctx) => {
      try {
        return JSON.parse(value);
      } catch (error) {
        ctx.addIssue({ code: "custom", message: "Invalid file info!" });
        return z.NEVER;
      }
    })
    .pipe(
      z.object({
        name: z
          .string({
            required_error: "FileInfo.name is missing!",
            invalid_type_error: "Invalid file info.name!",
          })
          .trim(),
        type: z
          .string({
            required_error: "FileInfo.type is missing!",
            invalid_type_error: "Invalid file info.type!",
          })
          .trim(),
        size: z
          .number({
            required_error: "FileInfo.size is missing!",
            invalid_type_error: "Invalid file info.size!",
          })
          .nonnegative("Invalid FileInfo.size!"),
      })
    ),
});

export const validate = <T extends ZodRawShape>(
  schema: ZodObject<T>
): RequestHandler => {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (result.success) {
      req.body = result.data;
      next();
    } else {
      const errors = result.error.flatten().fieldErrors;
      res.status(422).json({ errors });
    }
  };
};
