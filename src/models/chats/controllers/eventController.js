import { Router } from "express";
import { EventService } from "../services/eventService";
import path from "path";
import { param, body } from "express-validator";

import { imageUpload } from "../../../middlewares/multer";
import { validatorErrorChecker } from "../../../middlewares/validator";

import database from "../../../database";

import { deleteFiles } from "../../../utils/deleteFiles";


class EventController {
    path = "/chats/events";
    router;
    service;

    constructor() {
        this.router = Router();
        this.service = new EventService();
        this.init();
    }

    init() {
        this.router.get("/get-big", this.getBigs.bind(this));

        this.router.get("/get-middle/:bigName", [
            param('bigName'),
            validatorErrorChecker
        ], this.getMiddles.bind(this));

        this.router.get("/get-small/:middleName", [
            param('middleName'),
            validatorErrorChecker,
        ]
            , this.getSmalls.bind(this));

        this.router.post("/upload-image/:categoryId",
            [param('categoryId'), body('images'), validatorErrorChecker],
            imageUpload.array('images'),
            this.postImages.bind(this));

        this.router.get("/get-image/:filename", [
            param('filename'),
            validatorErrorChecker,
        ], this.getEventImage.bind(this));

        this.router.get("/get-event-page/:id", [
            param('id'),
            validatorErrorChecker,
        ], this.getEventPage.bind(this));

        this.router.post("/create-big-event", [
            body('big'),
            validatorErrorChecker,
        ], this.postBigEvent.bind(this));

        this.router.post("/create-middle-event", [
            body("big"),
            body("middle"),
            validatorErrorChecker
        ], this.postMiddleEvent.bind(this));

        this.router.post("/create-small-event", [
            body("middle"),
            body("small"),
            validatorErrorChecker,
        ], this.postSmallEvent.bind(this));

        this.router.get("/get-event-page/:id", [
            param("id"),
            validatorErrorChecker,
        ], this.getEventPage.bind(this));
    }

    // 이벤트 빅 카테고리 반환
    async getBigs(req, res, next) {
        try {

            const categories = await database.$transaction(async (db) => {
                this.service.setDB(db);

                return await this.service.getBigCategories();
            });

            res.status(200).json({ categories: categories });
        } catch (err) {
            next(err);
        }
    }

    async getMiddles(req, res, next) {
        try {
            const { bigName } = req.params;

            const middleCategories = await database.$transaction(async (db) => {
                this.service.setDB(db);

                return await this.service.getMiddleCategories(bigName);
            });

            res.status(200).json({ categories: middleCategories })
        } catch (err) {
            next(err);
        }
    }

    async getSmalls(req, res, next) {
        try {
            const { middleName } = req.params;

            const smallCategories = await database.$transaction(async (db) => {
                this.service.setDB(db);

                return await this.service.getSmallCategories(middleName);
            });

            res.status(200).json({ categories: smallCategories });
        } catch (err) {
            next(err);
        }
    }

    async postImages(req, res, next) {
        const { categoryId } = req.params;

        try {
            const images = await database.$transaction(async (db) => {
                this.service.setDB(db);

                return await this.service.createImage({ files: req.files, categoryId: Number(categoryId) });
            });

            if (!images) throw { status: 500, msg: "fail to upload image" };

            res.status(201).json({ images: images });

        } catch (err) {
            if (err.categoryId) {
                deleteFiles({ files: req.files, categoryId: err.categoryId });
            } else {
                deleteFiles({ files: req.files });
            }
            next(err);
        }
    }

    async getEventImage(req, res, next) {
        try {
            const { filename } = req.params;

            const image = await database.$transaction(async (db) => {
                this.service.setDB(db);

                return await this.service.getImageByFilename(filename);
            });

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
    async getEventPage(req, res, next) {
        try {
            const { id } = req.params;

            const event = await database.$transaction(async (db) => {
                this.service.setDB(db);

                return await this.service.getEvent({ id: Number(id) });
            });

            res.status(200).json({ event: event });
        } catch (err) {
            next(err);
        }
    }

    async postBigEvent(req, res, next) {
        try {
            const { big } = req.body;

            await database.$transaction(async (db) => {
                this.service.setDB(db);

                await this.service.createBig(big);
            });

            res.status(201).json({ msg: "true" });
        } catch (err) {
            next(err);
        }
    }

    async postMiddleEvent(req, res, next) {
        try {
            const { big, middle } = req.body;

            await database.$transaction(async (db) => {
                this.service.setDB(db);

                await this.service.createMiddle({ big: big, middle: middle });
            });

            res.status(201).json({ msg: "true" });
        } catch (err) {
            next(err);
        }
    }

    async postSmallEvent(req, res, next) {
        try {
            const { middle, small } = req.body;

            await database.$transaction(async (db) => {
                this.service.setDB(db);

                await this.service.createSmall({ middle: middle, small: small });
            });

            res.status(201).json({ msg: "true" });
        } catch (err) {
            next(err);
        }
    }
}

const eventController = new EventController();
export default eventController;