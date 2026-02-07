"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CloudinaryService", {
    enumerable: true,
    get: function() {
        return CloudinaryService;
    }
});
const _common = require("@nestjs/common");
const _cloudinary = require("cloudinary");
const _stream = require("stream");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CloudinaryService = class CloudinaryService {
    async uploadResume(file, userId) {
        return new Promise((resolve, reject)=>{
            const uploadStream = _cloudinary.v2.uploader.upload_stream({
                folder: `jobrefer/resumes/${userId}`,
                resource_type: 'raw',
                public_id: `resume_${Date.now()}`,
                overwrite: true
            }, (error, result)=>{
                if (error) return reject(error);
                if (!result) return reject(new Error('Upload failed - no result'));
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            });
            // Convert buffer to stream and pipe to Cloudinary
            const bufferStream = new _stream.Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
        });
    }
    async deleteResume(publicId) {
        await _cloudinary.v2.uploader.destroy(publicId, {
            resource_type: 'raw'
        });
    }
    async uploadTestimonialImage(file) {
        return new Promise((resolve, reject)=>{
            const uploadStream = _cloudinary.v2.uploader.upload_stream({
                folder: 'jobrefer/testimonials',
                resource_type: 'image',
                public_id: `testimonial_${Date.now()}`,
                overwrite: true,
                transformation: [
                    {
                        width: 400,
                        height: 400,
                        crop: 'fill',
                        gravity: 'face'
                    },
                    {
                        quality: 'auto:good'
                    },
                    {
                        format: 'webp'
                    }
                ]
            }, (error, result)=>{
                if (error) return reject(error);
                if (!result) return reject(new Error('Upload failed - no result'));
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id
                });
            });
            // Convert buffer to stream and pipe to Cloudinary
            const bufferStream = new _stream.Readable();
            bufferStream.push(file.buffer);
            bufferStream.push(null);
            bufferStream.pipe(uploadStream);
        });
    }
    async deleteImage(publicId) {
        await _cloudinary.v2.uploader.destroy(publicId, {
            resource_type: 'image'
        });
    }
    constructor(){
        _cloudinary.v2.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });
    }
};
CloudinaryService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [])
], CloudinaryService);

//# sourceMappingURL=cloudinary.service.js.map