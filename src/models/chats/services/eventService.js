import database from "../../../database";

export class EventService {

    async getBigCategories() {
        // 임시 
        const categories = await database.bigCategory.findMany({});

        return categories;
    }

    async getMiddleCategories(bigCategory) {
        // 임시
        const isExist = await database.bigCategory.findUnique({
            where: {
                name: bigCategory,
            },
        });

        if (!isExist) throw { status: 404, msg: "not found" };

        // bigCategory 검사;
        const categories = await database.middleCategory.findMany({
            where: {
                bigName: isExist.name,
            }
        });

        return categories;
    }

    // 이 서비스는 socket에서 활용
    async getSmallCategories(middleCategory) {

        const isExist = await database.middleCategory.findUnique({
            where: {
                name: middleCategory,
            }
        });

        if (!isExist) throw { status: 404, msg: "not found" };
        // middleCategory 검사;

        const categories = await database.smallCategory.findMany({
            where: {
                middleName: isExist.name,
            }
        });

        return categories;


    }

    async getImageByFilename(filename) {

        const image = await database.eventImage.findUnique({
            where: {
                filename: filename,
            }
        });

        return image;


    }

    async createImage(payload) {

        const isExist = await database.smallCategory.findUnique({
            where: {
                id: payload.categoryId
            }
        });

        if (!isExist) throw { status: 404, msg: "not found : smallCategory ", categoryId: payload.categoryId };

        await database.$transaction(async(db)=>{
            payload.files.forEach(async (file) => {
                const image = await db.eventImage.create({
                    data: {
                        filename: file.filename,
                        filepath: file.path,
                        mimetype: file.mimetype,
                        size: file.size,
                        smallCategoryId: payload.categoryId,
                    }
                });
            });
        });
        const images = await this.db.eventImage.findMany({
            where: {
                smallCategoryId: payload.categoryId,
            }
        });
        return images;
    }

    async getEvent(payload) {

        const event = await database.event.findUnique({
            where: {
                id: payload.id
            },
            include: {
                imageInEvent: true,
            }
        });

        return event;


    }

    async createBig(big) {

        const isExist = await database.bigCategory.findUnique({
            where: {
                name: big
            }
        });

        if (isExist) throw { status: 400, msg: "already exists : BigCategory" };

        await database.bigCategory.create({
            data: {
                name: big
            }
        });
    }

    // big, middle
    async createMiddle(payload) {
        const isExist = await database.middleCategory.findUnique({
            where: {
                name: payload.middle,
                bigName: payload.big
            }
        });

        if (isExist) throw { status: 400, msg: "already exists : middle" };

        await database.middleCategory.create({
            data: {
                name: payload.middle,
                bigName: payload.big
            }
        });
    }

    // middle, small
    async createSmall(payload) {

        const isExist = await database.smallCategory.findFirst({
            where: {
                name: payload.small,
                middleName: payload.middle
            }
        });

        if (isExist) throw { status: 400, msg: "already exists : small" };

        await database.smallCategory.create({
            data: {
                name: payload.small,
                middleName: payload.middle
            }
        });

    }
}

// 채팅에 이벤트 사진 url 테이블을 만들어서 이벤트 발송