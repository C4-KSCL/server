import fs from "fs";
import path from "path";

// payload : categoryId, files
export const deleteFiles = (payload)=>{
    try{
        if(payload.categoryId) {
            const dirpath = path.join(__dirname, '../../', 'images', `${payload.categoryId}`);
    
            fs.rm(dirpath, { recursive: true }, err => {});
    
            return;
        }
        
        payload.files.forEach((file) => {
            const filePath = path.join(__dirname, '../../', file.path);
    
            if(fs.existsSync(filePath)){
                fs.unlink(filePath, err=>{});
            }
        });

    }catch(err){
        throw { status : 500, msg : `${err}` };
    }
}