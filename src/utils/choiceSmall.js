import database from "../database";

export async function RandomChoice(middleCategory){

    const isExist = await database.middleCategory.findUnique({
        where : {
            name : middleCategory,
        }
    });

    if(!isExist) throw { status : 404, msg : "Not found : middleCategory"};

    const smallCategories = await database.smallCategory.findMany({
        where : {
            middleName : middleCategory,
        }
    });

    if(smallCategories.length===0) throw { status : 400, msg : "Bad Request : Not found small on middle"};


    // random choice
    const index = Math.floor(Math.random() * smallCategories.length);

    return smallCategories[index];
}