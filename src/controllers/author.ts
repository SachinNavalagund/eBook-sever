import AuthorModel from "@/models/author";
import { BookDoc } from "@/models/book";
import UserModel from "@/models/user";
import { RequestAuthorHandler } from "@/types";
import { sendErrorResponse } from "@/utils/helper";
import { RequestHandler } from "express";
import slugify from "slugify";

export const registerAuthor: RequestAuthorHandler = async (req, res) => {
  const { body, user } = req;
  if (!user.signedUp) {
    return sendErrorResponse({
      message: "User must be signed up before registering as author!",
      status: 401,
      res,
    });
  }

  const newAuthor = new AuthorModel({
    name: body.name,
    about: body.about,
    userId: user.id,
    socialLinks: body.socialLinks,
  });

  const uniqueSlug = slugify(`${newAuthor.name} ${newAuthor._id}`, {
    lower: true,
    replacement: "-",
  });

  newAuthor.slug = uniqueSlug;
  await newAuthor.save();

  await UserModel.findByIdAndUpdate(user.id, {
    role: "author",
    authorId: newAuthor._id,
  });

  res.json({ message: "Thanks for registering as an Author." });
};

export const updateAuthor: RequestAuthorHandler = async (req, res) => {
  const { body, user } = req;

  await AuthorModel.findByIdAndUpdate(user.authorId, {
    name: body.name,
    about: body.about,
    socialLinks: body.socialLinks,
  });

  res.json({ message: "Your details updated successfully." });
};

export const getAuthorDetails: RequestHandler = async (req, res) => {
  const { id } = req.params;

  const author = await AuthorModel.findById(id).populate<{ books: BookDoc[] }>(
    "books"
  );
  console.log(author);

  if (!author) {
    return sendErrorResponse({
      message: "Author not found",
      status: 404,
      res,
    });
  }

  res.json({
    id: author._id,
    name: author.name,
    about: author.about,
    socialLinks: author.socialLinks,
    books: author.books?.map((book) => {
      return {
        id: book._id?.toString(),
        title: book.title,
        slug: book.slug,
        genre: book.genre,
        price: {
          mrp: (book.price.mrp / 100).toFixed(2),
          sale: (book.price.sale / 100).toFixed(2),
        },
        cover: book.cover?.url,
        rating: book.averageRating?.toFixed(1),
      };
    }),
  });
};
