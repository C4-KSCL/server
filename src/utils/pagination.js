export default function pagination(page, limit) {
    const skip = ((Number(page)-1) * Number(limit)) || 0;
    const take = Number(limit) || 20;

    return { skip, take };
}
