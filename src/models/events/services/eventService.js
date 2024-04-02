import database from "../../../database";

export class EventService {

    async getBigCategories() {
        // 임시 
        const categories = await database.bigCategory.findMany({});

        return categories;
    }

    // 이 서비스는 socket에서 활용
    async getSmallCategories(bigCategory) {

        const isExist = await database.bigCategory.findUnique({
            where: {
                name: bigCategory,
            }
        });

        if (!isExist) throw { status: 404, msg: "not found : bigCategory" };
        // middleCategory 검사;

        const categories = await database.smallCategory.findMany({
            where: {
                bigName: isExist.name,
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
                smallCategory : {
                    include : {
                        eventImage : true,
                    }
                },
                // eventUser1 : {
                //     select : {
                //         nickname : true,
                //         email : true,
                //         userImage : true,
                //     }
                // },
                // eventUser2 : {
                //     select : {
                //         nickname : true,
                //         email : true,
                //         userImage : true,
                //     }
                // }
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

    // middle, small
    async createSmall(payload) {

        const isExist = await database.smallCategory.findFirst({
            where: {
                name: payload.small,
                bigName: payload.big
            }
        });

        if (isExist) throw { status: 400, msg: "already exists : small" };

        await database.smallCategory.create({
            data: {
                name: payload.small,
                bigName: payload.big,
                selectOne : payload.selectOne,
                selectTwo : payload.selectTwo,
            }
        });

    }
    
    async updateAnswer(payload){
        const isExists = await database.event.findUnique({
            where : {
                id : payload.id,
            }
        });

        if(!isExists) throw { status : 404, msg : "not found : event" };

        const updatedEvent = await database.$transaction(async(db)=>{
            let event;

            if(isExists.user1 === payload.userEmail){
                event = await db.event.update({
                    where : {
                        id : isExists.id,
                    },
                    data : {
                        user1Choice : payload.content,
                    }
                });
            }else if(isExists.user2 === payload.userEmail){
                event = await db.event.update({
                    where : {
                        id : isExists.id,
                    },
                    data : {
                        user2Choice : payload.content,
                    }
                });
            }else{
                throw { status : 400, msg : "bad request"};
            }

            event = await db.event.findUnique({
                where: {
                    id: isExists.id
                },
                include: {
                    smallCategory : {
                        include : {
                            eventImage : true,
                        }
                    },
                    // eventUser1 : {
                    //     select : {
                    //         nickname : true,
                    //         email : true,
                    //         userImage : true,
                    //     }
                    // },
                    // eventUser2 : {
                    //     select : {
                    //         nickname : true,
                    //         email : true,
                    //         userImage : true,
                    //     }
                    // }
                }
            });
    
            return event;
        });

        return updatedEvent;
    }
}

// 채팅에 이벤트 사진 url 테이블을 만들어서 이벤트 발송