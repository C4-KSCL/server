import multer from "multer";
import fs from "fs";

export const imageUpload = multer({
    storage: multer.diskStorage(
        {
            destination: function (req, file, cb) {
                const dir = `images/${req.params.categoryId}`;
                // dir이 없으면 생성
                !fs.existsSync(dir) && fs.mkdirSync(dir);

                cb(null, dir);
            },
            filename: function (req, file, cb) {
                cb(
                    null,
                    new Date().valueOf() + 
                    '_' +
                    file.originalname
                );
            }
        }
    ),
})