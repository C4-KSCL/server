export class CreateRoomDTO{
    id;
    name;
    constructor(name){
        this.id = new Date().getTime().toString();
        this.name = name ?? this.id;
    }
}