import BookModel, { BookDoc } from "@/models/book";
import { CreateBookRequestHandler, UpdateBookRequestHandler } from "@/types";
import { formatFileSize, sendErrorResponse } from "@/utils/helper";
import { DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { isValidObjectId, ObjectId, Types } from "mongoose";
import slugify from "slugify";
import s3Client from "@/cloud/aws";
import {
  generateFileUploadUrl,
  uploadBookCoverToAws,
} from "@/utils/fileUpload";
import AuthorModel from "@/models/author";
import { RequestHandler } from "express";
import UserModel from "@/models/user";
import HistoryModel, { Settings } from "@/models/history";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const createNewBook: CreateBookRequestHandler = async (req, res) => {
  const { body, files, user } = req;
  const {
    title,
    description,
    genre,
    language,
    fileInfo,
    price,
    publicationName,
    publishedAt,
  } = body;

  const { cover } = files;

  const newBook = new BookModel<BookDoc>({
    title,
    description,
    genre,
    language,
    fileInfo: { size: formatFileSize(fileInfo.size), id: "" },
    price,
    publicationName,
    publishedAt,
    slug: "",
    author: new Types.ObjectId(user.authorId),
  });

  newBook.slug = slugify(`${newBook.title} ${newBook._id}`, {
    lower: true,
    replacement: "-",
  });

  const fileName = slugify(`${newBook._id} ${newBook.title}.epub`, {
    lower: true,
    replacement: "-",
  });

  const fileUploadUrl = await generateFileUploadUrl(s3Client, {
    bucket: process.env.AWS_PRIVATE_BUCKET!,
    contentType: fileInfo.type,
    uniqueKey: fileName,
  });

  //   newBook.fileInfo?.id = fileName;

  if (cover && !Array.isArray(cover) && cover.mimetype?.startsWith("image")) {
    const uniqueFileName = slugify(`${newBook._id} ${newBook.title}.png`, {
      lower: true,
      replacement: "-",
    });

    newBook.cover = await uploadBookCoverToAws(cover.filepath, uniqueFileName);
  }

  await AuthorModel.findByIdAndUpdate(user.authorId, {
    $push: {
      books: newBook._id,
    },
  });

  await newBook.save();
  res.send(fileUploadUrl);
};

export const updateBook: UpdateBookRequestHandler = async (req, res) => {
  const { body, files, user } = req;
  const {
    title,
    description,
    genre,
    language,
    fileInfo,
    price,
    publicationName,
    publishedAt,
    slug,
  } = body;

  const { cover, book: newBookFile } = files;

  const book = await BookModel.findOne({
    slug,
    author: user.authorId,
  });

  if (!book) {
    return sendErrorResponse({
      message: "Book not found!",
      status: 404,
      res,
    });
  }

  book.title = title;
  book.description = description;
  book.genre = genre;
  book.language = language;
  book.publicationName = publicationName;
  book.publishedAt = publishedAt;
  book.price = price;

  let fileUploadUrl = "";

  if (
    newBookFile &&
    !Array.isArray(newBookFile) &&
    newBookFile.mimetype === "application/epub+zip"
  ) {
    //remove old book from cloud(bucket)
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_PRIVATE_BUCKET,
      Key: book.fileInfo?.id,
    });

    await s3Client.send(deleteCommand);

    //generate(sign) new url to upload book
    const fileName = slugify(`${book._id} ${book.title}.epub`, {
      lower: true,
      replacement: "-",
    });

    fileUploadUrl = await generateFileUploadUrl(s3Client, {
      bucket: process.env.AWS_PRIVATE_BUCKET!,
      contentType: fileInfo?.type || newBookFile.mimetype,
      uniqueKey: fileName,
    });
  }

  if (cover && !Array.isArray(cover) && cover.mimetype?.startsWith("image")) {
    //remove old cover from the cloud(bucket)
    if (book.cover?.id) {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: process.env.AWS_PUBLIC_BUCKET,
        Key: book.cover?.id,
      });
      await s3Client.send(deleteCommand);
    }

    //upload new cover to the cloud (bucket)
    const uniqueFileName = slugify(`${book._id} ${book.title}.png`, {
      lower: true,
      replacement: "-",
    });

    book.cover = await uploadBookCoverToAws(cover.filepath, uniqueFileName);
  }

  await book.save();

  res.send(fileUploadUrl);
};

interface PopulatedBooks {
  cover?: {
    url: string;
    id: string;
  };
  _id: ObjectId;
  author: {
    _id: ObjectId;
    name: string;
    slug: string;
  };
  title: string;
  slug: string;
}

export const getAllPurchasedBooks: RequestHandler = async (req, res) => {
  const user = await UserModel.findById(req.user.id).populate<{
    books: PopulatedBooks[];
  }>({
    path: "books",
    select: "author title cover slug",
    populate: { path: "author", select: "slug name" },
  });

  if (!user) {
    res.json({ books: [] });
    return;
  }

  res.json({
    books: user.books.map((book) => ({
      id: book._id,
      title: book.title,
      cover: book.cover?.url,
      slug: book.slug,
      author: {
        name: book.author.name,
        slug: book.author.slug,
        id: book.author._id,
      },
    })),
  });
};

