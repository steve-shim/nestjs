import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { User } from 'src/user/entities/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';

@Module({
  // entity에 정의된 테이블을 import 해옴
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      MovieUserLike,
      Director,
      Genre,
      User
    ]),
    CommonModule, // CommonModule에서 CommonService를 export하고 있기 때문에
    // MulterModule.register({
    //   storage: diskStorage({
    //     destination: join(process.cwd(), 'public', 'movie'),
    //     // filename: (req, file, cb) => {
    //     //   const split = file.originalname.split('.');

    //     //   let extension = 'mp4';

    //     //   if(split.length > 1){ 
    //     //     extension = split[split.length - 1];
    //     //   }

    //     //   cb(null, `${v4()}_${Date.now()}.${extension}`)
    //     // }
    //   })
    // })
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
