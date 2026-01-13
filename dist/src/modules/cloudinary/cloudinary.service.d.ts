export declare class CloudinaryService {
    constructor();
    uploadResume(file: Express.Multer.File, userId: string): Promise<{
        url: string;
        publicId: string;
    }>;
    deleteResume(publicId: string): Promise<void>;
}
