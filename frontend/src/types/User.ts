export interface User {
    email?: string;
    role?: string;
    token?: number;
    _id: string;
    createdAt: Date;
    updatedAt: Date;
    __v: number;
}

export interface IGenericResponse {
    status: string;
    message: string;
}
