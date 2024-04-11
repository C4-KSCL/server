import database from "../../../database";
import { getNowTime } from "../../../utils/getKSTTime";

export class EventService {

    async getBigCategories() {
        // 임시 
        const categories = await database.bigCategory.findMany({
            include: {
                eventImage: {
                    select: {
                        filepath: true,
                    }
                }
            }
        });

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

        let isExist;

        if (payload.small) {
            isExist = await database.smallCategory.findUnique({
                where: {
                    id: payload.small
                }
            });

            if (!isExist) throw { status: 404, msg: "not found : smallCategory ", categoryId: payload.small };
        } else if (payload.big) {
            isExist = await database.bigCategory.findUnique({
                where: {
                    name: payload.big,
                }
            });

            if (!isExist) throw { status: 404, msg: "not found : bigCategory ", categoryId: payload.big };
        }


        console.log(payload.file.location, payload.file.key);

        const image = await database.$transaction(async (db) => {
            const image = await db.eventImage.create({
                data: {
                    filekey: payload.file.key,
                    filepath: payload.file.location,
                    createdAt : getNowTime(),
                }
            });
            if(payload.small){
                const small = await db.smallCategory.update({
                    where: {
                        id: payload.small
                    },
                    data : {
                        imageId : image.id, 
                    }
                });
            }else if(payload.big){
                const big = await db.bigCategory.update({
                    where : {
                        name : payload.big
                    },
                    data : {
                        imageId : image.id,
                    }
                });
            }
            return image;
        });

        return image;
    }

    async getEvent(payload) {

        const event = await database.event.findUnique({
            where: {
                id: payload.id
            },
            include: {
                smallCategory: {
                    include: {
                        eventImage: {
                            select: {
                                filepath: true,
                            }
                        }
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
                selectOne: payload.selectOne,
                selectTwo: payload.selectTwo,
                content : payload.content,
            }
        });

    }

    async updateAnswer(payload) {
        const isExists = await database.event.findUnique({
            where: {
                id: payload.id,
            }
        });

        const user = await database.user.findUnique({
            where : {
                email : payload.userEmail,
            }
        });

        if (!isExists) throw { status: 404, msg: "not found : event" };


        const updatedEvent = await database.$transaction(async (db) => {
            let event;

            if (isExists.user1 === user.nickname) {
                event = await db.event.update({
                    where: {
                        id: isExists.id,
                    },
                    data: {
                        user1Choice: payload.content,
                    }
                });
            } else if (isExists.user2 === user.nickname) {
                event = await db.event.update({
                    where: {
                        id: isExists.id,
                    },
                    data: {
                        user2Choice: payload.content,
                    }
                });
            } else {
                throw { status: 400, msg: "bad request" };
            }

            event = await db.event.findUnique({
                where: {
                    id: isExists.id
                },
                include: {
                    smallCategory: {
                        include: {
                            eventImage: {
                                select: {
                                    filepath: true,
                                }
                            },
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