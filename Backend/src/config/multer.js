import multer from "multer";

import path from "path";

/*
|--------------------------------------------------------------------------
| Storage Config
|--------------------------------------------------------------------------
*/

const storage =
  multer.diskStorage({
    destination: (
      req,
      file,
      cb
    ) => {
      cb(
        null,
        "src/uploads"
      );
    },

    filename: (
      req,
      file,
      cb
    ) => {
      const uniqueName =
        Date.now() +
        "-" +
        file.originalname;

      cb(null, uniqueName);
    },
  });

/*
|--------------------------------------------------------------------------
| File Filter
|--------------------------------------------------------------------------
*/

const fileFilter = (
  req,
  file,
  cb
) => {
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "application/pdf",
  ];

  if (
    allowedTypes.includes(
      file.mimetype
    )
  ) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only PNG, JPG, PDF allowed"
      )
    );
  }
};

/*
|--------------------------------------------------------------------------
| Upload Middleware
|--------------------------------------------------------------------------
*/

const upload = multer({
  storage,
  fileFilter,
});

export default upload;