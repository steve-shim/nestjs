import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';

@Module({
  // entity에 정의된 테이블을 import 해옴
  imports: [
    TypeOrmModule.forFeature([
      Movie,
    ])
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
