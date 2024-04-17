import { Router } from "express";
import { EventService } from "../services/eventService";
import path from "path";
import { param, body } from "express-validator";

import { upload, imageDelete } from "../../../middlewares/multer";
import { validatorErrorChecker } from "../../../middlewares/validator";

import database from "../../../database";

import { deleteFiles } from "../../../utils/deleteFiles";

const service = new EventService();
const router = Router();

router.get("/get-big", getBigs);

router.get("/get-small/:bigName", [
    param('bigName'),
    validatorErrorChecker,
], getSmalls);

router.post("/upload-small-image/:categoryId",
    [param('categoryId'), body('image'), validatorErrorChecker],
    upload.single('image'),
postSmallImages);

router.get("/get-image/:filename", [
    param('filename'),
    validatorErrorChecker,
], getEventImage);

router.get("/get-event-page/:id", [
    param('id'),
    validatorErrorChecker,
], getEventPage);

router.post("/create-big-event", [
    body('big'),
    validatorErrorChecker,
], postBigEvent);

router.post("/create-small-event", [
    body("small"),
    body("big"),
    body("selectOne"),
    body("selectTwo"),
    body("content"),
    validatorErrorChecker,
], postSmallEvent);

// router.patch("/update-event-answer/:id", [
//     param("id"),
//     body("content"),
//     validatorErrorChecker,
// ], patchEventAnswer);

router.post("/upload-big-image/:name", [
    param("name"),
    body("image"),
    validatorErrorChecker
], upload.single('image'),
postBigImage);

router.delete("/delete-image/:id", [
    param("id"),
    validatorErrorChecker
], imageDelete,);

// 이벤트 빅 카테고리 반환
async function getBigs(req, res, next) {
    try {
        const categories = await service.getBigCategories();

        res.status(200).json({ categories: categories });
    } catch (err) {
        next(err);
    }
}

async function getSmalls(req, res, next) {
    try {
        const { bigName } = req.params;

        const smallCategories = await service.getSmallCategories(bigName);

        res.status(200).json({ categories: smallCategories });
    } catch (err) {
        next(err);
    }
}

async function postSmallImages(req, res, next) {
    const { categoryId } = req.params;

    try {
        const image = await service.createImage({ file: req.file, small: Number(categoryId) });

        if (!image) throw { status: 500, msg: "fail to upload image" };

        res.status(201).json({ image: image });

    } catch (err) {
        next(err);
    }
}

async function getEventImage(req, res, next) {
    try {
        const { filename } = req.params;

        const image = await service.getImageByFilename(filename);

        if (!image) throw { status: 404, msg: "not found" };

        const dirname = path.resolve();
        const fullPath = path.join(dirname, image.filepath);

        res.type(image.mimetype).sendFile(fullPath);
    } catch (err) {
        next(err);
    }
}

// 이벤트 페이지에 대한 정보를 제공
// 
async function getEventPage(req, res, next) {
    try {
        const { id } = req.params;

        const event = await service.getEvent({ id: Number(id) });

        res.status(200).json({ event: event });
    } catch (err) {
        next(err);
    }
}

async function postBigEvent(req, res, next) {
    try {
        const { big } = req.body;

        await service.createBig(big);

        res.status(201).json({ msg: "true" });
    } catch (err) {
        next(err);
    }
}

async function postSmallEvent(req, res, next) {
    try {
        const { big, small, selectOne, selectTwo, content } = req.body;

        await service.createSmall({ big: big, small: small, selectOne: selectOne, selectTwo: selectTwo, content: content });

        res.status(201).json({ msg: "true" });
    } catch (err) {
        next(err);
    }
}

async function patchEventAnswer(req, res, next) {
    try {
        const { content } = req.body;

        const { id } = req.params;

        const user = req.user;

        const event = await service.updateAnswer({ content: content, id: Number(id), userEmail: user });

        res.status(200).json({ event: event });
    } catch (err) {
        next(err);
    }
}

async function postBigImage(req, res, next) {
    const { name } = req.params;

    try {

        const image = await service.createImage({ file: req.file, big: name });

        if (!image) throw { status: 500, msg: "fail to upload image" };

        res.status(201).json({ image: image });

    } catch (err) {
        next(err);
    }
}

export default router;