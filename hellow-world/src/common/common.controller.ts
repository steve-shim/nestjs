import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('common')
export class CommonController {
    @Post('video')
    @UseInterceptors(FileInterceptor('video', {
        limits: {
          fileSize: 20000000 // 20 MB
        },
        fileFilter(req, file, callback) {
          console.log(file);
          if(file.mimetype === 'video/mp4') {
            return callback(
              new BadRequestException('MP4 타입만 업로드 불가!'),
              false // 에러가 나면 파일을 받지 않겠다
            )
          }
    
          return callback(null, true); // 에러가 없으면 파일을 받겠다
        }
    }))
    createVideo(
        @UploadedFile() movie: Express.Multer.File,
    ) {
        return {
            fileName: movie.filename,
        }
    }
}