export const getAllBooks: RequestHandler = async (req, res) => {
  const books = await BookModel.find().limit(5);
  res.json({ books });
};

export const getBooksPublicDetails: RequestHandler = async (req, res) => {
  const book = await BookModel.findOne({ slug: req.params.slug }).populate<{
    author: PopulatedBooks["author"];
  }>({
    path: "author",
    select: "name slug",
  });

  if (!book) {
    return sendErrorResponse({
      status: 404,
      message: "Book not found!",
      res,
    });
  }

  const {
    _id,
    title,
    cover,
    author,
    slug,
    description,
    genre,
    language,
    publicationName,
    publishedAt,
    price: { mrp, sale },
    fileInfo,
    averageRating,
  } = book;

  res.json({
    book: {
      id: _id,
      title,
      cover: cover?.url,
      author: {
        id: author._id,
        name: author.name,
        slug: author.slug,
      },
      slug,
      description,
      genre,
      language,
      publicationName,
      publishedAt: publishedAt.toISOString().split("T")[0],
      rating: averageRating?.toFixed(1),
      price: {
        mrp: (mrp / 100).toFixed(2),
        sale: (sale / 100).toFixed(2),
      },
      fileInfo,
    },
  });
};

export const getBookByGenre: RequestHandler = async (req, res) => {
  const books = await BookModel.find({ genre: req.params.genre }).limit(5);
  res.json({
    books: books.map((book) => {
      const {
        _id,
        title,
        cover,
        averageRating,
        slug,
        genre,
        price: { mrp, sale },
      } = book;
      return {
        id: _id,
        title,
        genre,
        slug,
        cover: cover?.url,
        rating: averageRating?.toFixed(1),
        price: {
          mrp: (mrp / 100).toFixed(2),
          sale: (sale / 100).toFixed(2),
        },
      };
    }),
  });
};

export const generateBookAccessUrl: RequestHandler = async (req, res) => {
  const { slug } = req.params;

  const book = await BookModel.findOne({ slug });

  if (!book) {
    return sendErrorResponse({
      message: "Book not found!",
      status: 404,
      res,
    });
  }

  const user = await UserModel.findOne({
    _id: req.user.id,
    books: book._id,
  });

  if (!user) {
    return sendErrorResponse({
      message: "User not found!",
      status: 404,
      res,
    });
  }

  const history = await HistoryModel.findOne({
    reader: req.user.id,
    bookId: book._id,
  });

  const settings: Settings = {
    lastLocation: "",
    highlights: [],
  };

  if (history) {
    settings.highlights = history.highlights.map((h) => ({
      fill: h.fill,
      selection: h.selection,
    }));
    settings.lastLocation = history.lastLocation;
  }

  //generate access url
  const bookGetCommand = new GetObjectCommand({
    Bucket: process.env.AWS_PRIVATE_BUCKET,
    Key: book.fileInfo?.id,
  });

  console.log("Book command", bookGetCommand);

  const accessUrl = await getSignedUrl(s3Client, bookGetCommand);

  console.log("Access url", accessUrl);

  res.json({ settings, url: accessUrl });
};

interface RecommendedBooks {
  id: string;
  title: string;
  genre: string;
  slug: string;
  cover?: string;
  rating?: string;
  price: {
    mrp: string;
    sale: string;
  };
}

export interface AggregateResult {
  _id: ObjectId;
  title: string;
  genre: string;
  price: {
    mrp: string;
    sale: string;
    _id: ObjectId;
  };
  cover?: {
    url: string;
    id: string;
    _id: ObjectId;
  };
  slug: string;
  averageRatings?: string;
}

export const getRecommendedBooks: RequestHandler = async (req, res) => {
  const { bookId } = req.params;

  if (!isValidObjectId(bookId)) {
    return sendErrorResponse({
      message: "Invalid book id!",
      status: 403,
      res,
    });
  }

  const book = await BookModel.findById(bookId);

  if (!book) {
    return sendErrorResponse({
      message: "Book not found!",
      status: 403,
      res,
    });
  }

  const recommendedBooks = await BookModel.aggregate<AggregateResult>([
    {
      $match: {
        genre: book.genre,
        _id: { $ne: book._id },
      },
    },
    {
      $lookup: {
        localField: "_id",
        from: "reviews",
        foreignField: "book",
        as: "reviews",
      },
    },
    {
      $addFields: {
        averageRatings: { $avg: "$reviews.rating" },
      },
    },
    {
      $sort: { averageRatings: -1 },
    },
    {
      $limit: 5,
    },
    {
      $project: {
        _id: 1,
        title: 1,
        slug: 1,
        genre: 1,
        price: 1,
        cover: 1,
        averageRatings: 1,
      },
    },
  ]);

  const result = recommendedBooks.map<RecommendedBooks>((book) => ({
    id: book._id.toString(),
    title: book.title,
    slug: book.slug,
    genre: book.genre,
    price: { mrp: book.price.mrp, sale: book.price.sale },
    cover: book.cover?.url,
    rating: book.averageRatings,
  }));

  res.json(result);
};
